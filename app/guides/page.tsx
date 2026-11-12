import Link from 'next/link'
import { getPublicGuideProfiles } from '@/app/actions/guides'

export default async function GuidesPage() {
  const guides = await getPublicGuideProfiles()

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Community guides</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">Meet trusted local guides</h1>
          </div>
          <Link href="/" className="rounded-full border border-[#c8d4d1] px-4 py-2 text-sm font-semibold">Back home</Link>
        </div>

        {guides.length === 0 ? (
          <div className="mt-10 rounded-[24px] border border-dashed border-[#cbd9d3] bg-white/60 p-8 text-sm text-[#718489]">
            No guide profiles are live yet. Check back soon for trusted local travelers and hosts.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.id} className="rounded-[26px] border border-[#dfe5e0] bg-white p-5 shadow-[0_10px_30px_rgba(24,63,82,.04)]">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center overflow-hidden rounded-full bg-[#edf3ef] text-lg font-semibold text-[#183f52]">
                    {guide.imageUrl ? <img src={guide.imageUrl} alt={guide.displayName} className="size-full object-cover" /> : guide.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{guide.displayName}</h2>
                    <p className="text-sm text-[#718489]">{guide.yearsExperience ? `${guide.yearsExperience} years experience` : 'Local guide'}</p>
                  </div>
                </div>

                <p className="mt-5 line-clamp-4 text-sm leading-6 text-[#5d7178]">{guide.bio ?? 'A trusted guide helping travelers feel at home.'}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {guide.languages.slice(0, 4).map((language) => (
                    <span key={language} className="rounded-full bg-[#edf3ef] px-2.5 py-1 text-[11px] font-semibold text-[#467568]">{language}</span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#edf0ed] pt-4">
                  <span className="text-xs font-medium text-[#72878d]">{guide._count.trips} active trip{guide._count.trips === 1 ? '' : 's'}</span>
                  <Link href={`/guides/${guide.id}`} className="text-sm font-semibold text-[#d57561]">View profile →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
