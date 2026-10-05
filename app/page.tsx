'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapMinyanPicker } from '@/components/map-minyan-picker'
import { getActiveMinyanim } from '@/app/actions/minyan'
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Menu,
  Navigation,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react'

const quickActions = [
  { label: 'Find a minyan', detail: 'Pray together, anywhere', icon: Clock3, tone: 'coral', href: '/minyanim' },
  { label: 'Synagogues & Chabad', detail: 'A place to connect', icon: Compass, tone: 'blue', href: '/places' },
  { label: 'Kosher products', detail: 'Shop with confidence', icon: Sparkles, tone: 'gold', href: '/kosher' },
  { label: 'Explore trips', detail: 'Go further, thoughtfully', icon: Navigation, tone: 'green', href: '/trips' },
]

type HomeMinyan = { id: string; title: string; place: string; time: string; people: number; tag: string; color: string; latitude: number | null; longitude: number | null }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const [submittedDestination, setSubmittedDestination] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [minyanim, setMinyanim] = useState<HomeMinyan[]>([])

  useEffect(() => {
    let cancelled = false
    getActiveMinyanim().then((rows) => {
      if (cancelled) return
      setMinyanim(rows.map((minyan, index) => ({
        id: minyan.id,
        title: minyan.title,
        place: [minyan.city?.name, minyan.country?.name].filter(Boolean).join(', ') || minyan.address || 'Location details unavailable',
        time: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(minyan.startDateTime)),
        people: minyan._count.participants,
        tag: minyan.type === 'RECURRING' ? 'Recurring' : minyan.prayerType,
        color: ['coral', 'blue', 'green'][index % 3],
        latitude: minyan.latitude,
        longitude: minyan.longitude,
      })))
    }).catch(() => {
      if (!cancelled) setMinyanim([])
    })
    return () => { cancelled = true }
  }, [])

  const visibleMinyanim = useMemo(() => {
    if (!submittedDestination) return minyanim
    return minyanim.filter((item) => `${item.title} ${item.place}`.toLowerCase().includes(submittedDestination.toLowerCase()))
  }, [minyanim, submittedDestination])

  const mapMarkers = useMemo(() => minyanim.flatMap((minyan) => (
    minyan.latitude !== null && minyan.longitude !== null
      ? [{ id: minyan.id, title: minyan.title, position: { lat: minyan.latitude, lng: minyan.longitude }, href: `/minyan/${minyan.id}` }]
      : []
  )), [minyanim])

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedDestination(destination.trim())
  }

  function toggleSaved(title: string) {
    setSaved((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title])
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2] text-[#132b3f]">
      <header className="relative z-20 border-b border-[#dfe5e0] bg-[#f7f7f2]/95 px-5 backdrop-blur md:px-10">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Tefilat Ha-Derech home">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#183f52] text-[#f7f7f2] shadow-sm">
              <span className="text-lg font-semibold tracking-[-0.08em]">תד</span>
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Tefilat Ha-Derech</span>
          </a>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#5e737e] lg:flex" aria-label="Main navigation">
            <a className="text-[#183f52]" href="#home">Home</a>
            <a href="/minyanim">Minyanim</a>
  <a href="/places">Synagogues & Chabad</a>
  <a href="/kosher">Kosher products</a>
  <a href="/trips">Trips</a>
  <a href="/about">About</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#5e737e] hover:bg-[#eaf0ec]" type="button">
              EN <ChevronDown size={14} />
            </button>
            <a href="/login" className="rounded-full border border-[#b9c7c5] px-5 py-2.5 text-[13px] font-semibold text-[#183f52] transition hover:border-[#183f52] hover:bg-white">Log in</a>
          </div>
          <button className="grid size-10 place-items-center rounded-full border border-[#b9c7c5] text-[#183f52] md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-[#dfe5e0] py-5 text-sm font-medium lg:hidden" aria-label="Mobile navigation"><a href="#minyanim">Minyanim</a><a href="/places">Synagogues & Chabad</a><a href="/kosher">Kosher products</a><a href="/trips">Trips</a><a href="/login" className="w-fit rounded-full bg-[#183f52] px-5 py-2.5 text-white">Log in</a></nav>}
      </header>

      <section id="home" className="px-5 pb-14 pt-14 md:px-10 md:pb-20 md:pt-20">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1.03fr_.97fr] lg:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#cbd9d3] bg-[#edf3ef] px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.13em] text-[#467568]"><span className="size-1.5 rounded-full bg-[#6b9a83]" /> Your journey, connected</div>
            <h1 className="max-w-[650px] text-[clamp(3.2rem,6vw,5.6rem)] font-medium leading-[.94] tracking-[-0.065em] text-[#183f52]">Find your Jewish community <em className="font-serif font-normal text-[#d57561]">wherever</em> you travel.</h1>
            <p className="mt-7 max-w-[480px] text-[17px] leading-7 text-[#6b7d83]">A trusted companion for Jewish travelers. Discover minyanim, meaningful places, local kosher products and trips curated by people who know the way.</p>
            <form onSubmit={search} className="mt-9 flex max-w-[510px] items-center gap-2 rounded-[20px] border border-[#c8d4d1] bg-white p-2 shadow-[0_16px_45px_rgba(24,63,82,.08)] focus-within:border-[#6b9a83] focus-within:ring-4 focus-within:ring-[#6b9a83]/10">
              <MapPin className="ml-3 shrink-0 text-[#d57561]" size={19} /><input value={destination} onChange={(event) => setDestination(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-[#183f52] outline-none placeholder:text-[#9aa9aa]" placeholder="Where are you headed?" aria-label="Destination" /><button className="rounded-[14px] bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b]" type="submit"><Search size={17} /></button>
            </form>
            {submittedDestination && <p className="mt-3 text-sm text-[#467568]">Showing places matching “{submittedDestination}”. <button onClick={() => { setDestination(''); setSubmittedDestination('') }} className="underline">Clear</button></p>}
          </div>

<MapMinyanPicker markers={mapMarkers} />
        </div>
      </section>

      <section className="border-y border-[#dfe5e0] bg-white/55 px-5 py-8 md:px-10"><div className="mx-auto grid max-w-[1240px] gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickActions.map(({label, detail, icon: Icon, tone, href}) => <a href={href} key={label}
          className="group flex items-center gap-4 rounded-2xl border border-[#dfe5e0] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#a9c3b7] hover:shadow-lg">
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone === 'coral' ? 'bg-[#f6e2dc] text-[#c96552]' : tone === 'blue' ? 'bg-[#e0ebef] text-[#356579]' : tone === 'gold' ? 'bg-[#f6edcf] text-[#a78337]' : 'bg-[#e0eee5] text-[#54816e]'}`}><Icon size={20} /></span>
          <span><span className="block text-sm font-semibold text-[#183f52]">{label}</span><span className="mt-1 block text-[11px] text-[#819093]">{detail}</span></span>
          <ArrowRight className="ml-auto text-[#a9b6b5] transition group-hover:translate-x-1" size={16} /></a>)}</div></section>

      <section id="minyanim" className="px-5 py-16 md:px-10 md:py-24"><div className="mx-auto max-w-[1240px]"><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-[12px] font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Right now</p><h2 className="text-3xl font-medium tracking-[-.04em] text-[#183f52] md:text-4xl">Minyanim on your way</h2><p className="mt-2 text-sm text-[#7e8e91]">Join a prayer happening nearby, or create one for your journey.</p></div><a href="#all" className="hidden items-center gap-2 text-sm font-semibold text-[#d57561] sm:flex">View all <ArrowRight size={16} /></a></div><div className="grid gap-4 lg:grid-cols-3">{visibleMinyanim.map((item) => <article key={item.title} className="group rounded-[22px] border border-[#dfe5e0] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(24,63,82,.09)]"><div className="mb-6 flex items-start justify-between"><span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.color === 'coral' ? 'bg-[#f6e2dc] text-[#bd614f]' : item.color === 'blue' ? 'bg-[#e0ebef] text-[#356579]' : 'bg-[#e0eee5] text-[#54816e]'}`}>{item.tag}</span><button onClick={() => toggleSaved(item.title)} className="text-[#a5b1b1] transition hover:text-[#d57561]" aria-label={`Save ${item.title}`}><Heart size={19} fill={saved.includes(item.title) ? 'currentColor' : 'none'} className={saved.includes(item.title) ? 'text-[#d57561]' : ''} /></button></div><h3 className="text-lg font-semibold tracking-[-.02em] text-[#183f52]">{item.title}</h3><div className="mt-4 space-y-2.5 text-[13px] text-[#738488]"><p className="flex items-center gap-2"><MapPin size={15} className="text-[#d57561]" />{item.place}</p><p className="flex items-center gap-2"><Clock3 size={15} className="text-[#6b9a83]" />{item.time}</p></div><div className="mt-6 flex items-center justify-between border-t border-[#edf0ed] pt-4"><span className="flex items-center gap-2 text-[12px] text-[#7d8d8f]"><span className="flex -space-x-1.5"><i className="size-5 rounded-full border-2 border-white bg-[#d8b39e]" /><i className="size-5 rounded-full border-2 border-white bg-[#9bb6ba]" /><i className="size-5 rounded-full border-2 border-white bg-[#d7d1a4]" /></span>{item.people} people going</span><button className="text-[12px] font-semibold text-[#183f52] hover:text-[#d57561]">View details</button></div></article>)}</div>{visibleMinyanim.length === 0 && <div className="rounded-2xl border border-dashed border-[#b9c7c5] p-10 text-center text-sm text-[#7e8e91]">No minyanim match this destination yet. Try another place or create one for your group.</div>}</div></section>

      <section id="about" className="bg-[#183f52] px-5 py-14 text-white md:px-10"><div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="mb-3 text-[12px] font-semibold uppercase tracking-[.15em] text-[#b7d1c4]">Travel with intention</p><h2 className="max-w-[600px] text-3xl font-medium leading-tight tracking-[-.04em] md:text-4xl">The best journeys feel a little more like home.</h2></div><a href="/login" className="inline-flex items-center gap-3 rounded-full bg-[#f1d5a5] px-6 py-3.5 text-sm font-semibold text-[#183f52] transition hover:bg-[#f7e5c2]">Join the community <ArrowRight size={17} /></a></div></section>

      <footer className="bg-[#123344] px-5 py-6 text-xs text-[#9eb4b4] md:px-10"><div className="mx-auto flex max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>© 2025 Tefilat Ha-Derech</span><span>Built for travelers, by the community.</span></div></footer>
    </main>
  )
}
