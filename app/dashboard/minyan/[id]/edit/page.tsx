import { notFound, redirect } from 'next/navigation'
import { MinyanForm } from '@/components/minyan-form'
import { requireOwnerOrAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function EditMinyanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const minyan = await prisma.minyan.findUnique({ where: { id } })
  if (!minyan) notFound()

  try {
    await requireOwnerOrAdmin(minyan.createdById)
  } catch {
    redirect('/dashboard')
  }

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, cities: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
  })

  return <MinyanForm countries={countries} initial={minyan} />
}

export const dynamic = 'force-dynamic'
