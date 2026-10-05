import 'next-auth'

declare module 'next-auth' {
  interface Session { user: { id: string; role: 'USER' | 'GUIDE' | 'ADMIN'; name?: string | null; email?: string | null; image?: string | null } }
  interface User { role: 'USER' | 'GUIDE' | 'ADMIN' }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'USER' | 'GUIDE' | 'ADMIN'
  }
}
