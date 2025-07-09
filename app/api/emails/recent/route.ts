import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGraphClient } from '@/lib/auth/graph-client';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement actual Microsoft Graph API integration
    // For now, return mock email data to demonstrate the feature
    const mockEmails = [
      {
        id: '1',
        subject: 'Voicemail from Help Desk - Priority Issue',
        from: 'helpdesk@company.com',
        fromName: 'IT Help Desk',
        preview: 'You have received a new voicemail regarding a critical network outage affecting Building A...',
        receivedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        isRead: false,
      },
      {
        id: '2',
        subject: 'Meeting Reminder: Infrastructure Review',
        from: 'manager@company.com',
        fromName: 'John Smith',
        preview: 'This is a reminder about tomorrow\'s infrastructure review meeting scheduled for 2:00 PM...',
        receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        isRead: true,
      },
      {
        id: '3',
        subject: 'System Alert: Backup Completed Successfully',
        from: 'system@company.com',
        fromName: 'System Notifications',
        preview: 'The nightly backup process has completed successfully. All critical systems have been backed up...',
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        isRead: true,
      },
    ];

    return NextResponse.json({ emails: mockEmails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}