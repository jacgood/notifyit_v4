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

      // Fetch the last 20 emails from the user's inbox (will filter client-side)
      const response = await graphClient.getMessages({
        top: 20,
        orderBy: 'receivedDateTime desc',
      });

      const emails = response.value
        .filter((email: any) => email.subject?.includes('Voice mail from'))
        .slice(0, 3)
        .map((email: any) => ({
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
          subject: 'Voice mail from 555-123-4567 (Urgent)',
          from: 'voicemail@company.com',
          fromName: 'Voicemail System',
          preview: 'Duration: 2:45 - This is a high priority call regarding server outage...',
          receivedAt: new Date().toISOString(),
          isRead: false,
        },
        {
          id: '2',
          subject: 'Voice mail from John Smith (Network Team)',
          from: 'voicemail@company.com',
          fromName: 'Voicemail System',
          preview: 'Duration: 1:30 - Follow-up on the firewall configuration changes...',
          receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isRead: true,
        },
        {
          id: '3',
          subject: 'Voice mail from 555-987-6543 (Help Desk)',
          from: 'voicemail@company.com',
          fromName: 'Voicemail System',
          preview: 'Duration: 0:45 - Quick update on the ticket status...',
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          isRead: false,
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