import { countPublicKosherProducts, getPublicKosherProducts } from '@/app/actions/kosher-products'
import { KosherProductDirectory } from '@/components/kosher-product-directory'
import { prisma } from '@/lib/prisma'

const pageSize = 12
type SearchParams = Promise<Record<string, string | string[] | undefined>>

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const entry = params[key]
  return typeof entry === 'string' ? entry : ''
}

export default async function KosherPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(value(params, 'page'), 10) || 1)
  const filters = {
    search: value(params, 'search').slice(0, 120),
    brand: value(params, 'brand').slice(0, 100),
    category: value(params, 'category').slice(0, 80),
    countryId: value(params, 'countryId'),
    cityId: value(params, 'cityId'),
  }
  const query = { ...filters, page, take: pageSize }
  const [products, total, countries, categoryRows] = await Promise.all([
    getPublicKosherProducts(query),
    countPublicKosherProducts(query),
    prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, cities: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    }),
    prisma.kosherProduct.findMany({
      where: { status: 'ACTIVE', category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ])
  const categories = categoryRows.flatMap((row: { category: string | null }) => row.category ? [row.category] : [])

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-14">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between">
        <a href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#183f52] text-lg tracking-[-.08em] text-white">תד</span>
          Tefilat Ha-Derech
        </a>
        <a href="/dashboard" className="rounded-full border border-[#b9c7c5] px-4 py-2 text-sm font-semibold">Dashboard</a>
      </header>
      <section className="mx-auto max-w-[1240px] py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Location-specific product notes</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-.05em] md:text-5xl">Kosher products, place by place.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718489]">Find community-reviewed information about products sold locally. Certifications can vary by country and city, so check the package where you shop.</p>
        <div className="mt-8">
          <KosherProductDirectory products={products} countries={countries} categories={categories} filters={filters} page={page} pageSize={pageSize} total={total} />
        </div>
      </section>
    </main>
  )
}

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Kosher products · Tefilat Ha-Derech', description: 'Search location-specific, community-reviewed kosher product information.' }
