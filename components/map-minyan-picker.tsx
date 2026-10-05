'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'
import type { GoogleMapMarker } from '@/components/google-map-location-picker'

type Coordinates = { lat: number; lng: number }

export function MapMinyanPicker({ markers }: { markers: GoogleMapMarker[] }) {
  const [selected, setSelected] = useState<Coordinates | null>(null)

  return (
    <section className="rounded-2xl border border-[#dfe5e0] bg-white p-4 shadow-[0_22px_65px_rgba(24,63,82,.1)] md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]">Find your place</p>
          <h2 className="mt-1 text-lg font-semibold text-[#183f52]">Minyanim near your journey</h2>
        </div>
        <MapPin className="text-[#d57561]" size={20} />
      </div>

      <GoogleMapLocationPicker value={selected} onChange={setSelected} markers={markers} />
      {selected && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl bg-[#f7f7f2] p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-[#718489]">Selected point: {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
          <Link href={`/dashboard/minyan/new?latitude=${selected.lat}&longitude=${selected.lng}`} className="rounded-full bg-[#183f52] px-4 py-2.5 text-center text-sm font-semibold text-white">
            Create a minyan here
          </Link>
        </div>
      )}
    </section>
  )
}
