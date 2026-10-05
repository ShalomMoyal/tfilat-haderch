'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const statusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])

export async function getAdminQueue() {
  await requireAdmin()
  const [pendingLocations, pendingProducts, counts] = await Promise.all([
    prisma.jewishLocation.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }),
    prisma.kosherProduct.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }),
    Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.guideProfile.count({ where: { status: 'PENDING' } }),
      prisma.jewishLocation.count({ where: { status: 'PENDING' } }),
      prisma.kosherProduct.count({ where: { status: 'PENDING' } }),
    ]),
  ])

  return {
    pendingLocations,
    pendingProducts,
    counts: { users: counts[0], guides: counts[1], locations: counts[2], products: counts[3] },
  }
}
