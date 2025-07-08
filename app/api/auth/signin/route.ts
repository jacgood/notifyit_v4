import { NextRequest, NextResponse } from 'next/server'
import { getMockUser, createOrUpdateMockUser } from '@/lib/auth/mock-auth'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'mock-secret')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    const mockUser = await getMockUser(email)
    
    if (!mockUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const dbUser = await createOrUpdateMockUser(mockUser)
    
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET)
    
    const response = NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    })
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    })
    
    return response
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}