'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  return session.user.id
}

const statusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])

export async function updateMinyanStatus(id: unknown, status: unknown) {
  await requireAdmin()
  const parsedId = z.string().cuid().safeParse(id)
  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedId.success || !parsedStatus.success) return { error: 'Invalid moderation request.' }
  const result = await prisma.minyan.updateMany({ where: { id: parsedId.data, status: 'PENDING' }, data: { status: parsedStatus.data } })
  if (!result.count) return { error: 'This minyan is no longer pending.' }
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

export async function getAdminQueue() {
  await requireAdmin()
  const [pendingMinyanim, counts] = await Promise.all([
    prisma.minyan.findMany({ where: { status: 'PENDING' }, include: { city: true, country: true, createdBy: { select: { name: true, email: true } }, _count: { select: { participants: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }),
    Promise.all([
      prisma.minyan.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.guideProfile.count({ where: { status: 'PENDING' } }),
      prisma.jewishLocation.count({ where: { status: 'PENDING' } }),
    ]),
  ])
  return { pendingMinyanim, counts: { minyanim: counts[0], users: counts[1], guides: counts[2], locations: counts[3] } }
}

export async function deleteOwnMinyan(id: unknown) {
  const session = await getServerSession(authOptions)
  const parsed = z.string().cuid().safeParse(id)
  if (!session?.user?.id || !parsed.success) return { error: 'Unauthorized.' }
  const result = await prisma.minyan.deleteMany({ where: { id: parsed.data, createdById: session.user.id, status: { in: ['PENDING', 'REJECTED'] } } })
  if (!result.count) return { error: 'Only your pending or rejected minyanim can be removed.' }
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  return { success: true }
}

export type AdminActionResult = Awaited<ReturnType<typeof updateMinyanStatus>>
