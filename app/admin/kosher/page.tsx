import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeleteKosherProductButton, KosherProductModeration } from '@/components/kosher-product-actions'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const statusOrder = { PENDING: 0, REJECTED: 1, INACTIVE: 2, ACTIVE: 3 } as const

type AdminProduct = {
  id: string
  name: string
  brand: string | null
  category: string | null
  status: keyof typeof statusOrder
  updatedAt: Date
  country: { name: string } | null
  city: { name: string } | null
  createdBy: { name: string | null; email: string | null }
}

export default async function AdminKosherProductsPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/login?callbackUrl=%2Fadmin%2Fkosher')
  }

  const [products, pendingCount, activeCount, inactiveCount, rejectedCount] = await Promise.all([
    prisma.kosherProduct.findMany({
      include: { country: true, city: true, createdBy: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.kosherProduct.count({ where: { status: 'PENDING' } }),
    prisma.kosherProduct.count({ where: { status: 'ACTIVE' } }),
    prisma.kosherProduct.count({ where: { status: 'INACTIVE' } }),
    prisma.kosherProduct.count({ where: { status: 'REJECTED' } }),
  ])
  const orderedProducts = [...products].sort((a: AdminProduct, b: AdminProduct) => statusOrder[a.status] - statusOrder[b.status] || b.updatedAt.getTime() - a.updatedAt.getTime())

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-14">
      <div className="mx-auto max-w-[1100px]">
        <Link href="/admin" className="text-sm font-semibold text-[#6b9a83]">← Administration</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#d57561]">Moderation</p>
            <h1 className="mt-2 text-4xl font-medium tracking-[-.05em]">Kosher products</h1>
          </div>
          <p className="text-sm text-[#718489]">{products.length} shown · ordered by review status</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Count label="Pending" value={pendingCount} tone="gold" />
          <Count label="Active" value={activeCount} tone="green" />
          <Count label="Rejected" value={rejectedCount} tone="coral" />
          <Count label="Inactive" value={inactiveCount} tone="blue" />
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white">
          {orderedProducts.length ? orderedProducts.map((product: AdminProduct) => (
            <article key={product.id} className="flex flex-col gap-4 border-b border-[#edf0ed] p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{product.name}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[product.status]}`}>{product.status}</span>
                </div>
                <p className="mt-1 text-sm text-[#718489]">{[product.brand, product.category].filter(Boolean).join(' · ') || 'Product information'}</p>
                <p className="mt-1 text-xs text-[#7e8e91]">{[product.city?.name, product.country?.name].filter(Boolean).join(', ')} · Submitted by {product.createdBy.name ?? product.createdBy.email ?? 'Community member'}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Link href={`/kosher/${product.id}`} className="text-sm font-semibold text-[#356579]">Inspect</Link>
                <Link href={`/admin/kosher/${product.id}/edit`} className="rounded-full border border-[#b9c7c5] px-4 py-2 text-sm font-semibold">Edit</Link>
                <KosherProductModeration id={product.id} status={product.status} />
                <DeleteKosherProductButton id={product.id} returnTo="/admin/kosher" />
              </div>
            </article>
          )) : (
            <p className="p-8 text-center text-sm text-[#718489]">No KosherProduct submissions yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}

function Count({ label, value, tone }: { label: string; value: number; tone: 'gold' | 'green' | 'coral' | 'blue' }) {
  const colors = { gold: 'bg-[#f6edcf] text-[#8b6e25]', green: 'bg-[#e0eee5] text-[#54816e]', coral: 'bg-[#f6e2dc] text-[#bd614f]', blue: 'bg-[#e0ebef] text-[#356579]' }
  return <div className="rounded-xl border border-[#dfe5e0] bg-white p-4"><p className="text-sm text-[#718489]">{label}</p><p className={`mt-3 inline-flex rounded-full px-3 py-1 text-lg font-semibold ${colors[tone]}`}>{value}</p></div>
}

const statusClass = { PENDING: 'bg-[#f6edcf] text-[#8b6e25]', ACTIVE: 'bg-[#e0eee5] text-[#467568]', REJECTED: 'bg-[#f6e2dc] text-[#a94f40]', INACTIVE: 'bg-[#e0ebef] text-[#356579]' } as const

export const dynamic = 'force-dynamic'
