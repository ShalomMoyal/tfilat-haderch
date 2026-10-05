'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, MapPin } from 'lucide-react'
import { createMinyan } from '@/app/actions/minyan'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'

type MinyanType = 'ONE_TIME' | 'RECURRING'

export default function NewMinyanPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [minyanType, setMinyanType] = useState<MinyanType>('ONE_TIME')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialLatitude = params.get('latitude')
    const initialLongitude = params.get('longitude')
    if (initialLatitude !== null && initialLongitude !== null) {
      setLatitude(initialLatitude)
      setLongitude(initialLongitude)
    }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    try {
      const formData = new FormData(event.currentTarget)
      const input = Object.fromEntries(formData.entries())
      const result = await createMinyan({
        ...input,
        startDateTime: new Date(String(input.startDateTime)).toISOString(),
        expiresAt: new Date(String(input.expiresAt)).toISOString(),
      })

      if (result.error) {
        setMessage(result.error)
        return
      }
      router.push('/dashboard')
    } catch {
      setMessage('Please check the date, time, and location details.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 text-[#183f52] md:px-10 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c96552]">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <aside className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Bring people together</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">Create a minyan</h1>
            <p className="mt-4 text-sm leading-6 text-[#718489]">Share a prayer gathering with travelers nearby. Add its exact time and coordinates so people can find it.</p>
            <div className="mt-8 flex flex-col gap-4 text-sm text-[#718489]">
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Choose the prayer and schedule</p>
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Set a start and expiration time</p>
              <p className="flex items-center gap-3"><Check size={17} className="text-[#6b9a83]" />Pinpoint the gathering location</p>
            </div>
          </aside>

          <form onSubmit={submit} className="rounded-2xl border border-[#dfe5e0] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5">
              <Field label="Title">
                <input required minLength={3} maxLength={120} name="title" placeholder="Mincha near the old city" className="control" />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prayer">
                  <select name="prayerType" className="control">
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
                    <select name="recurrenceRule" required className="control">
                      <option value="WEEKLY">Every week</option>
                      <option value="DAILY">Every day</option>
                    </select>
                  </Field>
                  <Field label="Local prayer time">
                    <input required type="time" name="time" className="control" />
                  </Field>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Starts">
                  <input required type="datetime-local" name="startDateTime" className="control" />
                </Field>
                <Field label="Expires">
                  <input required type="datetime-local" name="expiresAt" className="control" />
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
                <p className="mt-4 text-xs leading-5 text-[#718489]">Or enter the coordinates manually.</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field label="Latitude">
                    <input required type="number" name="latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} min={-90} max={90} step="any" placeholder="31.7683" className="control" />
                  </Field>
                  <Field label="Longitude">
                    <input required type="number" name="longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} min={-180} max={180} step="any" placeholder="35.2137" className="control" />
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Address or landmark">
                    <input name="address" maxLength={240} placeholder="Near Jaffa Gate" className="control" />
                  </Field>
                </div>
              </div>

              <Field label="Details (optional)">
                <textarea name="description" maxLength={1000} rows={4} className="control resize-y" placeholder="Anything attendees should know" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Contact name (optional)">
                  <input name="contactName" maxLength={120} className="control" />
                </Field>
                <Field label="Contact phone (optional)">
                  <input name="contactPhone" maxLength={40} className="control" />
                </Field>
              </div>

              {message && <p role="alert" className="rounded-xl bg-[#f9e9e4] px-4 py-3 text-sm text-[#a94f40]">{message}</p>}
              <button disabled={pending} className="rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-wait disabled:opacity-60">
                {pending ? 'Submitting…' : 'Submit for review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold">{label}{children}</label>
}
