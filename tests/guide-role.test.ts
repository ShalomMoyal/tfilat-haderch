import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canAccessGuidePrivateProfile,
  isGuidePubliclyVisible,
  resolveGuideUserRole,
} from '../lib/guide-role.ts'

test('User applies — profile becomes PENDING', () => {
  assert.equal(resolveGuideUserRole('USER', 'PENDING'), 'USER')
})

test('Admin approves — profile becomes ACTIVE and user becomes GUIDE', () => {
  assert.equal(resolveGuideUserRole('USER', 'ACTIVE'), 'GUIDE')
})

test('Admin rejects — profile becomes REJECTED and user becomes USER', () => {
  assert.equal(resolveGuideUserRole('GUIDE', 'REJECTED'), 'USER')
})

test('Admin deactivates — profile becomes INACTIVE and user becomes USER', () => {
  assert.equal(resolveGuideUserRole('GUIDE', 'INACTIVE'), 'USER')
})

test('Admin reactivates — profile becomes ACTIVE and user becomes GUIDE', () => {
  assert.equal(resolveGuideUserRole('USER', 'ACTIVE'), 'GUIDE')
})

test('ADMIN remains ADMIN through all guide operations', () => {
  assert.equal(resolveGuideUserRole('ADMIN', 'ACTIVE'), 'ADMIN')
  assert.equal(resolveGuideUserRole('ADMIN', 'REJECTED'), 'ADMIN')
  assert.equal(resolveGuideUserRole('ADMIN', 'INACTIVE'), 'ADMIN')
})

test('Unauthorized users cannot retrieve private guide profiles', () => {
  assert.equal(
    canAccessGuidePrivateProfile({
      currentUserId: 'user-1',
      profileUserId: 'user-2',
      currentRole: 'USER',
    }),
    false,
  )

  assert.equal(
    canAccessGuidePrivateProfile({
      currentUserId: 'user-1',
      profileUserId: 'user-2',
      currentRole: 'ADMIN',
    }),
    true,
  )
})

test('Users cannot edit another user profile', () => {
  assert.equal(
    canAccessGuidePrivateProfile({
      currentUserId: 'user-1',
      profileUserId: 'user-2',
      currentRole: 'GUIDE',
    }),
    false,
  )
})

test('Inactive users do not appear in the public guide directory', () => {
  assert.equal(
    isGuidePubliclyVisible({ profileStatus: 'ACTIVE', userIsActive: false }),
    false,
  )
  assert.equal(
    isGuidePubliclyVisible({ profileStatus: 'ACTIVE', userIsActive: true }),
    true,
  )
})

test('Rejected and inactive guide profiles are not publicly visible', () => {
  assert.equal(isGuidePubliclyVisible({ profileStatus: 'REJECTED', userIsActive: true }), false)
  assert.equal(isGuidePubliclyVisible({ profileStatus: 'INACTIVE', userIsActive: true }), false)
})
