import Link from 'next/link'
import { Clock3, Users } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ReviewButtons } from '@/components/review-buttons'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

type QueueReviewItem = {
  id: string
  title: string
  subtitle: string
  meta: string
  type: 'MINYAN' | 'LOCATION' | 'PRODUCT'
}

export default async function AdminPage() {
  let session: Awaited<ReturnType<typeof requireAdmin>>

  try {
    session = await requireAdmin()
  } catch {
    redirect('/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [pendingLocations, pendingProducts] = await Promise.all([
    prisma.jewishLocation.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.kosherProduct.findMany({ where: { status: 'PENDING' }, include: { createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const totalPending = pendingLocations.length + pendingProducts.length

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b9a83]">← Home</Link>
            <p className="mt-8 text-[12px] font-semibold uppercase tracking-[.15em] text-[#d57561]">Administration</p>
            <h1 className="mt-2 text-4xl font-medium tracking-[-.05em]">Community review queue</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-[#b9c7c5] px-4 py-2 text-sm font-semibold">Back to dashboard</Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <AdminStat label="Pending approvals" value={String(totalPending)} icon={Clock3} tone="coral" />
          <AdminStat label="Active members" value="2,480" icon={Users} tone="blue" />
        </div>

        <div className="mt-10 space-y-8">
          <QueueSection title="Jewish places" items={pendingLocations.map((item: any) => ({ id: item.id, title: item.name, subtitle: item.type, meta: item.createdBy?.name ?? item.createdBy?.email ?? 'Community member', type: 'LOCATION' as const }))} />
          <QueueSection title="Kosher product records" items={pendingProducts.map((item: any) => ({ id: item.id, title: item.name, subtitle: item.brand ?? 'Product record', meta: item.createdBy?.name ?? item.createdBy?.email ?? 'Community member', type: 'PRODUCT' as const }))} />
        </div>
      </div>
    </main>
  )
}

function AdminStat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Clock3; tone: 'coral' | 'green' | 'blue' }) {
  const colors = {
    coral: 'bg-[#f6e2dc] text-[#bd614f]',
    green: 'bg-[#e0eee5] text-[#54816e]',
    blue: 'bg-[#e0ebef] text-[#356579]',
  }

  return (
    <div className="rounded-2xl border border-[#dfe5e0] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7d83]">{label}</p>
        <span className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-.05em]">{value}</p>
    </div>
  )
}

function QueueSection({ title, items }: { title: string; items: QueueReviewItem[] }) {
  return (
    <section className="rounded-[22px] border border-[#dfe5e0] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-.03em]">{title}</h2>
          <p className="mt-1 text-sm text-[#7e8e91]">Review submissions before they go live.</p>
        </div>
        <span className="rounded-full bg-[#edf3ef] px-3 py-1.5 text-xs font-semibold text-[#54816e]">{items.length} pending</span>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd9d3] bg-[#f7f7f2] p-5 text-sm text-[#718489]">No pending submissions in this queue.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[#edf0ed] bg-[#f9f9f7] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[#6b7d83]">{item.subtitle}</p>
                <p className="mt-1 text-xs text-[#7e8e91]">Submitted by {item.meta}</p>
              </div>
              <ReviewButtons target={item.type} id={item.id} />
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export const metadata = { title: 'Admin · Tefilat Ha-Derech', description: 'Manage community content and approvals.' }
