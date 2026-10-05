import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, MapPin, Plus, Users } from 'lucide-react'
import { AuthMenu } from '@/components/auth-menu'
import { LogoutButton } from '@/components/logout-button'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await requireAuth()
  const now = new Date()

  const [joined, created, joinedCount, activeCreatedCount] = await Promise.all([
    prisma.minyanParticipant.findMany({
      where: { userId: session.user.id, minyan: { is: { status: 'ACTIVE', expiresAt: { gt: now } } } },
      include: { minyan: { include: { city: true, country: true, _count: { select: { participants: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.minyan.findMany({
      where: { createdById: session.user.id },
      include: { city: true, country: true, _count: { select: { participants: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.minyanParticipant.count({
      where: { userId: session.user.id, minyan: { is: { status: 'ACTIVE', expiresAt: { gt: now } } } },
    }),
    prisma.minyan.count({ where: { createdById: session.user.id, status: 'ACTIVE', expiresAt: { gt: now } } }),
  ])

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#183f52]">
      <header className="border-b border-[#dfe5e0] bg-white/80 px-5 backdrop-blur md:px-10">
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#183f52] text-lg tracking-[-.08em] text-white">תד</span>
            <span className="text-sm font-semibold">Tefilat Ha-Derech</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-full px-4 py-2 text-[#6b7d83] hover:bg-[#edf3ef]">Explore</Link>
            <AuthMenu />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Your journey</p>
            <h1 className="text-4xl font-medium tracking-[-.06em]">Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.</h1>
            <p className="mt-3 text-[#718489]">Your prayer plans and community connections, all in one place.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/minyan/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#183f52] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28566b]">
              <Plus size={17} /> Create a minyan
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-[#dfe5e0] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]">Name</p>
              <p className="mt-2 text-lg font-semibold text-[#183f52]">{session.user.name ?? 'Traveler'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]">Email</p>
              <p className="mt-2 text-lg font-semibold text-[#183f52]">{session.user.email ?? 'No email on file'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6b9a83]">Role</p>
              <p className="mt-2 text-lg font-semibold text-[#183f52]">{session.user.role}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat label="Joined gatherings" value={joinedCount} icon={Users} />
          <Stat label="Active minyanim created" value={activeCreatedCount} icon={CalendarDays} />
          <div className="rounded-2xl border border-[#dfe5e0] bg-[#e0eee5] p-5">
            <p className="text-sm text-[#54816e]">Community status</p>
            <p className="mt-3 text-xl font-semibold text-[#183f52]">Connected</p>
            <p className="mt-1 text-xs text-[#6b7d83]">Keep showing up for one another.</p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <List
            title="Minyanim you joined"
            items={joined.map((entry: { minyan: DashboardMinyanSummary }) => entry.minyan)}
            empty="You have not joined any active minyanim yet."
            emptyHref="/minyanim"
            emptyLabel="Explore gatherings"
          />
          <List
            title="Minyanim you created"
            items={created}
            empty="You have not created a minyan yet."
            emptyHref="/dashboard/minyan/new"
            emptyLabel="Create your first minyan"
          />
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-[#dfe5e0] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7e8e91]">{label}</p>
        <Icon size={17} className="text-[#d57561]" />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

type DashboardMinyanSummary = {
  id: string
  title: string
  startDateTime: Date
  expiresAt: Date
  status: string
  address: string | null
  city: { name: string } | null
  country: { name: string } | null
  _count: { participants: number }
}

function List({ title, items, empty, emptyHref, emptyLabel }: { title: string; items: DashboardMinyanSummary[]; empty: string; emptyHref: string; emptyLabel: string }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={emptyHref} className="text-sm font-semibold text-[#d57561]">
          {title.startsWith('Minyanim you created') ? 'Create' : 'Explore'} <ArrowRight className="ml-1 inline" size={15} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {items.length ? (
          items.map((minyan) => (
            <Link href={`/minyan/${minyan.id}`} key={minyan.id} className="group rounded-2xl border border-[#dfe5e0] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#a9c3b7] hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold group-hover:text-[#d57561]">{minyan.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${minyan.status === 'ACTIVE' && minyan.expiresAt > new Date() ? 'bg-[#e0eee5] text-[#467568]' : 'bg-[#f6e2dc] text-[#a94f40]'}`}>
                      {minyan.status === 'ACTIVE' && minyan.expiresAt > new Date() ? 'Active' : minyan.status === 'EXPIRED' || minyan.expiresAt <= new Date() ? 'Expired' : minyan.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#718489]">
                    <MapPin size={15} className="text-[#d57561]" />
                    {minyan.city?.name ?? minyan.address ?? 'Location to be confirmed'}
                    {minyan.country ? `, ${minyan.country.name}` : ''}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#718489]">
                    <Clock3 size={15} className="text-[#6b9a83]" />
                    {new Date(minyan.startDateTime).toLocaleString()}
                  </p>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-[#edf3ef] px-2.5 py-1 text-xs font-semibold text-[#54816e]">
                  <Users size={13} />{minyan._count.participants}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd9d3] bg-white/60 p-6 text-sm text-[#718489]">
            {empty}
            <Link href={emptyHref} className="mt-3 block font-semibold text-[#d57561]">
              {emptyLabel} <ArrowRight className="ml-1 inline" size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
