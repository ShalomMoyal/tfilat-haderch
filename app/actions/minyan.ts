'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth, requireOwnerOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

type ActiveMinyan = {
  id: string
  title: string
  prayerType: 'SHACHARIT' | 'MINCHA' | 'MAARIV' | 'MUSAF' | 'OTHER'
  type: 'ONE_TIME' | 'RECURRING'
  startDateTime: Date
  expiresAt: Date
  city: { name: string } | null
  country: { name: string } | null
  address: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  _count: { participants: number }
}

const optionalText = (max: number) => z.preprocess(
  (value) => value === '' || value == null ? null : value,
  z.string().trim().max(max).nullable().optional(),
)
const coordinate = (min: number, max: number) => z.preprocess(
  (value) => value === '' || value == null ? undefined : typeof value === 'string' ? Number(value) : value,
  z.number().finite().min(min).max(max),
)

const minyanSchema = z.object({
  title: z.string().trim().min(3).max(120),
  prayerType: z.enum(['SHACHARIT', 'MINCHA', 'MAARIV', 'MUSAF', 'OTHER']),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  startDateTime: z.coerce.date(),
  expiresAt: z.coerce.date(),
  recurrenceRule: optionalText(500),
  time: optionalText(40),
  cityId: z.preprocess((value) => value === '' ? null : value, z.string().cuid().nullable().optional()),
  countryId: z.preprocess((value) => value === '' ? null : value, z.string().cuid().nullable().optional()),
  address: optionalText(240),
  description: optionalText(1000),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  contactName: optionalText(120),
  contactPhone: optionalText(40),
}).superRefine((data, context) => {
  if (data.expiresAt <= data.startDateTime) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiration must be after the start time.' })
  }
  if (data.cityId && !data.countryId) {
    context.addIssue({ code: 'custom', path: ['countryId'], message: 'Choose the country for the selected city.' })
  }
  if (data.type === 'RECURRING' && (!data.recurrenceRule || !data.time)) {
    context.addIssue({ code: 'custom', path: ['recurrenceRule'], message: 'Recurring minyanim need a schedule and local time.' })
  }
})

const minyanSearchSchema = z.object({
  search: z.string().trim().max(120).optional(),
  prayerType: z.enum(['SHACHARIT', 'MINCHA', 'MAARIV', 'MUSAF', 'OTHER']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  countryId: z.string().cuid().optional(),
  cityId: z.string().cuid().optional(),
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  radiusKm: z.number().finite().min(1).max(500).default(50),
  skip: z.number().int().min(0).max(100000).default(0),
  take: z.number().int().min(1).max(100).default(24),
}).superRefine((data, context) => {
  if ((data.latitude === undefined) !== (data.longitude === undefined)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'Latitude and longitude must be supplied together.' })
  }
})

export async function createMinyan(input: unknown) {
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    return { error: 'Sign in before creating a minyan.' }
  }

  const parsed = minyanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  if (parsed.data.startDateTime <= new Date()) return { error: 'Start time must be in the future.' }
  const locationError = await validateLocation(parsed.data.countryId, parsed.data.cityId)
  if (locationError) return { error: locationError }
  if (!process.env.DATABASE_URL) return { error: 'Database is not configured yet. Please try again later.' }

  try {
    const minyan = await prisma.minyan.create({
      data: {
        ...parsed.data,
        status: 'ACTIVE',
        createdById: session.user.id,
      },
    })
    revalidateMinyanPaths(minyan.id)
    return { success: true, id: minyan.id }
  } catch {
    return { error: 'Could not save the minyan right now. Please try again later.' }
  }
}

export async function joinMinyan(minyanId: string) {
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    return { error: 'Sign in to join a minyan.' }
  }
  if (!z.string().cuid().safeParse(minyanId).success) return { error: 'This minyan is not available.' }

  const now = new Date()
  const minyan = await prisma.minyan.findFirst({ where: { id: minyanId, status: 'ACTIVE', expiresAt: { gt: now } }, select: { id: true } })
  if (!minyan) return { error: 'This minyan is no longer available.' }
  try {
    await prisma.minyanParticipant.create({ data: { minyanId, userId: session.user.id } })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return { error: 'You already joined this minyan.' }
    return { error: 'Could not join this minyan. Please try again.' }
  }
  revalidateMinyanPaths(minyanId)
  return { success: true }
}

