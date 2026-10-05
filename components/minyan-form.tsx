'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, MapPin } from 'lucide-react'
import { createMinyan, updateMinyan } from '@/app/actions/minyan'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'

type MinyanType = 'ONE_TIME' | 'RECURRING'
type CountryOption = { id: string; name: string; cities: { id: string; name: string }[] }
type MinyanValues = {
  id: string
  title: string
  prayerType: 'SHACHARIT' | 'MINCHA' | 'MAARIV' | 'MUSAF' | 'OTHER'
  type: MinyanType
  startDateTime: Date
  expiresAt: Date
  recurrenceRule: string | null
  time: string | null
  countryId: string | null
  cityId: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  contactName: string | null
  contactPhone: string | null
}

export function MinyanForm({
  countries,
  initial,
}: {
  countries: CountryOption[]
  initial?: MinyanValues
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [minyanType, setMinyanType] = useState<MinyanType>(initial?.type ?? 'ONE_TIME')
  const [countryId, setCountryId] = useState(initial?.countryId ?? '')
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [latitude, setLatitude] = useState(initial?.latitude == null ? '' : String(initial.latitude))
  const [longitude, setLongitude] = useState(initial?.longitude == null ? '' : String(initial.longitude))

  const selectedCountry = countries.find((country) => country.id === countryId)

  useEffect(() => {
    if (initial) return
    const params = new URLSearchParams(window.location.search)
    const initialLatitude = params.get('latitude')
    const initialLongitude = params.get('longitude')
    if (initialLatitude !== null && initialLongitude !== null) {
      setLatitude(initialLatitude)
      setLongitude(initialLongitude)
    }
  }, [initial])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const startDateTime = new Date(String(formData.get('startDateTime')))
    const expiresAt = new Date(String(formData.get('expiresAt')))
    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(expiresAt.getTime())) {
      setMessage('Enter valid start and expiration times.')
      setPending(false)
      return
    }

    const input = {
      ...Object.fromEntries(formData.entries()),
      startDateTime: startDateTime.toISOString(),
      expiresAt: expiresAt.toISOString(),
      countryId: countryId || null,
      cityId: cityId || null,
      latitude,
      longitude,
    }

    try {
      const result = initial ? await updateMinyan(initial.id, input) : await createMinyan(input)
      if ('error' in result) {
        setMessage(result.error ?? 'Could not save this minyan. Please try again.')
        setPending(false)
        return
      }
      router.push(`/minyan/${result.id}`)
      router.refresh()
    } catch {
      setMessage('Could not save this minyan. Please try again.')
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 text-[#183f52] md:px-10 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href={initial ? `/minyan/${initial.id}` : '/dashboard'} className="inline-flex items-center gap-2 text-sm font-semibold text-[#c96552]">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <aside className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Bring people together</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">{initial ? 'Edit this minyan' : 'Create a minyan'}</h1>
            <p className="mt-4 text-sm leading-6 text-[#718489]">Set the prayer time, availability, and exact meeting point. New minyanim are available as soon as you publish.</p>
            <div className="mt-8 flex flex-col gap-4 text-sm text-[#718489]">
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Choose the prayer and schedule</p>
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Set an expiration time</p>
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Pinpoint the gathering location</p>
            </div>
          </aside>

          <form onSubmit={submit} className="rounded-2xl border border-[#dfe5e0] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5">
              <Field label="Title">
                <input required minLength={3} maxLength={120} name="title" defaultValue={initial?.title} placeholder="Mincha near the old city" className="control" />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prayer">
                  <select name="prayerType" defaultValue={initial?.prayerType ?? 'SHACHARIT'} className="control">
                    <option value="SHACHARIT">Shacharit</option>
                    <option value="MINCHA">Mincha</option>
                    <option value="MAARIV">Maariv</option>
                    <option value="MUSAF">Musaf</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Schedule">
                  <select name="type" value={minyanType} onChange={(event) => setMinyanType(event.target.value as MinyanType)} className="control">
                    <option value="ONE_TIME">One time</option>
                    <option value="RECURRING">Recurring</option>
                  </select>
                </Field>
              </div>

              {minyanType === 'RECURRING' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Repeats">
                    <select name="recurrenceRule" required defaultValue={initial?.recurrenceRule ?? 'WEEKLY'} className="control">
                      <option value="WEEKLY">Every week</option>
                      <option value="DAILY">Every day</option>
                    </select>
                  </Field>
                  <Field label="Local prayer time">
                    <input required type="time" name="time" defaultValue={initial?.time ?? ''} className="control" />
                  </Field>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Starts">
                  <input required type="datetime-local" name="startDateTime" defaultValue={toLocalInput(initial?.startDateTime)} className="control" />
                </Field>
                <Field label="Expires">
                  <input required type="datetime-local" name="expiresAt" defaultValue={toLocalInput(initial?.expiresAt)} className="control" />
                </Field>
              </div>

              <div className="border-t border-[#edf0ed] pt-5">
                <p className="flex items-center gap-2 text-sm font-semibold"><MapPin size={16} className="text-[#d57561]" />Location</p>
                <div className="mt-4">
                  <GoogleMapLocationPicker
                    value={latitude !== '' && longitude !== '' ? { lat: Number(latitude), lng: Number(longitude) } : null}
                    onChange={(coordinates) => {
                      setLatitude(coordinates.lat.toFixed(6))
                      setLongitude(coordinates.lng.toFixed(6))
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-[#718489]">{latitude && longitude ? `Selected: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : 'Click the map or enter coordinates to select a point.'}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field label="Latitude">
                    <input required type="number" name="latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} min={-90} max={90} step="any" placeholder="31.7683" className="control" />
                  </Field>
                  <Field label="Longitude">
                    <input required type="number" name="longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} min={-180} max={180} step="any" placeholder="35.2137" className="control" />
                  </Field>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Country">
                    <select name="countryId" value={countryId} onChange={(event) => { setCountryId(event.target.value); setCityId('') }} className="control">
                      <option value="">Select a country (optional)</option>
                      {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <select name="cityId" value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={!selectedCountry} className="control disabled:opacity-60">
                      <option value="">Select a city (optional)</option>
                      {selectedCountry?.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Address or landmark">
                    <input name="address" maxLength={240} defaultValue={initial?.address ?? ''} placeholder="Near Jaffa Gate" className="control" />
                  </Field>
                </div>
              </div>

              <Field label="Details (optional)">
                <textarea name="description" maxLength={1000} rows={4} defaultValue={initial?.description ?? ''} className="control resize-y" placeholder="Anything attendees should know" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Contact name (optional)">
                  <input name="contactName" maxLength={120} defaultValue={initial?.contactName ?? ''} className="control" />
                </Field>
                <Field label="Contact phone (optional)">
                  <input name="contactPhone" maxLength={40} defaultValue={initial?.contactPhone ?? ''} className="control" />
                </Field>
              </div>

              {message && <p role="alert" className="rounded-xl bg-[#f9e9e4] px-4 py-3 text-sm text-[#a94f40]">{message}</p>}
              <button disabled={pending} className="rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-wait disabled:opacity-60">
                {pending ? 'Saving…' : initial ? 'Save changes' : 'Publish minyan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function toLocalInput(value?: Date) {
  if (!value) return ''
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold">{label}{children}</label>
}