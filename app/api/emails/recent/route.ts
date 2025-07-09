import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGraphClient } from '@/lib/auth/graph-client';
import { getUserToken } from '@/lib/auth/get-user-token';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // First try to get user's access token
      const { accessToken } = await getUserToken(session.user.id);
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create Graph client with user's access token
      const graphClient = createGraphClient({
        accessToken: accessToken,
      });

      // Fetch the last 3 emails from the user's inbox
      const response = await graphClient.getMessages({
        top: 3,
        orderBy: 'receivedDateTime desc',
      });

      const emails = response.value.map((email: any) => ({
        id: email.id,
        subject: email.subject || '(No subject)',
        from: email.from?.emailAddress?.address || 'unknown@email.com',
        fromName: email.from?.emailAddress?.name || 'Unknown Sender',
        preview: email.bodyPreview || '',
        receivedAt: email.receivedDateTime,
        isRead: email.isRead || false,
      }));

      return NextResponse.json({ emails });
    } catch (tokenError) {
      console.error('Token error:', tokenError);
      
      // Try alternative approach: Use application permissions if configured
      // This would require Mail.Read application permission in Azure AD
      try {
        const graphClient = createGraphClient({
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          tenantId: process.env.AZURE_TENANT_ID!,
        });

        // Note: This approach requires the app to have Mail.Read application permission
        // and would need to specify the user's email in the API path
        console.log('Attempting app-only access (requires Mail.Read application permission)');
        
        // For now, continue with mock data
        throw new Error('Application permissions not configured');
      } catch (appError) {
        // Continue with mock data
      }
      
      // If token issues, return mock data with a warning
      const mockEmails = [
        {
          id: '1',
          subject: '⚠️ Email Access Error - Using Mock Data',
          from: 'system@notifyit.com',
          fromName: 'System',
          preview: `Unable to fetch real emails: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}. Please re-authenticate to enable email access.`,
          receivedAt: new Date().toISOString(),
          isRead: false,
        },
        {
          id: '2',
          subject: 'Mock: Voicemail from Help Desk',
          from: 'helpdesk@company.com',
          fromName: 'IT Help Desk',
          preview: 'This is sample data. Real emails will appear once authentication is working.',
          receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isRead: true,
        },
        {
          id: '3',
          subject: 'Mock: System Alert',
          from: 'system@company.com',
          fromName: 'System Notifications',
          preview: 'This is sample data. Real emails will appear once authentication is working.',
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          isRead: true,
        },
      ];

      return NextResponse.json({ emails: mockEmails });
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}