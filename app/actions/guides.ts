'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin, requireAuth, requireOwnerOrAdmin } from '@/lib/auth-helpers'
import { canAccessGuidePrivateProfile, resolveGuideUserRole } from '@/lib/guide-role'
import { prisma } from '@/lib/prisma'

const optionalText = (max: number) =>
  z.preprocess(
    (value) => value === '' || value == null ? null : value,
    z.string().trim().max(max).nullable().optional(),
  )

const sanitizeLanguages = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}, z.array(z.string().trim().min(1).max(50)).min(1, 'Add at least one language.').max(12))

const guideSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your guide name.').max(80),
  bio: optionalText(1500),
  phone: optionalText(40),
  email: optionalText(150),
  website: z.preprocess(
    (value) => value === '' || value == null ? null : value,
    z.string().trim().url('Enter a valid website URL.').max(2000).nullable().optional(),
  ).refine((value) => !value || value.startsWith('https://') || value.startsWith('http://'), 'Website must use HTTP or HTTPS.'),
  languages: sanitizeLanguages,
  imageUrl: z.preprocess(
    (value) => value === '' || value == null ? null : value,
    z.string().trim().url('Enter a valid image URL.').max(2000).nullable().optional(),
  ).refine((value) => !value || value.startsWith('https://') || value.startsWith('http://'), 'Image URL must use HTTP or HTTPS.'),
  yearsExperience: z.preprocess((value) => {
    if (value === '' || value == null) return null
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }, z.number().int().min(0).max(80).nullable().optional()),
})

const guideIdSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/)
const guideStatusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])

export type PublicGuideProfile = {
  id: string
  displayName: string
  bio: string | null
  phone: string | null
  email: string | null
  website: string | null
  languages: string[]
  imageUrl: string | null
  yearsExperience: number | null
  user: { id: string; name: string | null; image: string | null }
  _count: { trips: number }
}

function toObject(input: FormData | Record<string, unknown> | unknown) {
  if (input instanceof FormData) {
    return Object.fromEntries(input.entries())
  }

  if (input && typeof input === 'object') {
    return input as Record<string, unknown>
  }

  return {}
}

export async function getPrivateGuideProfile(id: unknown) {
  const session = await requireAuth()
  const parsedId = guideIdSchema.safeParse(id)
  if (!parsedId.success) return null

  const profile = await prisma.guideProfile.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      userId: true,
      displayName: true,
      bio: true,
      phone: true,
      email: true,
      website: true,
      languages: true,
      imageUrl: true,
      yearsExperience: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!profile) return null
  if (!canAccessGuidePrivateProfile({
    currentUserId: session.user.id,
    profileUserId: profile.userId,
    currentRole: session.user.role,
  })) {
    return null
  }

  return profile
}

export async function getMyGuideProfile() {
  const session = await requireAuth()
  return prisma.guideProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      userId: true,
      displayName: true,
      bio: true,
      phone: true,
      email: true,
      website: true,
      languages: true,
      imageUrl: true,
      yearsExperience: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getPublicGuideProfiles() {
  try {
    return (await prisma.guideProfile.findMany({
      where: { status: 'ACTIVE', user: { isActive: true } },
      orderBy: [{ displayName: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        displayName: true,
        bio: true,
        phone: true,
        email: true,
        website: true,
        languages: true,
        imageUrl: true,
        yearsExperience: true,
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { trips: true } },
      },
    })) as PublicGuideProfile[]
  } catch {
    return []
  }
}

export async function getPublicGuideProfileById(id: unknown) {
  const parsedId = guideIdSchema.safeParse(id)
  if (!parsedId.success) return null

  try {
    return await prisma.guideProfile.findFirst({
      where: {
        id: parsedId.data,
        status: 'ACTIVE',
        user: { isActive: true },
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        phone: true,
        email: true,
        website: true,
        languages: true,
        imageUrl: true,
        yearsExperience: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
        trips: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            country: { select: { id: true, name: true } },
            city: { select: { id: true, name: true } },
          },
        },
      },
    })
  } catch {
    return null
  }
}

