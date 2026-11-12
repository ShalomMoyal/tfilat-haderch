'use client'

import { useTransition } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewContent } from '@/app/actions/admin'

type ReviewTarget = 'LOCATION' | 'PRODUCT'

export function ReviewButtons({ target, id }: { target: ReviewTarget; id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const submit = (status: 'ACTIVE' | 'REJECTED') => {
    startTransition(async () => {
      setError('')
      const result = await reviewContent(target, id, status)
      if ('error' in result) {
        setError(result.error ?? 'The review could not be saved.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => submit('ACTIVE')}
        className="inline-flex items-center gap-2 rounded-full bg-[#183f52] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => submit('REJECTED')}
        className="rounded-full border border-[#dfe5e0] px-3.5 py-2 text-xs font-semibold text-[#183f52] disabled:opacity-60"
      >
        Reject
      </button>
      {error && <p role="alert" className="text-xs text-[#a94f40]">{error}</p>}
    </div>
  )
}
