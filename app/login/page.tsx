'use client'

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    if (mode === 'register') {
      const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!response.ok) { setError((await response.json()).error ?? 'Could not create your account.'); setBusy(false); return }
    }
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    if (result?.error) setError('Unable to sign in with those details.')
    else router.push('/dashboard')
    setBusy(false)
  }

  return <main className="min-h-screen bg-[#f7f7f2] text-[#183f52] lg:grid lg:grid-cols-[.95fr_1.05fr]">
    <section className="hidden bg-[#183f52] p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <a href="/" className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-10 place-items-center rounded-2xl bg-[#f1d5a5] text-[#183f52] text-lg tracking-[-.08em]">תד</span>Tefilat Ha-Derech</a>
      <div className="max-w-md"><Sparkles className="mb-8 text-[#f1d5a5]" size={27} /><h1 className="text-5xl font-medium leading-[.98] tracking-[-.06em]">Your journey feels better when you don&apos;t travel it alone.</h1><p className="mt-6 leading-7 text-[#b7d1c4]">Find prayer, people and places that make every destination feel a little more like home.</p><ul className="mt-9 flex flex-col gap-4 text-sm text-[#d9e5dd]"><li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Join minyanim wherever you are</li><li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Create a gathering for your community</li><li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Keep your plans in one peaceful place</li></ul></div>
      <p className="text-xs text-[#9eb4b4]">Built for travelers, by the community.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-10"><div className="w-full max-w-md"><a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#467568] lg:hidden"><ArrowLeft size={16} /> Back home</a><div className="mt-8 lg:mt-0"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Welcome to the community</p><h2 className="mt-3 text-4xl font-medium tracking-[-.06em]">{mode === 'login' ? 'Welcome back.' : 'Start your journey.'}</h2><p className="mt-3 text-sm leading-6 text-[#718489]">{mode === 'login' ? 'Sign in to create and join minyanim.' : 'Create an account to contribute on the way.'}</p></div><form onSubmit={submit} className="mt-8 flex flex-col gap-4">{mode === 'register' && <label className="flex flex-col gap-2 text-sm font-semibold">Full name<input required minLength={2} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10" /></label>}<label className="flex flex-col gap-2 text-sm font-semibold">Email<input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Password<span className="relative"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 pr-12 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718489]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>{error && <p role="alert" className="rounded-xl bg-[#f6e2dc] px-4 py-3 text-sm text-[#bd614f]">{error}</p>}<button disabled={busy} className="mt-2 rounded-xl bg-[#183f52] px-4 py-3.5 font-semibold text-white transition hover:bg-[#28566b] disabled:opacity-60">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="mt-3 w-full rounded-xl border border-[#b9c7c5] bg-white px-4 py-3.5 text-sm font-semibold transition hover:border-[#183f52]">Continue with Google</button><p className="mt-7 text-center text-sm text-[#718489]">{mode === 'login' ? 'New to Tefilat Ha-Derech?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="font-semibold text-[#467568] underline underline-offset-4">{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></section>
  </main>
}
