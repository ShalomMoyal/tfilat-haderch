import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AppSessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role?: 'USER' | 'GUIDE' | 'ADMIN'
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: (session.user.role as AppSessionUser['role']) ?? 'USER',
    },
    session,
  }
}

export async function requireRole(role: 'USER' | 'GUIDE' | 'ADMIN') {
  const session = await requireAuth()
  if (session.user.role !== role && session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return session
}

export async function requireOwnerOrAdmin(ownerUserId: string) {
  const session = await requireAuth()
  if (session.user.role === 'ADMIN' || session.user.id === ownerUserId) {
    return session
  }
  throw new Error('Forbidden')
}

export async function requireGuideOrAdmin(guideUserId: string) {
  const session = await requireAuth()
  if (session.user.role === 'ADMIN' || session.user.id === guideUserId) {
    return session
  }
  throw new Error('Forbidden')
}
