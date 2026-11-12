import { prisma } from '@/lib/prisma'

export async function getKosherProductLocationOptions() {
  return prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      cities: { orderBy: { name: 'asc' }, select: { id: true, name: true } },
    },
  })
}
