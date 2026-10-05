'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, List, Map as MapIcon, MapPin, Search, Users } from 'lucide-react'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'
import { getActiveMinyanim } from '@/app/actions/minyan'

export type MinyanListItem = {
  id: string
  title: string
  prayerType: 'SHACHARIT' | 'MINCHA' | 'MAARIV' | 'MUSAF' | 'OTHER'
  type: 'ONE_TIME' | 'RECURRING'
  startDateTime: string
  expiresAt: string
  city: string | null
  country: string | null
  address: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  participantCount: number
}

const prayerLabels: Record<MinyanListItem['prayerType'], string> = {
  SHACHARIT: 'Shacharit',
  MINCHA: 'Mincha',
  MAARIV: 'Maariv',
  MUSAF: 'Musaf',
  OTHER: 'Other',
}

const pageSize = 24
type ActiveMinyanRow = Awaited<ReturnType<typeof getActiveMinyanim>>[number]

function toListItem(minyan: ActiveMinyanRow): MinyanListItem {
  return {
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
  }
}

export default function MinyanDirectory({ minyanim, countries }: { minyanim: MinyanListItem[]; countries: { id: string; name: string; cities: { id: string; name: string }[] }[] }) {
  const [query, setQuery] = useState('')
  const [prayerType, setPrayerType] = useState('ALL')
  const [minyanType, setMinyanType] = useState('ALL')
  const [countryId, setCountryId] = useState('')
  const [cityId, setCityId] = useState('')
  const [date, setDate] = useState('')
  const [records, setRecords] = useState(minyanim)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchNearPoint, setSearchNearPoint] = useState(false)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [hasMore, setHasMore] = useState(minyanim.length === pageSize)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setLoadError(false)
      getActiveMinyanim({
        search: query.trim() || undefined,
        prayerType: prayerType === 'ALL' ? undefined : prayerType,
        type: minyanType === 'ALL' ? undefined : minyanType,
        date: date || undefined,
        countryId: countryId || undefined,
        cityId: cityId || undefined,
        latitude: searchNearPoint ? selectedLocation?.lat : undefined,
        longitude: searchNearPoint ? selectedLocation?.lng : undefined,
        radiusKm: 50,
        skip: 0,
        take: pageSize,
      }).then((rows) => {
        if (cancelled) return
        const nextRecords = rows.map(toListItem)
        setRecords(nextRecords)
        setHasMore(nextRecords.length === pageSize)
      }).catch(() => {
        if (!cancelled) setLoadError(true)
      }).finally(() => {
        if (!cancelled) setLoading(false)
      })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [countryId, cityId, date, minyanType, prayerType, query, searchNearPoint, selectedLocation])

  const filteredMinyanim = records

  const mapMarkers = filteredMinyanim.flatMap((minyan) => (
    minyan.latitude !== null && minyan.longitude !== null
      ? [{ id: minyan.id, title: minyan.title, subtitle: `${prayerLabels[minyan.prayerType]} · ${minyan.participantCount} attending`, position: { lat: minyan.latitude, lng: minyan.longitude }, href: `/minyan/${minyan.id}` }]
      : []
  ))

  function useManualLocation() {
    const lat = Number(manualLatitude)
    const lng = Number(manualLongitude)
    if (manualLatitude !== '' && manualLongitude !== '' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setSelectedLocation({ lat, lng })
    }
  }

  async function loadMore() {
    setLoading(true)
    setLoadError(false)
    try {
      const rows = await getActiveMinyanim({
        search: query.trim() || undefined,
        prayerType: prayerType === 'ALL' ? undefined : prayerType,
        type: minyanType === 'ALL' ? undefined : minyanType,
        date: date || undefined,
        countryId: countryId || undefined,
        cityId: cityId || undefined,
        latitude: searchNearPoint ? selectedLocation?.lat : undefined,
        longitude: searchNearPoint ? selectedLocation?.lng : undefined,
        radiusKm: 50,
        skip: records.length,
        take: pageSize,
      })
      const nextRecords = rows.map(toListItem)
      setRecords((current) => [...current, ...nextRecords])
      setHasMore(nextRecords.length === pageSize)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-[#dfe5e0] bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe5e0] px-3">
          <Search size={17} className="shrink-0 text-[#6b9a83]" />
          <span className="sr-only">Search minyanim and destinations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City, address or keyword" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#91a09f]" />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-[#dfe5e0] px-3 text-xs font-semibold text-[#718489]">
          <span className="sr-only">Prayer type</span>
          <select value={prayerType} onChange={(event) => setPrayerType(event.target.value)} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none">
            <option value="ALL">All prayer types</option>
            {Object.entries(prayerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-[#dfe5e0] px-3 text-xs font-semibold text-[#718489]">
          <span className="sr-only">Minyan schedule</span>
          <select value={minyanType} onChange={(event) => setMinyanType(event.target.value)} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none">
            <option value="ALL">All schedules</option>
            <option value="ONE_TIME">One time</option>
            <option value="RECURRING">Recurring</option>
          </select>
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3 text-xs font-semibold text-[#718489]">
          <span className="sr-only">Prayer date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none" />
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3 text-xs font-semibold text-[#718489]">
          <span className="sr-only">Country</span>
          <select value={countryId} onChange={(event) => { setCountryId(event.target.value); setCityId('') }} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none">
            <option value="">All countries</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3 text-xs font-semibold text-[#718489]">
          <span className="sr-only">City</span>
          <select value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={!countryId} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none disabled:opacity-50">
            <option value="">All cities</option>
            {countries.find((country) => country.id === countryId)?.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-4 mt-6 flex items-center justify-between text-sm text-[#718489]">
        <p>{filteredMinyanim.length} {filteredMinyanim.length === 1 ? 'minyan' : 'minyanim'}</p>
        <div className="inline-flex rounded-xl border border-[#dfe5e0] bg-white p-1" role="group" aria-label="Minyan display mode">
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${view === 'map' ? 'bg-[#183f52] text-white' : 'text-[#718489] hover:bg-[#edf3ef]'}`}><MapIcon size={15} />Map</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${view === 'list' ? 'bg-[#183f52] text-white' : 'text-[#718489] hover:bg-[#edf3ef]'}`}><List size={15} />List</button>
        </div>
      </div>
      {loading && <p role="status" className="mb-4 text-sm text-[#718489]">Updating minyan results…</p>}
      {loadError && <p role="alert" className="mb-4 rounded-xl bg-[#f9e9e4] px-4 py-3 text-sm text-[#a94f40]">Could not load minyan results. Please try again.</p>}

      {view === 'map' ? (
        <div className="space-y-4">
          <GoogleMapLocationPicker value={selectedLocation} onChange={setSelectedLocation} markers={mapMarkers} />
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <div className="grid gap-3 rounded-2xl border border-[#dfe5e0] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs font-semibold text-[#718489]">Latitude<input type="number" min={-90} max={90} step="any" value={manualLatitude} onChange={(event) => setManualLatitude(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dfe5e0] px-3 py-2.5 text-sm text-[#183f52]" /></label>
              <label className="text-xs font-semibold text-[#718489]">Longitude<input type="number" min={-180} max={180} step="any" value={manualLongitude} onChange={(event) => setManualLongitude(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dfe5e0] px-3 py-2.5 text-sm text-[#183f52]" /></label>
              <button type="button" onClick={useManualLocation} className="self-end rounded-lg bg-[#183f52] px-4 py-2.5 text-sm font-semibold text-white">Set point</button>
            </div>
          )}
          {selectedLocation && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#cbd9d3] bg-white p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#718489]">Selected point: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSearchNearPoint((current) => !current)} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${searchNearPoint ? 'bg-[#d57561] text-white' : 'border border-[#b9c7c5] text-[#183f52]'}`}>
                  {searchNearPoint ? 'Searching near this point' : 'Search near this point'}
                </button>
                <Link href={`/dashboard/minyan/new?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lng}`} className="rounded-full bg-[#183f52] px-4 py-2.5 text-center text-sm font-semibold text-white">Create a minyan here</Link>
              </div>
            </div>
          )}
          {filteredMinyanim.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-[#718489]">No active minyanim match these filters. You can still choose a point to create one.</p>}
        </div>
      ) : filteredMinyanim.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMinyanim.map((minyan) => {
            const location = [minyan.city, minyan.country].filter(Boolean).join(', ') || minyan.address || 'Location details unavailable'
            const mapUrl = minyan.latitude !== null && minyan.longitude !== null
              ? `https://www.google.com/maps/search/?api=1&query=${minyan.latitude},${minyan.longitude}`
              : null
            return (
              <article key={minyan.id} className="rounded-2xl border border-[#dfe5e0] bg-white p-5 transition hover:border-[#a9c3b7] hover:shadow-[0_12px_36px_rgba(24,63,82,.08)]">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#e0eee5] px-3 py-1 text-xs font-semibold text-[#467568]">{prayerLabels[minyan.prayerType]}</span>
                  <span className="rounded-full bg-[#e0ebef] px-3 py-1 text-xs font-semibold text-[#356579]">{minyan.type === 'RECURRING' ? 'Recurring' : 'One time'}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-[-.02em]">{minyan.title}</h2>
                <div className="mt-4 space-y-2 text-sm text-[#718489]">
                  <p className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-[#d57561]" />{location}</p>
                  <p className="flex items-center gap-2"><Clock3 size={16} className="shrink-0 text-[#6b9a83]" />{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(minyan.startDateTime))}</p>
                  <p className="flex items-center gap-2"><Users size={16} className="shrink-0 text-[#6b9a83]" />{minyan.participantCount} attending</p>
                </div>
                {minyan.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#718489]">{minyan.description}</p>}
                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#edf0ed] pt-4">
                  <Link href={`/minyan/${minyan.id}`} className="text-sm font-semibold text-[#c96552] hover:underline">View details</Link>
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#356579] hover:underline">Open map</a>}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cbd9d3] bg-white px-6 py-14 text-center">
          <MapPin className="mx-auto text-[#6b9a83]" size={24} />
          <h2 className="mt-4 text-lg font-semibold">No minyanim found</h2>
          <p className="mt-2 text-sm text-[#718489]">Try a different destination or clear the filters.</p>
          <button type="button" onClick={() => { setQuery(''); setPrayerType('ALL'); setMinyanType('ALL'); setCountryId(''); setCityId(''); setDate(''); setSearchNearPoint(false) }} className="mt-5 text-sm font-semibold text-[#c96552] hover:underline">Clear filters</button>
        </div>
      )}
      {view === 'list' && hasMore && (
        <div className="mt-6 text-center">
          <button type="button" onClick={loadMore} disabled={loading} className="rounded-full border border-[#b9c7c5] bg-white px-5 py-3 text-sm font-semibold text-[#183f52] disabled:opacity-60">{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
    </div>
  )
}