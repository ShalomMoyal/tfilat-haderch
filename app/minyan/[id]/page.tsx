import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock3, MapPin, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import JoinMinyanButton from '@/components/join-minyan-button'
import { DeleteMinyanButton } from '@/components/minyan-management-buttons'
import GoogleMapLocationPicker from '@/components/google-map-location-picker'

export const dynamic = 'force-dynamic'

export default async function MinyanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const minyan = await prisma.minyan.findUnique({
    where: { id },
    include: {
      city: true,
      country: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
  })
  if (!minyan) notFound()

  let viewer: { id: string; role?: 'USER' | 'GUIDE' | 'ADMIN' } | null = null
  try {
    const session = await requireAuth()
    viewer = { id: session.user.id, role: session.user.role }
  } catch {
    viewer = null
  }

  const canManage = Boolean(viewer && (viewer.id === minyan.createdById || viewer.role === 'ADMIN'))
  const now = new Date()
  const isActive = minyan.status === 'ACTIVE' && minyan.expiresAt > now
  if (!canManage && !['ACTIVE', 'EXPIRED'].includes(minyan.status)) notFound()

  const hasJoined = viewer
    ? Boolean(await prisma.minyanParticipant.findUnique({ where: { minyanId_userId: { minyanId: id, userId: viewer.id } }, select: { id: true } }))
    : false
  const location = [minyan.city?.name, minyan.country?.name].filter(Boolean).join(', ')
  const mapUrl = minyan.latitude !== null && minyan.longitude !== null
    ? `https://www.google.com/maps/search/?api=1&query=${minyan.latitude},${minyan.longitude}`
    : null
  const markers = minyan.latitude !== null && minyan.longitude !== null
    ? [{ id: minyan.id, title: minyan.title, subtitle: `${minyan._count.participants} attending`, position: { lat: minyan.latitude, lng: minyan.longitude }, href: `/minyan/${minyan.id}` }]
    : []

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#183f52]">
      <header className="border-b border-[#dfe5e0] bg-white/80 px-5 backdrop-blur md:px-10">
        <div className="mx-auto flex h-[74px] max-w-[980px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#183f52] text-lg tracking-[-.08em] text-white">תד</span>
            <span className="text-sm font-semibold">Tefilat Ha-Derech</span>
          </Link>
          <Link href={viewer ? '/dashboard' : '/login'} className="rounded-full border border-[#b9c7c5] px-4 py-2 text-sm font-semibold hover:bg-white">{viewer ? 'Dashboard' : 'Log in'}</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[900px] px-5 py-10 md:px-10 md:py-14">
        <Link href="/minyanim" className="inline-flex items-center gap-2 text-sm font-semibold text-[#d57561]"><ArrowLeft size={16} /> Back to minyanim</Link>
        <article className="mt-8 overflow-hidden rounded-2xl border border-[#dfe5e0] bg-white">
          <div className="bg-[#183f52] px-6 py-9 text-white md:px-10">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e0eee5] px-3 py-1 text-xs font-semibold text-[#467568]">{minyan.type === 'RECURRING' ? 'Recurring gathering' : 'One-time gathering'}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-[#e0eee5] text-[#467568]' : 'bg-[#f6e2dc] text-[#a94f40]'}`}>{isActive ? 'Active' : 'Expired'}</span>
            </div>
            <h1 className="mt-5 text-4xl font-medium leading-tight tracking-[-.06em]">{minyan.title}</h1>
            <p className="mt-3 text-sm text-[#b7d1c4]">{prayerLabels[minyan.prayerType as keyof typeof prayerLabels]} prayer gathering</p>
          </div>

          <div className="p-6 md:p-10">
            {minyan.description && <p className="text-base leading-7 text-[#718489]">{minyan.description}</p>}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Info icon={Clock3} label="Prayer time" value={minyan.startDateTime.toLocaleString()} />
              <Info icon={MapPin} label="Location" value={[location, minyan.address].filter(Boolean).join(' · ') || 'Location details unavailable'} />
              <Info icon={Users} label="Participants" value={`${minyan._count.participants} ${minyan._count.participants === 1 ? 'person' : 'people'} joined`} />
              <Info icon={CalendarDays} label="Available until" value={minyan.expiresAt.toLocaleString()} />
              <Info icon={Users} label="Created by" value={minyan.createdBy.name ?? 'Community member'} />
              {minyan.type === 'RECURRING' && <Info icon={CalendarDays} label="Schedule" value={`${minyan.recurrenceRule ?? 'Recurring'}${minyan.time ? ` · ${minyan.time}` : ''}`} />}
            </div>

            {minyan.latitude !== null && minyan.longitude !== null && (
              <div className="mt-7">
                <GoogleMapLocationPicker value={{ lat: minyan.latitude, lng: minyan.longitude }} markers={markers} />
                <p className="mt-2 text-xs text-[#718489]">{minyan.latitude.toFixed(5)}, {minyan.longitude.toFixed(5)}</p>
                {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#356579] hover:underline">Open in Google Maps</a>}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 border-t border-[#edf0ed] pt-6">
              {isActive && viewer && <JoinMinyanButton minyanId={id} initialJoined={hasJoined} />}
              {isActive && !viewer && <Link href={`/login?callbackUrl=${encodeURIComponent(`/minyan/${id}`)}`} className="rounded-full bg-[#183f52] px-5 py-3.5 text-center text-sm font-semibold text-white">Log in to join</Link>}
              {!isActive && <p className="rounded-xl bg-[#f9e9e4] px-4 py-3 text-sm text-[#a94f40]">This minyan has expired and can no longer be joined.</p>}
              {canManage && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/dashboard/minyan/${id}/edit`} className="rounded-full bg-[#183f52] px-4 py-2.5 text-sm font-semibold text-white">Edit minyan</Link>
                  <DeleteMinyanButton minyanId={id} />
                </div>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f7f7f2] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]"><Icon size={15} />{label}</div>
      <p className="mt-2 break-words text-sm leading-5 text-[#718489]">{value}</p>
    </div>
  )
}

const prayerLabels = { SHACHARIT: 'Shacharit', MINCHA: 'Mincha', MAARIV: 'Maariv', MUSAF: 'Musaf', OTHER: 'Other' } as const
