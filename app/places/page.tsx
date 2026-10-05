import { DiscoveryPage, type DiscoveryCard } from '@/components/discovery-page'
import { prisma } from '@/lib/prisma'

const fallback: DiscoveryCard[] = [
  { title: 'Chabad of Florence', subtitle: 'Chabad house · Open to visitors', detail: 'Florence, Italy', tag: 'Chabad', tone: 'blue', rating: '4.9 · 128 community reviews' },
  { title: 'Great Synagogue of Rome', subtitle: 'Synagogue · Historic community', detail: 'Rome, Italy', tag: 'Synagogue', tone: 'green', rating: '4.8 · 94 community reviews' },
  { title: 'Chabad Central Park', subtitle: 'Synagogue & Chabad', detail: 'New York, USA', tag: 'Both', tone: 'gold', rating: '4.7 · 56 community reviews' },
]

export default async function PlacesPage() {
  const items = await prisma.jewishLocation.findMany({
    where: { status: 'ACTIVE' },
    include: { city: true, country: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const cards: DiscoveryCard[] = items.map((item: { name: string; type: 'SYNAGOGUE' | 'CHABAD' | 'BOTH'; address: string | null; city: { name: string } | null; country: { name: string } | null; website: string | null }, index: number) => ({
    title: item.name,
    subtitle: `${item.type === 'CHABAD' ? 'Chabad' : item.type === 'SYNAGOGUE' ? 'Synagogue' : 'Synagogue & Chabad'} · ${item.address ?? 'Location shared by the community'}`,
    detail: [item.city?.name, item.country?.name].filter(Boolean).join(', ') || 'Community location',
    tag: item.type === 'CHABAD' ? 'Chabad' : item.type === 'SYNAGOGUE' ? 'Synagogue' : 'Both',
    tone: index % 2 === 0 ? 'blue' : 'green',
    rating: item.website ? 'Community shared' : undefined,
  }))

  return <DiscoveryPage eyebrow="Find your place" title="Synagogues & Chabad, wherever you go." description="Discover welcoming Jewish spaces, shared by the community and kept current by people who know them best." cards={cards.length ? cards : fallback} searchPlaceholder="Search by city, country or place name" actionLabel="Add a place" />
}

export const metadata = { title: 'Synagogues & Chabad · Tefilat Ha-Derech', description: 'Find Jewish spaces around the world.' }
