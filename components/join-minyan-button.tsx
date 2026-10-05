'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinMinyan, leaveMinyan } from '@/app/actions/minyan'

export default function JoinMinyanButton({ minyanId, initialJoined = false }: { minyanId: string; initialJoined?: boolean }) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function toggle() {
    setPending(true)
    setMessage('')
    try {
      const result = joined ? await leaveMinyan(minyanId) : await joinMinyan(minyanId)
      if ('error' in result && result.error) {
        setMessage(result.error)
        return
      }
      setJoined(!joined)
      router.refresh()
    } catch {
      setMessage('Could not update your participation. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={toggle} disabled={pending} className="w-full rounded-full bg-[#183f52] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28566b] disabled:cursor-wait disabled:opacity-60">
        {pending ? 'Updating...' : joined ? 'Leave this minyan' : 'Join this minyan'}
      </button>
      {message && <p role="alert" className="text-center text-sm text-[#bd614f]">{message}</p>}
    </div>
  )
}
