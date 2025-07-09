import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Delete all related data for this user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete in order due to foreign key constraints
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id }
    });

    await prisma.alertLog.deleteMany({
      where: {
        alert: {
          userId: user.id
        }
      }
    });

    await prisma.alert.deleteMany({
      where: { userId: user.id }
    });

    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    await prisma.account.deleteMany({
      where: { userId: user.id }
    });

    await prisma.authenticator.deleteMany({
      where: { userId: user.id }
    });

    await prisma.user.delete({
      where: { id: user.id }
    });

    return NextResponse.json({ 
      message: 'User data completely reset. Please sign in again.',
      email: userEmail
    });
  } catch (error) {
    console.error('Error resetting user:', error);
    return NextResponse.json(
      { error: 'Failed to reset user data' },
      { status: 500 }
    );
  }
}