import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'mock-secret')

export interface AuthUser {
  id: string
  email: string
  name: string
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return handler(request, {
      id: user.id,
      email: user.email,
      name: user.name || '',
    })
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}