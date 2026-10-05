import Link from 'next/link'
import { getActiveMinyanim } from '@/app/actions/minyan'
import MinyanDirectory, { type MinyanListItem } from '@/components/minyan-directory'

export const dynamic = 'force-dynamic'

export default async function MinyanimPage() {
  const minyanim = await getActiveMinyanim()
  const items: MinyanListItem[] = minyanim.map((minyan) => ({
    id: minyan.id,
    title: minyan.title,
    prayerType: minyan.prayerType,
    type: minyan.type,
    startDateTime: minyan.startDateTime.toISOString(),
    expiresAt: minyan.expiresAt.toISOString(),
    city: minyan.city?.name ?? null,
    country: minyan.country?.name ?? null,
    address: minyan.address,
    description: minyan.description,
    latitude: minyan.latitude,
    longitude: minyan.longitude,
    participantCount: minyan._count.participants,
  }))

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#183f52]">
      <header className="border-b border-[#dfe5e0] px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-[#183f52]">Tefilat Ha-Derech</Link>
          <Link href="/dashboard/minyan/new" className="rounded-full bg-[#183f52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#28566b]">Create a minyan</Link>
        </div>
      </header>
      <section className="px-5 py-10 md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Pray together, wherever you are</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-.05em] md:text-5xl">Find a minyan</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718489]">Browse active gatherings shared by travelers and local communities.</p>
          <div className="mt-9">
            <MinyanDirectory minyanim={items} />
          </div>
        </div>
      </section>
    </main>
  )
}