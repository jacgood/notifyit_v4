import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'mock-secret')

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        alertSound: true,
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      alertSound: user.alertSound,
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}