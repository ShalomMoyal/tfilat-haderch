'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirmation: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        passwordConfirmation: form.passwordConfirmation,
      }),
    })

    const payload = await response.json().catch(() => ({ error: 'Could not create your account.' }))

    if (!response.ok) {
      setPending(false)
      setError(payload.error ?? 'Could not create your account.')
      return
    }

    const result = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setPending(false)

    if (result?.error) {
      setError('Registration succeeded but sign-in failed. Please log in manually.')
      router.push('/login')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#183f52] md:px-10">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#467568]">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="mt-8 rounded-[28px] border border-[#dfe5e0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6b9a83]">Create account</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-.05em]">Start your journey.</h1>
          <p className="mt-2 text-sm text-[#718489]">Create a secure account to connect with the community.</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Name (optional)
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10"
                placeholder="Your name"
              />
            </label>

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

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Confirm password
              <input
                required
                minLength={8}
                type={showPassword ? 'text' : 'password'}
                value={form.passwordConfirmation}
                onChange={(event) => setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))}
                className="rounded-xl border border-[#c8d4d1] bg-white px-4 py-3 font-normal outline-none focus:border-[#6b9a83] focus:ring-4 focus:ring-[#6b9a83]/10"
              />
            </label>

            {error && <p role="alert" className="rounded-xl bg-[#f6e2dc] px-4 py-3 text-sm text-[#bd614f]">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#718489]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#467568]">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
