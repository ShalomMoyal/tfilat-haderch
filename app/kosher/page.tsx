import { DiscoveryPage, type DiscoveryCard } from '@/components/discovery-page'
import { prisma } from '@/lib/prisma'

const fallback: DiscoveryCard[] = [
  { title: 'Bamba Peanut Snack', subtitle: 'Osem · Snacks', detail: 'Jerusalem, Israel', tag: 'Kosher info', tone: 'gold' },
  { title: 'Local dairy selection', subtitle: 'Supermercato · Dairy', detail: 'Rome, Italy', tag: 'Community note', tone: 'green' },
  { title: 'Travel pantry essentials', subtitle: 'Products shared by travelers', detail: 'New York, USA', tag: 'Popular', tone: 'coral' },
]

export default async function KosherPage() {
  const items = await prisma.kosherProduct.findMany({
    where: { status: 'ACTIVE' },
    include: { city: true, country: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const cards: DiscoveryCard[] = items.map((item: { name: string; brand: string | null; category: string | null; city: { name: string } | null; country: { name: string } | null; kosherInfo: string | null }, index: number) => ({
    title: item.name,
    subtitle: item.brand ?? 'Kosher product',
    detail: [item.city?.name, item.country?.name].filter(Boolean).join(', ') || 'Shared by the community',
    tag: item.category ?? 'Kosher info',
    tone: index % 2 === 0 ? 'gold' : 'green',
    rating: item.kosherInfo ? item.kosherInfo : undefined,
  }))

  return <DiscoveryPage eyebrow="Shop with confidence" title="Kosher products, location by location." description="Find community-shared kosher information for the products and destinations on your journey. Always check the local packaging and certification." cards={cards.length ? cards : fallback} searchPlaceholder="Search products or destinations" actionLabel="Add product info" />
}

export const metadata = { title: 'Kosher products · Tefilat Ha-Derech', description: 'Find location-specific kosher product information.' }
