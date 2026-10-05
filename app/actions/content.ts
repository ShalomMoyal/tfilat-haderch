'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin, requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const statusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])

export async function updateMinyanStatus(id: unknown, status: unknown) {
  await requireAdmin()
  const parsedId = z.string().cuid().safeParse(id)
  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedId.success || !parsedStatus.success) return { error: 'Invalid moderation request.' }
  const result = await prisma.minyan.updateMany({ where: { id: parsedId.data }, data: { status: parsedStatus.data } })
  if (!result.count) return { error: 'This minyan could not be updated.' }
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

export async function getAdminQueue() {
  await requireAdmin()
  const [pendingLocations, pendingProducts, counts] = await Promise.all([
    prisma.jewishLocation.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }),
    prisma.kosherProduct.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }),
    Promise.all([
      prisma.minyan.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.guideProfile.count({ where: { status: 'PENDING' } }),
      prisma.jewishLocation.count({ where: { status: 'PENDING' } }),
      prisma.kosherProduct.count({ where: { status: 'PENDING' } }),
    ]),
  ])

  return {
    pendingMinyanim: [],
    pendingLocations,
    pendingProducts,
    counts: { minyanim: counts[0], users: counts[1], guides: counts[2], locations: counts[3], products: counts[4] },
  }
}

export async function deleteOwnMinyan(id: unknown) {
  const session = await requireAuth()
  const parsed = z.string().cuid().safeParse(id)
  if (!parsed.success) return { error: 'Invalid request.' }
  const result = await prisma.minyan.deleteMany({ where: { id: parsed.data, createdById: session.user.id, status: { in: ['PENDING', 'REJECTED'] } } })
  if (!result.count) return { error: 'Only your pending or rejected minyanim can be removed.' }
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  return { success: true }
}

export type AdminActionResult = Awaited<ReturnType<typeof updateMinyanStatus>>
