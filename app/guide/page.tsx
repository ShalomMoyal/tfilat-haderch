import { redirect } from 'next/navigation'
import { GuideLanding } from '@/components/discovery-page'
import { requireRole } from '@/lib/auth-helpers'

export default async function GuidePage() {
  try {
    await requireRole('GUIDE')
  } catch {
    redirect('/dashboard')
  }

  return <GuideLanding />
}

export const metadata = { title: 'Become a guide · Tefilat Ha-Derech', description: 'Share your local knowledge with Jewish travelers.' }
