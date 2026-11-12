'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { createKosherProduct, updateKosherProduct } from '@/app/actions/kosher-products'

type CountryOption = { id: string; name: string; cities: { id: string; name: string }[] }
type ProductValues = {
  id: string
  name: string
  brand: string | null
  category: string | null
  countryId: string | null
  cityId: string | null
  description: string | null
  kosherInfo: string | null
  imageUrl: string | null
}

export function KosherProductForm({
  countries,
  initial,
  admin = false,
}: {
  countries: CountryOption[]
  initial?: ProductValues
  admin?: boolean
}) {
  const router = useRouter()
  const [countryId, setCountryId] = useState(initial?.countryId ?? '')
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const country = countries.find((item) => item.id === countryId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const input = { ...values, countryId, cityId }

    try {
      const result = initial
        ? await updateKosherProduct(initial.id, input)
        : await createKosherProduct(input)
      if ('error' in result) {
        setError(result.error ?? 'Could not save the product.')
        setPending(false)
        return
      }
      router.push(`/kosher/${result.id}`)
      router.refresh()
    } catch {
      setError('Could not save the product. Please try again.')
      setPending(false)
    }
  }

  const backHref = initial ? (admin ? '/admin/kosher' : `/kosher/${initial.id}`) : '/dashboard'

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-8 text-[#183f52] md:px-10 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#c96552]">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <aside className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Local product knowledge</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-.05em]">{initial ? 'Edit product information' : 'Share a product'}</h1>
            <p className="mt-4 text-sm leading-6 text-[#718489]">
              Product details and kosher information are specific to the selected location. New and user-edited submissions go to Admin review.
            </p>
          </aside>

          <form onSubmit={submit} className="rounded-2xl border border-[#dfe5e0] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5">
              <Field label="Product name">
                <input required minLength={2} maxLength={150} name="name" defaultValue={initial?.name} className="control" placeholder="Product name" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Brand (optional)">
                  <input maxLength={100} name="brand" defaultValue={initial?.brand ?? ''} className="control" placeholder="Brand" />
                </Field>
                <Field label="Category (optional)">
                  <input maxLength={80} name="category" defaultValue={initial?.category ?? ''} className="control" placeholder="Snacks, dairy, pantry" />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Country">
                  <select required value={countryId} onChange={(event) => { setCountryId(event.target.value); setCityId('') }} className="control">
                    <option value="">Select a country</option>
                    {countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="City">
                  <select required value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={!country} className="control disabled:opacity-60">
                    <option value="">Select a city</option>
                    {country?.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Kosher information for this location">
                <textarea required minLength={2} maxLength={1500} rows={4} name="kosherInfo" defaultValue={initial?.kosherInfo ?? ''} className="control resize-y" placeholder="Certification, hechsher, or local packaging details" />
              </Field>
              <Field label="Product details (optional)">
                <textarea maxLength={1500} rows={3} name="description" defaultValue={initial?.description ?? ''} className="control resize-y" placeholder="Useful identifying or availability details" />
              </Field>
              <Field label="Image URL (optional)">
                <span className="relative">
                  <ImagePlus size={16} className="absolute left-3 top-3 text-[#6b9a83]" />
                  <input type="url" maxLength={2000} name="imageUrl" defaultValue={initial?.imageUrl ?? ''} className="control pl-9" placeholder="https://example.com/product.jpg" />
                </span>
              </Field>

              {error && <p role="alert" className="rounded-xl bg-[#f9e9e4] px-4 py-3 text-sm text-[#a94f40]">{error}</p>}
              <button type="submit" disabled={pending} className="rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-wait disabled:opacity-60">
                {pending ? 'Saving…' : initial ? 'Save changes' : 'Submit for review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold">{label}{children}</label>
}