export async function applyGuideProfile(input: FormData | Record<string, unknown>) {
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    return { error: 'Sign in before applying to become a guide.' }
  }

  const data = toObject(input)
  const parsed = guideSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the guide application details.' }
  }

  const existing = await prisma.guideProfile.findUnique({ where: { userId: session.user.id } })

  try {
    const profile = await prisma.guideProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...parsed.data,
        status: existing?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
        email: parsed.data.email ?? session.user.email ?? null,
      },
      create: {
        userId: session.user.id,
        ...parsed.data,
        email: parsed.data.email ?? session.user.email ?? null,
        status: 'PENDING',
      },
      select: { id: true },
    })

    revalidatePath('/guide')
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    revalidatePath('/guides')
    revalidatePath(`/guides/${profile.id}`)

    return { success: true, id: profile.id }
  } catch {
    return { error: 'The guide profile could not be saved. Please try again.' }
  }
}

export async function updateGuideProfile(id: unknown, input: FormData | Record<string, unknown>) {
  const parsedId = guideIdSchema.safeParse(id)
  if (!parsedId.success) return { error: 'This guide profile could not be found.' }

  const current = await prisma.guideProfile.findUnique({
    where: { id: parsedId.data },
    select: { userId: true, status: true },
  })
  if (!current) return { error: 'This guide profile could not be found.' }

  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireOwnerOrAdmin(current.userId)
  } catch {
    return { error: 'You do not have permission to edit this guide profile.' }
  }

  const data = toObject(input)
  const parsed = guideSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the guide profile details.' }
  }

  try {
    const profile = await prisma.guideProfile.update({
      where: { id: parsedId.data },
      data: {
        ...parsed.data,
        email: parsed.data.email ?? session.user.email ?? null,
        status: session.user.role === 'ADMIN' ? current.status : current.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
      },
      select: { id: true },
    })

    revalidatePath('/guide')
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    revalidatePath('/guides')
    revalidatePath(`/guides/${profile.id}`)

    return { success: true, id: profile.id }
  } catch {
    return { error: 'Could not update this guide profile. Please try again.' }
  }
}

export async function setGuideProfileStatus(id: unknown, status: unknown) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can moderate guide profiles.' }
  }

  const parsedId = guideIdSchema.safeParse(id)
  const parsedStatus = guideStatusSchema.safeParse(status)
  if (!parsedId.success || !parsedStatus.success) return { error: 'Invalid guide moderation request.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.guideProfile.findUnique({
        where: { id: parsedId.data },
        include: { user: { select: { id: true, role: true } } },
      })

      if (!profile) {
        throw new Error('Guide profile not found.')
      }

      if (profile.user.role === 'ADMIN') {
        throw new Error('Admin profiles cannot be moderated as guides.')
      }

      const nextRole = resolveGuideUserRole(profile.user.role, parsedStatus.data)
      const updatedProfile = await tx.guideProfile.update({
        where: { id: parsedId.data },
        data: { status: parsedStatus.data },
        select: { id: true, userId: true, status: true },
      })

      const updatedUser = await tx.user.update({
        where: { id: profile.userId },
        data: { role: nextRole },
        select: { id: true, role: true },
      })

      return { profile: updatedProfile, user: updatedUser }
    })

    revalidatePath('/guide')
    revalidatePath('/guides')
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    revalidatePath(`/guides/${result.profile.id}`)

    return { success: true }
  } catch {
    return { error: 'Could not update the guide status.' }
  }
}

export async function deleteGuideProfile(id: unknown) {
  const parsedId = guideIdSchema.safeParse(id)
  if (!parsedId.success) return { error: 'This guide profile could not be found.' }

  const current = await prisma.guideProfile.findUnique({
    where: { id: parsedId.data },
    include: { user: { select: { id: true, role: true } } },
  })

  if (!current) return { error: 'This guide profile could not be found.' }

  try {
    await requireOwnerOrAdmin(current.userId)
  } catch {
    return { error: 'You do not have permission to delete this guide profile.' }
  }

  if (current.user.role === 'ADMIN') {
    return { error: 'Admin profiles cannot be deleted through the guide workflow.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: current.userId },
        data: { role: 'USER' },
      })

      await tx.guideProfile.delete({
        where: { id: parsedId.data },
      })
    })

    revalidatePath('/guide')
    revalidatePath('/guides')
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    return { success: true }
  } catch {
    return { error: 'Could not delete this guide profile. Please try again.' }
  }
}
