import Link from 'next/link'
import { redirect } from 'next/navigation'
import { applyGuideProfile } from '@/app/actions/guides'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function ApplyGuidePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireAuth()

  let profile
  try {
    profile = await prisma.guideProfile.findUnique({ where: { userId: session.user.id } })
  } catch {
    profile = null
  }

  const params = await searchParams
  const error = params?.error

  async function submit(formData: FormData) {
    'use server'
    const result = await applyGuideProfile(formData)
    if ('success' in result && result.success) {
      redirect('/guide')
    }

    redirect(`/guide/apply?error=${encodeURIComponent(result.error ?? 'There was a problem saving your guide profile.')}`)
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-16">
      <div className="mx-auto max-w-[980px]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-[#6b9a83]">← Back to dashboard</Link>
          <Link href="/guides" className="rounded-full border border-[#c8d4d1] px-4 py-2 text-sm font-semibold">View guide directory</Link>
        </div>

        <div className="mt-10 rounded-[28px] border border-[#dfe5e0] bg-white p-7">
          <p className="text-[12px] font-semibold uppercase tracking-[.15em] text-[#d57561]">Guide application</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">Tell travelers about your local expertise</h1>

          {error && (
            <p className="mt-5 rounded-2xl border border-[#f1d5cc] bg-[#fdf5f3] px-4 py-3 text-sm text-[#a94f40]">{error}</p>
          )}

          <form action={submit} className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Display name</span>
              <input defaultValue={profile?.displayName ?? session.user.name ?? ''} name="displayName" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="Miriam Cohen" required />
            </label>

            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Phone</span>
              <input defaultValue={profile?.phone ?? ''} name="phone" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="+972 54 123 4567" />
            </label>

            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input defaultValue={profile?.email ?? session.user.email ?? ''} name="email" type="email" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="you@example.com" />
            </label>

            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Website</span>
              <input defaultValue={profile?.website ?? ''} name="website" type="url" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="https://your-site.com" />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium">Languages</span>
              <textarea defaultValue={profile?.languages?.join(', ') ?? 'English,Hebrew'} name="languages" rows={3} className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="English, Hebrew, Spanish" required />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium">Bio</span>
              <textarea defaultValue={profile?.bio ?? ''} name="bio" rows={5} className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="Share what makes your local knowledge so helpful for travelers." />
            </label>

            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Years of experience</span>
              <input defaultValue={profile?.yearsExperience ?? 0} name="yearsExperience" type="number" min="0" max="80" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" />
            </label>

            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium">Profile image URL</span>
              <input defaultValue={profile?.imageUrl ?? ''} name="imageUrl" type="url" className="w-full rounded-2xl border border-[#dfe5e0] bg-[#f9f9f7] px-4 py-3 outline-none focus:border-[#6b9a83]" placeholder="https://images.example.com/guide.jpg" />
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
              <p className="text-sm text-[#718489]">Applications are reviewed by the community team before they become public.</p>
              <button type="submit" className="rounded-full bg-[#183f52] px-6 py-3 text-sm font-semibold text-white">Save guide profile</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
