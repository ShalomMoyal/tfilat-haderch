import { redirect } from 'next/navigation'
import { MinyanForm } from '@/components/minyan-form'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function NewMinyanPage() {
  try {
    await requireAuth()
  } catch {
    redirect('/login?callbackUrl=%2Fdashboard%2Fminyan%2Fnew')
  }

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, cities: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
  })

  return <MinyanForm countries={countries} />
}

export const dynamic = 'force-dynamic'
