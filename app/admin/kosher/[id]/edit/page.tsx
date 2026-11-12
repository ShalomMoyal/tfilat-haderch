import { notFound, redirect } from 'next/navigation'
import { KosherProductForm } from '@/components/kosher-product-form'
import { requireAdmin } from '@/lib/auth-helpers'
import { getKosherProductLocationOptions } from '@/lib/kosher-product-data'
import { prisma } from '@/lib/prisma'

export default async function AdminEditKosherProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireAdmin()
  } catch {
    redirect('/login?callbackUrl=%2Fadmin%2Fkosher')
  }

  const product = await prisma.kosherProduct.findUnique({ where: { id } })
  if (!product) notFound()
  const countries = await getKosherProductLocationOptions()
  return <KosherProductForm countries={countries} initial={product} admin />
}

export const dynamic = 'force-dynamic'
