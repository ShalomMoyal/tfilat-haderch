import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { DeleteKosherProductButton, KosherProductModeration } from '@/components/kosher-product-actions'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const statusStyles = {
  PENDING: 'bg-[#f6edcf] text-[#8b6e25]',
  ACTIVE: 'bg-[#e0eee5] text-[#467568]',
  REJECTED: 'bg-[#f6e2dc] text-[#a94f40]',
  INACTIVE: 'bg-[#e0ebef] text-[#356579]',
  EXPIRED: 'bg-[#e0ebef] text-[#356579]',
} as const

export default async function KosherProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.kosherProduct.findUnique({
    where: { id },
    include: { country: true, city: true },
  })
  if (!product) notFound()

  let viewer: { id: string; role?: 'USER' | 'GUIDE' | 'ADMIN' } | null = null
  try {
    const session = await requireAuth()
    viewer = { id: session.user.id, role: session.user.role }
  } catch {
    viewer = null
  }
  const canManage = Boolean(viewer && (viewer.id === product.createdById || viewer.role === 'ADMIN'))
  if (product.status !== 'ACTIVE' && !canManage) notFound()

  const location = [product.city?.name, product.country?.name].filter(Boolean).join(', ')
  const admin = viewer?.role === 'ADMIN'

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-14">
      <div className="mx-auto max-w-[900px]">
        <header className="flex items-center justify-between">
          <Link href="/kosher" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c96552]"><ArrowLeft size={16} /> All products</Link>
          <Link href={viewer ? '/dashboard' : '/login'} className="rounded-full border border-[#b9c7c5] px-4 py-2 text-sm font-semibold">{viewer ? 'Dashboard' : 'Log in'}</Link>
        </header>

        <article className="mt-7 overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white">
          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="max-h-[420px] w-full object-cover" />}
          <div className="p-6 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && <span className="rounded-full bg-[#e0ebef] px-3 py-1 text-xs font-semibold text-[#356579]">{product.category}</span>}
              {canManage && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[product.status as keyof typeof statusStyles]}`}>{product.status}</span>}
            </div>
            <h1 className="mt-4 text-3xl font-medium tracking-[-.05em] md:text-4xl">{product.name}</h1>
            {product.brand && <p className="mt-2 text-base text-[#718489]">{product.brand}</p>}
            <p className="mt-5 flex items-center gap-2 text-sm text-[#718489]">
              <MapPin size={16} className="text-[#d57561]" />{location}
            </p>

            {product.status === 'PENDING' && canManage && <p className="mt-6 rounded-xl bg-[#f6edcf] px-4 py-3 text-sm text-[#715e2d]">This submission is awaiting Admin review and is not visible in public search.</p>}
            {product.status === 'REJECTED' && canManage && <p className="mt-6 rounded-xl bg-[#f6e2dc] px-4 py-3 text-sm text-[#a94f40]">This submission was rejected. You can edit it and submit it for review again.</p>}
            {product.status === 'INACTIVE' && canManage && <p className="mt-6 rounded-xl bg-[#e0ebef] px-4 py-3 text-sm text-[#356579]">This product information is currently inactive.</p>}

            <section className="mt-8 rounded-xl bg-[#f7f7f2] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[.1em] text-[#6b9a83]">Kosher information in {location}</h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#425d65]">{product.kosherInfo}</p>
            </section>
            {product.description && <section className="mt-6"><h2 className="text-sm font-semibold">Product details</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#718489]">{product.description}</p></section>}

            {canManage && (
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#edf0ed] pt-6">
                <Link href={admin ? `/admin/kosher/${product.id}/edit` : `/dashboard/kosher/${product.id}/edit`} className="rounded-full bg-[#183f52] px-4 py-2.5 text-sm font-semibold text-white">Edit information</Link>
                <DeleteKosherProductButton id={product.id} returnTo={admin ? '/admin/kosher' : '/dashboard'} />
                {admin && <KosherProductModeration id={product.id} status={product.status} />}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'
