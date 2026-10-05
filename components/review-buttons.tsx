'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reviewContent } from '@/app/actions/admin'

type ReviewTarget = 'LOCATION' | 'PRODUCT'

export function ReviewButtons({ target, id }: { target: ReviewTarget; id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const submit = (status: 'ACTIVE' | 'REJECTED') => {
    startTransition(async () => {
      await reviewContent(target, id, status)
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
    </div>
  )
}
