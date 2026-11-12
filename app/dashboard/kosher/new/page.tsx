import { redirect } from 'next/navigation'
import { KosherProductForm } from '@/components/kosher-product-form'
import { requireAuth } from '@/lib/auth-helpers'
import { getKosherProductLocationOptions } from '@/lib/kosher-product-data'

export default async function NewKosherProductPage() {
  try {
    await requireAuth()
  } catch {
    redirect('/login?callbackUrl=%2Fdashboard%2Fkosher%2Fnew')
  }
  const countries = await getKosherProductLocationOptions()
  return <KosherProductForm countries={countries} />
}

export const dynamic = 'force-dynamic'
