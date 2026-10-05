import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const email = credentials.email.toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user?.passwordHash || !user.isActive || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      const email = user.email.toLowerCase()
      const existingUser = await prisma.user.findUnique({ where: { email } })

      if (account?.provider === 'credentials') {
        return Boolean(existingUser && existingUser.isActive)
      }

      if (account?.provider === 'google') {
        if (existingUser && !existingUser.isActive) return false
        return true
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: 'USER' | 'GUIDE' | 'ADMIN' }).role ?? 'USER'
        token.name = user.name ?? token.name
        token.email = user.email ?? token.email
      }

      if (!token.id && token.sub) {
        token.id = token.sub
      }

      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: String(token.email).toLowerCase() } })
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? ''
        session.user.name = session.user.name ?? token.name ?? null
        session.user.email = session.user.email ?? token.email ?? null
        session.user.role = (token.role as 'USER' | 'GUIDE' | 'ADMIN') ?? 'USER'
      }

      return session
    },
  },
  pages: { signIn: '/login' },
}
