'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function reviewContent(
  target: 'MINYAN' | 'LOCATION' | 'PRODUCT',
  id: string,
  status: 'ACTIVE' | 'REJECTED' | 'INACTIVE'
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'You must be signed in to moderate content.' }
  if (session.user.role !== 'ADMIN') return { error: 'Only admins can approve content.' }

  try {
    if (target === 'MINYAN') {
      await prisma.minyan.update({ where: { id }, data: { status } })
    }
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
