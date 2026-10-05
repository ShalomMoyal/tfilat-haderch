'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')

    const result = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setPending(false)

    if (result?.error) {
      setError('Invalid email or password.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#183f52] lg:grid lg:grid-cols-[.95fr_1.05fr]">
      <section className="hidden bg-[#183f52] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#f1d5a5] text-lg tracking-[-.08em] text-[#183f52]">תד</span>
          Tefilat Ha-Derech
        </Link>

        <div className="max-w-md">
          <Sparkles className="mb-8 text-[#f1d5a5]" size={27} />
          <h1 className="text-5xl font-medium leading-[.98] tracking-[-.06em]">
            Your journey feels better when you don&apos;t travel it alone.
          </h1>
          <p className="mt-6 leading-7 text-[#b7d1c4]">
            Find prayer, people and places that make every destination feel a little more like home.
          </p>

          <ul className="mt-9 flex flex-col gap-4 text-sm text-[#d9e5dd]">
            <li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Join minyanim wherever you are</li>
            <li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Create a gathering for your community</li>
            <li className="flex items-center gap-3"><Check size={17} className="text-[#f1d5a5]" />Keep your plans in one peaceful place</li>
          </ul>
        </div>

        <p className="text-xs text-[#9eb4b4]">Built for travelers, by the community.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#467568] lg:hidden">
            <ArrowLeft size={16} /> Back home
          </Link>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Welcome to the community</p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-.06em]">Welcome back.</h2>
            <p className="mt-3 text-sm leading-6 text-[#718489]">Sign in to create and join minyanim.</p>
          </div>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Password
              <span className="relative">
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 pr-12 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718489]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && <p role="alert" className="rounded-xl bg-[#f6e2dc] px-4 py-3 text-sm text-[#bd614f]">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Signing in...' : 'Log in'}
            </button>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="rounded-full border border-[#b9c7c5] bg-white px-5 py-3.5 text-sm font-semibold text-[#183f52] transition hover:border-[#183f52]"
            >
              Continue with Google
            </button>

            <p className="text-center text-sm text-[#718489]">
              Need an account?{' '}
              <Link href="/register" className="font-semibold text-[#467568]">Create one</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
