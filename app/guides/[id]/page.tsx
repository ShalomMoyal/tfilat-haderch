import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicGuideProfileById } from '@/app/actions/guides'

type GuideDetail = {
  id: string
  displayName: string
  bio: string | null
  phone: string | null
  email: string | null
  website: string | null
  languages: string[]
  imageUrl: string | null
  yearsExperience: number | null
  user: { id: string; name: string | null; image: string | null }
  trips: {
    id: string
    title: string
    description: string | null
    createdAt: Date
    country: { id: string; name: string } | null
    city: { id: string; name: string } | null
  }[]
}

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = (await getPublicGuideProfileById(id)) as GuideDetail | null

  if (!guide) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-16">
      <div className="mx-auto max-w-[1100px]">
        <Link href="/guides" className="text-sm font-semibold text-[#6b9a83]">← Back to guides</Link>

        <article className="mt-10 rounded-[30px] border border-[#dfe5e0] bg-white p-7 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-[#edf3ef] text-2xl font-semibold text-[#183f52]">
                {guide.imageUrl ? <img src={guide.imageUrl} alt={guide.displayName} className="size-full object-cover" /> : guide.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[.15em] text-[#d57561]">Local guide</p>
                <h1 className="mt-2 text-4xl font-medium tracking-[-.05em]">{guide.displayName}</h1>
                <p className="mt-2 text-sm text-[#718489]">{guide.yearsExperience ? `${guide.yearsExperience} years of local experience` : 'Trusted community guide'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {guide.languages.map((language) => (
                <span key={language} className="rounded-full bg-[#edf3ef] px-3 py-1.5 text-xs font-semibold text-[#467568]">{language}</span>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <h2 className="text-xl font-semibold">About</h2>
              <p className="mt-4 leading-7 text-[#5d7178]">{guide.bio ?? 'This guide has not added a bio yet, but they are ready to help travelers feel welcome.'}</p>

              {guide.trips.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold">Trips</h2>
                  <div className="mt-4 space-y-4">
                    {guide.trips.map((trip) => (
                      <div key={trip.id} className="rounded-2xl border border-[#edf0ed] bg-[#f9f9f7] p-4">
                        <h3 className="font-semibold">{trip.title}</h3>
                        <p className="mt-2 text-sm text-[#718489]">{trip.description ?? 'A thoughtfully planned journey.'}</p>
                        <p className="mt-3 text-xs text-[#7d8d8f]">{[trip.city?.name, trip.country?.name].filter(Boolean).join(', ') || 'Location to be confirmed'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-[24px] border border-[#edf0ed] bg-[#f9f9f7] p-5">
              <h2 className="text-lg font-semibold">Contact</h2>
              <div className="mt-4 space-y-3 text-sm text-[#5d7178]">
                {guide.email && <p><span className="font-semibold text-[#183f52]">Email:</span> {guide.email}</p>}
                {guide.phone && <p><span className="font-semibold text-[#183f52]">Phone:</span> {guide.phone}</p>}
                {guide.website && <p><span className="font-semibold text-[#183f52]">Website:</span> <a href={guide.website} target="_blank" rel="noreferrer" className="text-[#d57561] underline">Open link</a></p>}
              </div>
            </aside>
          </div>
        </article>
      </div>
    </main>
  )
}
