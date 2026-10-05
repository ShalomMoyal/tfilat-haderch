'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function reviewContent(
  target: 'LOCATION' | 'PRODUCT',
  id: string,
  status: 'ACTIVE' | 'REJECTED' | 'INACTIVE'
) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can approve content.' }
  }

  try {
    if (target === 'LOCATION') {
      await prisma.jewishLocation.update({ where: { id }, data: { status } })
    }
    if (target === 'PRODUCT') {
      await prisma.kosherProduct.update({ where: { id }, data: { status } })
    }

    revalidatePath('/admin')
    revalidatePath('/minyanim')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'The review could not be saved. Please try again.' }
  }
}
