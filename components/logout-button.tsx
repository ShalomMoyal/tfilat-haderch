'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="rounded-full border border-[#b9c7c5] bg-white px-4 py-2 text-[13px] font-semibold text-[#183f52] transition hover:border-[#183f52]"
    >
      Log out
    </button>
  )
}
