const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureCountryCity(countryCode, countryName, cities) {
  const country = await prisma.country.upsert({
    where: { code: countryCode },
    update: { name: countryName },
    create: { code: countryCode, name: countryName },
  })

  for (const cityName of cities) {
    await prisma.city.upsert({
      where: {
        countryId_name: {
          countryId: country.id,
          name: cityName,
        },
      },
      update: {},
      create: {
        countryId: country.id,
        name: cityName,
      },
    })
  }

  return country
}

async function main() {
  const israel = await ensureCountryCity('IL', 'Israel', ['Jerusalem', 'Tel Aviv', 'Haifa'])
  await ensureCountryCity('US', 'United States', ['New York', 'Chicago', 'Los Angeles'])

  const adminEmail = 'admin@tefilat.co'
  const passwordHash = await bcrypt.hash('Password123!', 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Site Admin',
      role: 'ADMIN',
      isActive: true,
      passwordHash,
    },
    create: {
      email: adminEmail,
      name: 'Site Admin',
      role: 'ADMIN',
      isActive: true,
      passwordHash,
    },
  })

  const sampleUserEmail = 'member@tefilat.co'
  await prisma.user.upsert({
    where: { email: sampleUserEmail },
    update: {},
    create: {
      email: sampleUserEmail,
      name: 'Community Member',
      role: 'USER',
      isActive: true,
      passwordHash: await bcrypt.hash('Password123!', 10),
    },
  })

  const jerusalem = await prisma.city.findFirst({
    where: { countryId: israel.id, name: 'Jerusalem' },
  })

  if (jerusalem) {
    await prisma.minyan.upsert({
      where: {
        id: 'seed-minyan-jerusalem',
      },
      update: {},
      create: {
        id: 'seed-minyan-jerusalem',
        title: 'Morning Shacharit in Jerusalem',
        prayerType: 'SHACHARIT',
        type: 'ONE_TIME',
        startDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
        countryId: israel.id,
        cityId: jerusalem.id,
        address: 'Old City, Jerusalem',
        latitude: 31.7767,
        longitude: 35.2345,
        description: 'A welcoming minyan for visitors and locals.',
        contactName: 'Community Host',
        contactPhone: '+972500000000',
        status: 'ACTIVE',
        createdById: (await prisma.user.findUnique({ where: { email: sampleUserEmail } }))?.id ?? 'placeholder',
      },
    })
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
