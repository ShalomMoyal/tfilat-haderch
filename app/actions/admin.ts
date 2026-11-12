'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-helpers'
import { resolveGuideUserRole } from '@/lib/guide-role'
import { prisma } from '@/lib/prisma'

const reviewTargetSchema = z.enum(['LOCATION', 'PRODUCT', 'GUIDE'])
const reviewIdSchema = z.string().cuid()
const reviewStatusSchema = z.enum(['ACTIVE', 'REJECTED', 'INACTIVE'])

export async function reviewContent(
  target: unknown,
  id: unknown,
  status: unknown
) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can approve content.' }
  }

  const parsedTarget = reviewTargetSchema.safeParse(target)
  const parsedId = reviewIdSchema.safeParse(id)
  const parsedStatus = reviewStatusSchema.safeParse(status)
  if (!parsedTarget.success || !parsedId.success || !parsedStatus.success) {
    return { error: 'Invalid content review request.' }
  }

  try {
    if (parsedTarget.data === 'LOCATION') {
      await prisma.jewishLocation.update({ where: { id: parsedId.data }, data: { status: parsedStatus.data } })
    }
    if (parsedTarget.data === 'PRODUCT') {
      await prisma.kosherProduct.update({ where: { id: parsedId.data }, data: { status: parsedStatus.data } })
    }
    if (parsedTarget.data === 'GUIDE') {
      const current = await prisma.guideProfile.findUnique({
        where: { id: parsedId.data },
        include: { user: { select: { id: true, role: true } } },
      })

      if (!current) {
        return { error: 'This guide profile could not be found.' }
      }

      if (current.user.role === 'ADMIN') {
        return { error: 'Admin profiles cannot be moderated through the guide review flow.' }
      }

      await prisma.$transaction(async (tx) => {
        const updatedProfile = await tx.guideProfile.update({
          where: { id: parsedId.data },
          data: { status: parsedStatus.data },
          select: { id: true, userId: true },
        })

        await tx.user.update({
          where: { id: updatedProfile.userId },
          data: { role: resolveGuideUserRole(current.user.role, parsedStatus.data) },
        })
      })
    }

    revalidatePath('/admin')
    revalidatePath('/guide')
    revalidatePath('/guides')
    revalidatePath('/dashboard')
    revalidatePath('/minyanim')
    revalidatePath('/kosher')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'The review could not be saved. Please try again.' }
  }
}
