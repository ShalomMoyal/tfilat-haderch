'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, MapPin } from 'lucide-react'
import { createMinyan } from '@/app/actions/minyan'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'
import type { GoogleMapMarker } from '@/components/google-map-location-picker'

type Coordinates = { lat: number; lng: number }

export function MapMinyanPicker({ markers }: { markers: GoogleMapMarker[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Coordinates | null>(null)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  function updateCoordinates(nextLatitude: string, nextLongitude: string) {
    setLatitude(nextLatitude)
    setLongitude(nextLongitude)
    const lat = Number(nextLatitude)
    const lng = Number(nextLongitude)
    if (nextLatitude !== '' && nextLongitude !== '' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setSelected({ lat, lng })
    } else {
      setSelected(null)
    }
  }

  function selectCoordinates(coordinates: Coordinates) {
    setSelected(coordinates)
    setLatitude(String(coordinates.lat))
    setLongitude(String(coordinates.lng))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) {
      setMessage('Choose a point on the map or enter coordinates.')
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)
    const startDateTime = new Date(String(data.get('startDateTime')))
    if (Number.isNaN(startDateTime.getTime())) {
      setMessage('Enter a valid start date and time.')
      return
    }

    setPending(true)
    setMessage('')
    try {
      const result = await createMinyan({
        title: data.get('title'),
        prayerType: data.get('prayerType'),
        type: 'ONE_TIME',
        startDateTime: startDateTime.toISOString(),
        expiresAt: new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        address: data.get('address'),
        latitude: selected.lat,
        longitude: selected.lng,
      })
      if (result.error) {
        setMessage(result.error.includes('signed in') ? 'Please log in before creating a minyan.' : result.error)
        return
      }
      form.reset()
      setSelected(null)
      setLatitude('')
      setLongitude('')
      setMessage('Minyan submitted for review.')
      router.refresh()
    } catch {
      setMessage('The minyan could not be submitted. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#dfe5e0] bg-white p-4 shadow-[0_22px_65px_rgba(24,63,82,.1)] md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]">Create a gathering</p>
          <h2 className="mt-1 text-lg font-semibold text-[#183f52]">Pin your minyan</h2>
        </div>
        <MapPin className="text-[#d57561]" size={20} />
      </div>

      <GoogleMapLocationPicker value={selected} onChange={selectCoordinates} markers={markers} />

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <input required minLength={3} maxLength={120} name="title" placeholder="Mincha near the old city" className="rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm outline-none focus:border-[#6b9a83]" aria-label="Minyan title" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="prayerType" className="min-w-0 rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm" aria-label="Prayer type">
            <option value="SHACHARIT">Shacharit</option>
            <option value="MINCHA">Mincha</option>
            <option value="MAARIV">Maariv</option>
            <option value="MUSAF">Musaf</option>
            <option value="OTHER">Other</option>
          </select>
          <input required name="startDateTime" type="datetime-local" className="min-w-0 rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm" aria-label="Start date and time" />
        </div>
        <input name="address" maxLength={240} placeholder="Address or landmark (optional)" className="rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm" aria-label="Address or landmark" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="number" min={-90} max={90} step="any" value={latitude} onChange={(event) => updateCoordinates(event.target.value, longitude)} placeholder="Latitude" className="min-w-0 rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm" aria-label="Latitude" />
          <input type="number" min={-180} max={180} step="any" value={longitude} onChange={(event) => updateCoordinates(latitude, event.target.value)} placeholder="Longitude" className="min-w-0 rounded-xl border border-[#c8d4d1] px-3 py-2.5 text-sm" aria-label="Longitude" />
        </div>
        <button disabled={pending || !selected} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183f52] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? 'Submitting…' : <><Check size={16} /> Submit minyan</>}
        </button>
        {message && <p role="status" className="text-center text-sm text-[#718489]">{message}</p>}
        <p className="text-center text-xs text-[#8a999a]">Submissions are reviewed before appearing publicly. <Link href="/login" className="font-semibold text-[#c96552] hover:underline">Sign in</Link></p>
      </form>
    </section>
  )
}
