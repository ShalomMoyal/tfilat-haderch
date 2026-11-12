'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteKosherProduct, setKosherProductStatus } from '@/app/actions/kosher-products'

type ProductStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE' | 'EXPIRED'

export function KosherProductModeration({ id, status }: { id: string; status: ProductStatus }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function update(nextStatus: 'ACTIVE' | 'REJECTED' | 'INACTIVE') {
    setPending(true)
    setError('')
    try {
      const result = await setKosherProductStatus(id, nextStatus)
      if ('error' in result) {
        setError(result.error ?? 'Could not update status.')
        return
      }
      router.refresh()
    } catch {
      setError('Could not update status. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === 'PENDING' && <>
          <button type="button" disabled={pending} onClick={() => update('ACTIVE')} className="rounded-full bg-[#183f52] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60">Approve</button>
          <button type="button" disabled={pending} onClick={() => update('REJECTED')} className="rounded-full border border-[#d9aaa0] px-3.5 py-2 text-xs font-semibold text-[#a94f40] disabled:opacity-60">Reject</button>
        </>}
        {status === 'ACTIVE' && <button type="button" disabled={pending} onClick={() => update('INACTIVE')} className="rounded-full border border-[#b9c7c5] px-3.5 py-2 text-xs font-semibold text-[#183f52] disabled:opacity-60">Deactivate</button>}
        {(status === 'REJECTED' || status === 'INACTIVE' || status === 'EXPIRED') && <button type="button" disabled={pending} onClick={() => update('ACTIVE')} className="rounded-full bg-[#183f52] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60">Reactivate</button>}
      </div>
      {error && <p role="alert" className="text-xs text-[#a94f40]">{error}</p>}
    </div>
  )
}

export function DeleteKosherProductButton({ id, returnTo = '/dashboard' }: { id: string; returnTo?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    if (!window.confirm('Delete this product information?')) return
    setPending(true)
    setError('')
    try {
      const result = await deleteKosherProduct(id)
      if ('error' in result) {
        setError(result.error ?? 'Could not delete this product.')
        return
      }
      router.push(returnTo)
      router.refresh()
    } catch {
      setError('Could not delete this product. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={remove} disabled={pending} className="rounded-full border border-[#d9aaa0] px-4 py-2.5 text-sm font-semibold text-[#a94f40] disabled:opacity-60">
        {pending ? 'Deleting…' : 'Delete product information'}
      </button>
      {error && <p role="alert" className="text-sm text-[#a94f40]">{error}</p>}
    </div>
  )
}
