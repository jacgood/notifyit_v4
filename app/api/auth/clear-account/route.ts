import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the Microsoft account to force re-authentication
    const deleted = await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'microsoft-entra-id',
      },
    });

    return NextResponse.json({ 
      message: 'Account cleared. Please sign out and sign in again.',
      deletedCount: deleted.count 
    });
  } catch (error) {
    console.error('Error clearing account:', error);
    return NextResponse.json(
      { error: 'Failed to clear account' },
      { status: 500 }
    );
  }
}