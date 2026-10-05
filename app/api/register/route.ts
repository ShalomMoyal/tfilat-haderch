import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z
  .object({
    name: z.string().trim().max(80).optional().or(z.literal('')),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
    passwordConfirmation: z.string().min(8).max(100),
  })
  .superRefine((data, ctx) => {
    if (data.name && data.name.trim().length < 2) {
      ctx.addIssue({
        code: 'too_small',
        minimum: 2,
        type: 'string',
        origin: 'string',
        inclusive: true,
        path: ['name'],
        message: 'Name must be at least 2 characters when provided.',
      })
    }

    if (data.password !== data.passwordConfirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirmation'],
        message: 'Passwords do not match.',
      })
    }
  })

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Please check your registration details.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const name = parsed.data.name?.trim() || null
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'USER',
      isActive: true,
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
