import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email(), password: z.string().min(8).max(100) })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details.' }, { status: 400 })
  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Unable to create this account.' }, { status: 409 })
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash } })
  return NextResponse.json({ ok: true }, { status: 201 })
}