export async function leaveMinyan(minyanId: string) {
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    return { error: 'Sign in to leave a minyan.' }
  }
  if (!z.string().cuid().safeParse(minyanId).success) return { error: 'This minyan is not available.' }
  const minyan = await prisma.minyan.findUnique({ where: { id: minyanId }, select: { id: true } })
  if (!minyan) return { error: 'This minyan no longer exists.' }
  const result = await prisma.minyanParticipant.deleteMany({ where: { minyanId, userId: session.user.id } })
  if (!result.count) return { error: 'You have not joined this minyan.' }
  revalidateMinyanPaths(minyanId)
  return { success: true }
}

export async function updateMinyan(minyanId: string, input: unknown) {
  if (!z.string().cuid().safeParse(minyanId).success) return { error: 'This minyan is not available.' }
  const current = await prisma.minyan.findUnique({ where: { id: minyanId }, select: { createdById: true } })
  if (!current) return { error: 'This minyan no longer exists.' }
  try {
    await requireOwnerOrAdmin(current.createdById)
  } catch {
    return { error: 'You do not have permission to edit this minyan.' }
  }

  const parsed = minyanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  const locationError = await validateLocation(parsed.data.countryId, parsed.data.cityId)
  if (locationError) return { error: locationError }
  try {
    await prisma.minyan.update({
      where: { id: minyanId },
      data: {
        ...parsed.data,
        status: parsed.data.expiresAt > new Date() ? 'ACTIVE' : 'EXPIRED',
      },
    })
    revalidateMinyanPaths(minyanId)
    return { success: true, id: minyanId }
  } catch {
    return { error: 'Could not update this minyan. Please try again.' }
  }
}

export async function deleteMinyan(minyanId: string) {
  if (!z.string().cuid().safeParse(minyanId).success) return { error: 'This minyan is not available.' }
  const current = await prisma.minyan.findUnique({ where: { id: minyanId }, select: { createdById: true } })
  if (!current) return { error: 'This minyan no longer exists.' }
  try {
    await requireOwnerOrAdmin(current.createdById)
  } catch {
    return { error: 'You do not have permission to delete this minyan.' }
  }
  try {
    await prisma.minyan.delete({ where: { id: minyanId } })
    revalidateMinyanPaths(minyanId)
    return { success: true }
  } catch {
    return { error: 'Could not delete this minyan. Please try again.' }
  }
}

export async function getActiveMinyanim(input: unknown = {}): Promise<ActiveMinyan[]> {
  const parsed = minyanSearchSchema.safeParse(input)
  if (!parsed.success) return []
  if (!process.env.DATABASE_URL) return []

  const { search, prayerType, type, date, countryId, cityId, latitude, longitude, radiusKm, skip, take } = parsed.data
  const dateStart = date ? new Date(`${date}T00:00:00.000Z`) : undefined
  const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : undefined
  const locationFilter = latitude !== undefined && longitude !== undefined
    ? locationBoundingBox(latitude, longitude, radiusKm)
    : null

  try {
    return await prisma.minyan.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        ...(prayerType ? { prayerType } : {}),
        ...(type ? { type } : {}),
        ...(countryId ? { countryId } : {}),
        ...(cityId ? { cityId } : {}),
        ...(dateStart && dateEnd ? { startDateTime: { gte: dateStart, lt: dateEnd } } : {}),
        ...(locationFilter ? { latitude: locationFilter.latitude, longitude: locationFilter.longitude } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { country: { is: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        } : {}),
      },
      include: { city: true, country: true, _count: { select: { participants: true } } },
      orderBy: { startDateTime: 'asc' },
      skip,
      take,
    })
  } catch {
    return []
  }
}

async function validateLocation(countryId?: string | null, cityId?: string | null) {
  if (cityId) {
    const city = await prisma.city.findUnique({ where: { id: cityId }, select: { countryId: true } })
    if (!city || city.countryId !== countryId) return 'Choose a valid city in the selected country.'
  }
  if (countryId && !(await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } }))) {
    return 'Choose a valid country.'
  }
  return null
}

function locationBoundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latitudeDelta = radiusKm / 111
  const longitudeDelta = Math.min(180, radiusKm / Math.max(1, 111 * Math.cos(latitude * Math.PI / 180)))
  return {
    latitude: { gte: Math.max(-90, latitude - latitudeDelta), lte: Math.min(90, latitude + latitudeDelta) },
    longitude: { gte: Math.max(-180, longitude - longitudeDelta), lte: Math.min(180, longitude + longitudeDelta) },
  }
}

function revalidateMinyanPaths(minyanId: string) {
  revalidatePath('/')
  revalidatePath('/minyanim')
  revalidatePath(`/minyan/${minyanId}`)
  revalidatePath('/dashboard')
  revalidatePath('/admin')
}

export type MinyanActionResult = Awaited<ReturnType<typeof createMinyan>>
