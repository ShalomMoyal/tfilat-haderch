import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function GuidePage() {
  let session: Awaited<ReturnType<typeof requireRole>>

  try {
    session = await requireRole('GUIDE')
  } catch {
    redirect('/dashboard')
  }

  let profile
  try {
    profile = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
    })
  } catch {
    profile = null
  }

  if (!profile || profile.status !== 'ACTIVE') {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-16">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-[#6b9a83]">← Back to dashboard</Link>
          <Link href="/guides" className="rounded-full border border-[#c8d4d1] px-4 py-2 text-sm font-semibold">Browse guides</Link>
        </div>

        <div className="mt-10 rounded-[28px] border border-[#dfe5e0] bg-white p-7">
          <p className="text-[12px] font-semibold uppercase tracking-[.15em] text-[#d57561]">Guide center</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">Your guide profile</h1>

          {profile ? (
            <div className="mt-8 space-y-5 text-sm text-[#5b7077]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#edf3ef] px-3 py-1.5 text-xs font-semibold text-[#467568]">Status: {profile.status}</span>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1.5 text-xs font-semibold text-[#467568]">Display name: {profile.displayName}</span>
              </div>
              <p>{profile.bio ?? 'Add a short bio to help travelers learn more about you.'}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/guide/apply" className="rounded-full bg-[#183f52] px-5 py-3 text-sm font-semibold text-white">Edit profile</Link>
                <Link href="/guides" className="rounded-full border border-[#c8d4d1] px-5 py-3 text-sm font-semibold">View public directory</Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[#cad9d2] bg-[#f7f7f2] p-6 text-sm text-[#718489]">
              You have not created your guide profile yet.
              <Link href="/guide/apply" className="mt-4 inline-flex rounded-full bg-[#183f52] px-5 py-3 font-semibold text-white">Create your guide profile</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export const metadata = { title: 'Guide dashboard · Tefilat Ha-Derech', description: 'Manage your guide profile and community visibility.' }
