import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'mock-secret')

export interface Session {
  user: {
    id: string
    email: string
    name: string
  }
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    })
    
    if (!user) {
      return null
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
      }
    }
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}