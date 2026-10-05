'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
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

const optionalText = z.preprocess((value) => value === '' ? undefined : value, z.string().trim().optional())

const minyanSchema = z.object({
  title: z.string().trim().min(3).max(120),
  prayerType: z.enum(['SHACHARIT', 'MINCHA', 'MAARIV', 'MUSAF', 'OTHER']),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  startDateTime: z.coerce.date(),
  expiresAt: z.coerce.date(),
  recurrenceRule: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().max(500).optional()),
  time: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().max(40).optional()),
  cityId: optionalText,
  countryId: optionalText,
  address: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().max(240).optional()),
  description: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().max(1000).optional()),
  latitude: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().min(-90).max(90)),
  longitude: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().min(-180).max(180)),
  contactName: optionalText.pipe(z.string().max(120).optional()),
  contactPhone: optionalText.pipe(z.string().max(40).optional()),
}).superRefine((data, context) => {
  if (data.startDateTime <= new Date()) {
    context.addIssue({ code: 'custom', path: ['startDateTime'], message: 'Start time must be in the future.' })
  }
  if (data.expiresAt <= data.startDateTime) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiration must be after the start time.' })
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
  skip: z.number().int().min(0).max(100000).default(0),
  take: z.number().int().min(1).max(100).default(24),
})

export async function createMinyan(input: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'You must be signed in to create a minyan.' }
  if (!process.env.DATABASE_URL) return { error: 'Database is not configured yet. Please try again later.' }

  const parsed = minyanSchema.safeParse(input)
  if (!parsed.success) return { error: 'Please check the form and try again.' }

  try {
    await prisma.minyan.create({
      data: {
        ...parsed.data,
        status: 'PENDING',
        createdById: session.user.id,
      },
    })
  } catch {
    return { error: 'Could not save the minyan right now. Please try again later.' }
  }
  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function joinMinyan(minyanId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Sign in to join a minyan.' }
  const minyan = await prisma.minyan.findFirst({ where: { id: minyanId, status: 'ACTIVE', expiresAt: { gt: new Date() } } })
  if (!minyan) return { error: 'This minyan is no longer available.' }
  await prisma.minyanParticipant.upsert({ where: { minyanId_userId: { minyanId, userId: session.user.id } }, create: { minyanId, userId: session.user.id }, update: {} })
  revalidatePath('/')
  return { success: true }
}

export async function leaveMinyan(minyanId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Sign in to manage your minyan participation.' }
  await prisma.minyanParticipant.deleteMany({ where: { minyanId, userId: session.user.id } })
  revalidatePath('/')
  return { success: true }
}

export async function getActiveMinyanim(input: unknown = {}): Promise<ActiveMinyan[]> {
  const parsed = minyanSearchSchema.safeParse(input)
  if (!parsed.success) return []
  if (!process.env.DATABASE_URL) return []

  const { search, prayerType, type, date, skip, take } = parsed.data
  const dateStart = date ? new Date(`${date}T00:00:00.000Z`) : undefined
  const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : undefined

  try {
    return await prisma.minyan.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        ...(prayerType ? { prayerType } : {}),
        ...(type ? { type } : {}),
        ...(dateStart && dateEnd ? { startDateTime: { gte: dateStart, lt: dateEnd } } : {}),
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

export type MinyanActionResult = Awaited<ReturnType<typeof createMinyan>>
