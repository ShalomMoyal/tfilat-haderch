'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const reviewTargetSchema = z.enum(['LOCATION', 'PRODUCT'])
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

    revalidatePath('/admin')
    revalidatePath('/minyanim')
    revalidatePath('/kosher')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'The review could not be saved. Please try again.' }
  }
}
