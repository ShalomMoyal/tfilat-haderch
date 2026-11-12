'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth, requireAdmin, requireOwnerOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const optionalText = (max: number) => z.preprocess(
  (value) => value === '' || value == null ? null : value,
  z.string().trim().max(max).nullable().optional(),
)

const productSchema = z.object({
  name: z.string().trim().min(2, 'Enter a product name.').max(150),
  brand: optionalText(100),
  category: optionalText(80),
  countryId: z.string().cuid('Choose a country.'),
  cityId: z.string().cuid('Choose a city.'),
  description: optionalText(1500),
  kosherInfo: z.string().trim().min(2, 'Enter the local kosher information.').max(1500),
  imageUrl: z.preprocess(
    (value) => value === '' || value == null ? null : value,
    z.string().trim().url('Enter a valid image URL.').max(2000).nullable().optional(),
  ).refine((value) => !value || value.startsWith('https://') || value.startsWith('http://'), 'Image URL must use HTTP or HTTPS.'),
})

const statusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])
const productIdSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/)
const searchSchema = z.object({
  search: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  countryId: z.preprocess((value) => value === '' ? undefined : value, z.string().cuid().optional()),
  cityId: z.preprocess((value) => value === '' ? undefined : value, z.string().cuid().optional()),
  page: z.number().int().min(1).max(10000).default(1),
  take: z.number().int().min(1).max(48).default(12),
})

export type PublicKosherProduct = {
  id: string
  name: string
  brand: string | null
  category: string | null
  description: string | null
  kosherInfo: string | null
  imageUrl: string | null
  country: { id: string; name: string } | null
  city: { id: string; name: string } | null
}

export async function getPublicKosherProducts(input: unknown = {}): Promise<PublicKosherProduct[]> {
  const parsed = searchSchema.safeParse(input)
  if (!parsed.success) return []
  const { search, brand, category, countryId, cityId, page, take } = parsed.data
  try {
    return await prisma.kosherProduct.findMany({
      where: {
        status: 'ACTIVE',
        ...(brand ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
        ...(category ? { category } : {}),
        ...(countryId ? { countryId } : {}),
        ...(cityId ? { cityId } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        description: true,
        kosherInfo: true,
        imageUrl: true,
        country: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * take,
      take,
    })
  } catch {
    return []
  }
}

export async function countPublicKosherProducts(input: unknown = {}) {
  const parsed = searchSchema.safeParse(input)
  if (!parsed.success) return 0
  const { search, brand, category, countryId, cityId } = parsed.data
  return prisma.kosherProduct.count({
    where: {
      status: 'ACTIVE',
      ...(brand ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
      ...(category ? { category } : {}),
      ...(countryId ? { countryId } : {}),
      ...(cityId ? { cityId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
  })
}

export async function createKosherProduct(input: unknown) {
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    return { error: 'Sign in before submitting a product.' }
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the product details.' }
  const locationError = await validateLocation(parsed.data.countryId, parsed.data.cityId)
  if (locationError) return { error: locationError }

  try {
    const product = await prisma.kosherProduct.create({
      data: { ...parsed.data, status: 'PENDING', createdById: session.user.id },
      select: { id: true },
    })
    revalidateProductPaths(product.id)
    return { success: true, id: product.id }
  } catch {
    return { error: 'Could not submit the product right now. Please try again.' }
  }
}

export async function updateKosherProduct(id: unknown, input: unknown) {
  const parsedId = productIdSchema.safeParse(id)
  if (!parsedId.success) return { error: 'This product could not be found.' }
  const current = await prisma.kosherProduct.findUnique({ where: { id: parsedId.data }, select: { createdById: true, status: true } })
  if (!current) return { error: 'This product could not be found.' }

  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireOwnerOrAdmin(current.createdById)
  } catch {
    return { error: 'You do not have permission to edit this product.' }
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the product details.' }
  const locationError = await validateLocation(parsed.data.countryId, parsed.data.cityId)
  if (locationError) return { error: locationError }

  try {
    const product = await prisma.kosherProduct.update({
      where: { id: parsedId.data },
      data: {
        ...parsed.data,
        status: session.user.role === 'ADMIN' ? current.status : 'PENDING',
      },
      select: { id: true },
    })
    revalidateProductPaths(product.id)
    return { success: true, id: product.id }
  } catch {
    return { error: 'Could not update this product. Please try again.' }
  }
}

export async function deleteKosherProduct(id: unknown) {
  const parsedId = productIdSchema.safeParse(id)
  if (!parsedId.success) return { error: 'This product could not be found.' }
  const current = await prisma.kosherProduct.findUnique({ where: { id: parsedId.data }, select: { createdById: true } })
  if (!current) return { error: 'This product could not be found.' }
  try {
    await requireOwnerOrAdmin(current.createdById)
  } catch {
    return { error: 'You do not have permission to delete this product.' }
  }
  try {
    await prisma.kosherProduct.delete({ where: { id: parsedId.data } })
    revalidateProductPaths(parsedId.data)
    return { success: true }
  } catch {
    return { error: 'Could not delete this product. Please try again.' }
  }
}

export async function setKosherProductStatus(id: unknown, status: unknown) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only Admins can change product status.' }
  }
  const parsedId = productIdSchema.safeParse(id)
  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedId.success || !parsedStatus.success) return { error: 'Invalid product moderation request.' }
  try {
    await prisma.kosherProduct.update({ where: { id: parsedId.data }, data: { status: parsedStatus.data } })
    revalidateProductPaths(parsedId.data)
    return { success: true }
  } catch {
    return { error: 'Could not update the product status.' }
  }
}

async function validateLocation(countryId: string, cityId: string) {
  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { countryId: true } })
  if (!city || city.countryId !== countryId) return 'Choose a city within the selected country.'
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } })
  if (!country) return 'Choose a valid country.'
  return null
}

function revalidateProductPaths(id: string) {
  revalidatePath('/kosher')
  revalidatePath(`/kosher/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/kosher')
  revalidatePath(`/admin/kosher/${id}`)
}
