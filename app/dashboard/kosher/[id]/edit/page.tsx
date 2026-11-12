import { notFound, redirect } from 'next/navigation'
import { KosherProductForm } from '@/components/kosher-product-form'
import { requireAuth } from '@/lib/auth-helpers'
import { getKosherProductLocationOptions } from '@/lib/kosher-product-data'
import { prisma } from '@/lib/prisma'

export default async function EditKosherProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let session: Awaited<ReturnType<typeof requireAuth>>
  try {
    session = await requireAuth()
  } catch {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/kosher/${id}/edit`)}`)
  }

  const product = await prisma.kosherProduct.findUnique({ where: { id } })
  if (!product) notFound()
  if (session.user.id !== product.createdById && session.user.role !== 'ADMIN') redirect('/dashboard')

  const countries = await getKosherProductLocationOptions()
  return <KosherProductForm countries={countries} initial={product} admin={session.user.role === 'ADMIN'} />
}

export const dynamic = 'force-dynamic'
