'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MapPin, Search, ShieldCheck } from 'lucide-react'
import type { PublicKosherProduct } from '@/app/actions/kosher-products'

type CountryOption = { id: string; name: string; cities: { id: string; name: string }[] }
type ProductFilters = { search: string; brand: string; category: string; countryId: string; cityId: string }

export function KosherProductDirectory({
  products,
  countries,
  categories,
  filters,
  page,
  pageSize,
  total,
}: {
  products: PublicKosherProduct[]
  countries: CountryOption[]
  categories: string[]
  filters: ProductFilters
  page: number
  pageSize: number
  total: number
}) {
  const [countryId, setCountryId] = useState(filters.countryId)
  const [cityId, setCityId] = useState(filters.cityId)
  const country = countries.find((item) => item.id === countryId)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function pageHref(nextPage: number) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.category) params.set('category', filters.category)
    if (filters.countryId) params.set('countryId', filters.countryId)
    if (filters.cityId) params.set('cityId', filters.cityId)
    params.set('page', String(nextPage))
    return `/kosher?${params.toString()}`
  }

  return (
    <div>
      <form action="/kosher" method="get" className="grid gap-3 rounded-2xl border border-[#dfe5e0] bg-white p-4 md:grid-cols-3 xl:grid-cols-5">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe5e0] px-3">
          <Search size={17} className="shrink-0 text-[#6b9a83]" />
          <span className="sr-only">Product search</span>
          <input name="search" defaultValue={filters.search} placeholder="Product name or brand" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#91a09f]" />
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3">
          <span className="sr-only">Brand</span>
          <input name="brand" defaultValue={filters.brand} placeholder="Brand" className="w-full bg-transparent py-3 text-sm outline-none" />
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3">
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={filters.category} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3">
          <span className="sr-only">Country</span>
          <select name="countryId" value={countryId} onChange={(event) => { setCountryId(event.target.value); setCityId('') }} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none">
            <option value="">All countries</option>
            {countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="flex items-center rounded-xl border border-[#dfe5e0] px-3">
          <span className="sr-only">City</span>
          <select name="cityId" value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={!country} className="w-full bg-transparent py-3 text-sm text-[#183f52] outline-none disabled:opacity-50">
            <option value="">All cities</option>
            {country?.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-2 md:col-span-3 xl:col-span-5">
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#183f52] px-5 py-2.5 text-sm font-semibold text-white"><Search size={15} />Search products</button>
          <Link href="/kosher" className="rounded-full border border-[#b9c7c5] px-4 py-2.5 text-sm font-semibold text-[#183f52]">Clear filters</Link>
          <Link href="/dashboard/kosher/new" className="ml-auto rounded-full bg-[#d57561] px-4 py-2.5 text-sm font-semibold text-white">Add product info</Link>
        </div>
      </form>

      <div className="mb-4 mt-6 flex items-center justify-between text-sm text-[#718489]">
        <p>{total} {total === 1 ? 'product' : 'products'} · Active, community-reviewed entries</p>
        {pageCount > 1 && <p>Page {page} of {pageCount}</p>}
      </div>

      {products.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white">
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="h-44 w-full object-cover" loading="lazy" />}
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {product.category && <span className="rounded-full bg-[#e0ebef] px-3 py-1 text-xs font-semibold text-[#356579]">{product.category}</span>}
                  <span className="rounded-full bg-[#e0eee5] px-3 py-1 text-xs font-semibold text-[#54816e]">Local information</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold">{product.name}</h2>
                {product.brand && <p className="mt-1 text-sm text-[#718489]">{product.brand}</p>}
                <p className="mt-4 flex items-center gap-2 text-sm text-[#718489]">
                  <MapPin size={15} className="shrink-0 text-[#d57561]" />
                  {[product.city?.name, product.country?.name].filter(Boolean).join(', ')}
                </p>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#526b72]">{product.kosherInfo ?? 'No location-specific kosher note is available.'}</p>
                <Link href={`/kosher/${product.id}`} className="mt-5 inline-flex items-center gap-2 border-t border-[#edf0ed] pt-4 text-sm font-semibold text-[#c96552]">
                  View product details <ArrowRight size={15} />
                </Link>
                <span className="ml-4 inline-flex items-center gap-1 text-[11px] text-[#7e8e91]"><ShieldCheck size={13} /> Admin reviewed</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cbd9d3] bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="mt-2 text-sm text-[#718489]">Try broadening the location or search filters.</p>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? <Link href={pageHref(page - 1)} className="inline-flex items-center gap-2 rounded-full border border-[#b9c7c5] bg-white px-4 py-2.5 text-sm font-semibold"><ArrowLeft size={15} />Previous</Link> : <span />}
          {page < pageCount && <Link href={pageHref(page + 1)} className="inline-flex items-center gap-2 rounded-full border border-[#b9c7c5] bg-white px-4 py-2.5 text-sm font-semibold">Next<ArrowRight size={15} /></Link>}
        </nav>
      )}
    </div>
  )
}
