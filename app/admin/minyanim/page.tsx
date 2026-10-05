import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeleteMinyanButton } from '@/components/minyan-management-buttons'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

type AdminMinyanRow = {
  id: string
  title: string
  prayerType: string
  startDateTime: Date
  expiresAt: Date
  status: string
  address: string | null
  city: { name: string } | null
  country: { name: string } | null
  createdBy: { name: string | null; email: string | null }
  _count: { participants: number }
}

export default async function AdminMinyanimPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/login?callbackUrl=%2Fadmin%2Fminyanim')
  }

  const minyanim = await prisma.minyan.findMany({
    include: { city: true, country: true, createdBy: { select: { name: true, email: true } }, _count: { select: { participants: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  const now = new Date()

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-14">
      <div className="mx-auto max-w-[1100px]">
        <Link href="/admin" className="text-sm font-semibold text-[#6b9a83]">← Administration</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#d57561]">Administration</p>
            <h1 className="mt-2 text-4xl font-medium tracking-[-.05em]">Minyan management</h1>
          </div>
          <p className="text-sm text-[#718489]">{minyanim.length} total Minyanim · no approval queue</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white">
          {minyanim.length ? minyanim.map((minyan: AdminMinyanRow) => {
            const isActive = minyan.status === 'ACTIVE' && minyan.expiresAt > now
            const location = [minyan.city?.name, minyan.country?.name].filter(Boolean).join(', ') || minyan.address || 'Location not specified'
            return (
              <article key={minyan.id} className="flex flex-col gap-4 border-b border-[#edf0ed] p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{minyan.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-[#e0eee5] text-[#467568]' : 'bg-[#f6e2dc] text-[#a94f40]'}`}>
                      {isActive ? 'Active' : minyan.status === 'ACTIVE' || minyan.status === 'EXPIRED' ? 'Expired' : minyan.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#718489]">{minyan.prayerType} · {new Date(minyan.startDateTime).toLocaleString()} · {location}</p>
                  <p className="mt-1 text-xs text-[#7e8e91]">Created by {minyan.createdBy.name ?? minyan.createdBy.email ?? 'Community member'} · {minyan._count.participants} joined · Expires {minyan.expiresAt.toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link href={`/minyan/${minyan.id}`} className="text-sm font-semibold text-[#356579]">View</Link>
                  <Link href={`/dashboard/minyan/${minyan.id}/edit`} className="rounded-full bg-[#183f52] px-4 py-2 text-sm font-semibold text-white">Edit</Link>
                  <DeleteMinyanButton minyanId={minyan.id} />
                </div>
              </article>
            )
          }) : (
            <p className="p-8 text-center text-sm text-[#718489]">There are no Minyanim yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'