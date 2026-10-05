import { DiscoveryPage, trips } from '@/components/discovery-page'

export default function TripsPage() {
  return <DiscoveryPage eyebrow="Go thoughtfully" title="Trips made by people who know the way." description="Browse thoughtful itineraries, local recommendations and Jewish connections curated by guides around the world." cards={trips} searchPlaceholder="Search a destination or experience" actionLabel="Create a trip" />
}

export const metadata = { title: 'Trips · Tefilat Ha-Derech', description: 'Browse community-curated Jewish travel trips.' }
