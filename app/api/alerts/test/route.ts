import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

// POST /api/alerts/test - Create a test alert for development
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate a test voicemail alert
    const testAlert = {
      emailId: `test-${Date.now()}@example.com`,
      subject: 'Test Voicemail from Help Desk',
      from: 'helpdesk@company.com',
      voicemailUrl: '/sounds/test-voicemail.mp3',
      receivedAt: new Date().toISOString(),
    };

    // Forward to the main alerts endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(testAlert),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ...data,
      message: 'Test alert created successfully',
    });
  } catch (error) {
    console.error('Error creating test alert:', error);
    return NextResponse.json(
      { error: 'Failed to create test alert' },
      { status: 500 }
    );
  }
}