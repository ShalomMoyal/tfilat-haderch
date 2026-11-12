export type GuideRole = 'USER' | 'GUIDE' | 'ADMIN'
export type GuideStatus = 'ACTIVE' | 'REJECTED' | 'INACTIVE' | 'PENDING'

export function resolveGuideUserRole(currentRole: GuideRole, nextStatus: GuideStatus | null | undefined): GuideRole {
  if (currentRole === 'ADMIN') {
    return 'ADMIN'
  }

  return nextStatus === 'ACTIVE' ? 'GUIDE' : 'USER'
}

export function canAccessGuidePrivateProfile({
  currentUserId,
  profileUserId,
  currentRole,
}: {
  currentUserId: string
  profileUserId: string
  currentRole: GuideRole
}) {
  return currentRole === 'ADMIN' || currentUserId === profileUserId
}

export function isGuidePubliclyVisible({
  profileStatus,
  userIsActive,
}: {
  profileStatus: string | null
  userIsActive: boolean
}) {
  return profileStatus === 'ACTIVE' && userIsActive
}
