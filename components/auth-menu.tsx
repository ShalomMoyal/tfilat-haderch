'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function AuthMenu({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className={compact ? 'text-xs text-[#83939a]' : 'text-sm text-[#5e737e]'}>
        Loading...
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className={compact ? 'rounded-full border border-[#b9c7c5] px-3 py-1.5 text-xs font-semibold text-[#183f52]' : 'rounded-full border border-[#b9c7c5] px-4 py-2 text-[13px] font-semibold text-[#183f52] transition hover:border-[#183f52] hover:bg-white'}
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className={compact ? 'rounded-full bg-[#183f52] px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-full bg-[#183f52] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#28566b]'}
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className={compact ? 'rounded-full border border-[#b9c7c5] px-3 py-1.5 text-xs font-semibold text-[#183f52]' : 'rounded-full border border-[#b9c7c5] px-5 py-2.5 text-[13px] font-semibold text-[#183f52] transition hover:border-[#183f52] hover:bg-white'}
    >
      Log in
    </Link>
  )
}
