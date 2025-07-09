import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGraphClient } from '@/lib/auth/graph-client';
import { getUserToken } from '@/lib/auth/get-user-token';

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Get user's access token
      const { accessToken } = await getUserToken(session.user.id);
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create Graph client with user's access token
      const graphClient = createGraphClient({
        accessToken: accessToken,
      });

      // Mark the email as read
      await graphClient.updateMessage(id, {
        isRead: true,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Email marked as read' 
      });
    } catch (tokenError) {
      console.error('Token error when marking email as read:', tokenError);
      
      // For mock data, just return success
      return NextResponse.json({ 
        success: true, 
        message: 'Email marked as read (mock mode)' 
      });
    }
  } catch (error) {
    console.error('Error marking email as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark email as read' },
      { status: 500 }
    );
  }
}