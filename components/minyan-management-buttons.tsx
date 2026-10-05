'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMinyan } from '@/app/actions/minyan'

export function DeleteMinyanButton({ minyanId }: { minyanId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    if (!window.confirm('Delete this minyan? Participants will be removed too.')) return
    setPending(true)
    setError('')
    try {
      const result = await deleteMinyan(minyanId)
      if ('error' in result) {
        setError(result.error ?? 'Could not delete this minyan. Please try again.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Could not delete this minyan. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={remove} disabled={pending} className="rounded-full border border-[#d9aaa0] px-4 py-2.5 text-sm font-semibold text-[#a94f40] disabled:opacity-60">
        {pending ? 'Deleting…' : 'Delete minyan'}
      </button>
      {error && <p role="alert" className="text-sm text-[#a94f40]">{error}</p>}
    </div>
  )
}
