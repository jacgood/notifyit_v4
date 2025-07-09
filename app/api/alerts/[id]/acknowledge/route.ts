import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { AlertStatus } from '@prisma/client';
import { createGraphClient } from '@/lib/auth/graph-client';
import { getUserToken } from '@/lib/auth/get-user-token';

// POST /api/alerts/[id]/acknowledge - Acknowledge an alert
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the alert
    const alert = await prisma.alert.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (alert.status === AlertStatus.ACKNOWLEDGED) {
      return NextResponse.json({
        message: 'Alert already acknowledged',
        alert,
      });
    }

    // Update the alert status
    const updatedAlert = await prisma.alert.update({
      where: { id: id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
    });

    // Create log entry
    await prisma.alertLog.create({
      data: {
        alertId: alert.id,
        action: 'ACKNOWLEDGED',
        details: `Alert acknowledged by user ${session.user.email}`,
      },
    });

    // Mark the corresponding email as read
    try {
      const { accessToken } = await getUserToken(session.user.id);
      
      if (accessToken) {
        const graphClient = createGraphClient({
          accessToken: accessToken,
        });

        await graphClient.updateMessage(alert.emailId, {
          isRead: true,
        });
      }
    } catch (emailError) {
      console.error('Failed to mark email as read:', emailError);
      // Don't fail the whole request if email marking fails
    }

    // Calculate response time
    const responseTime = updatedAlert.acknowledgedAt
      ? Math.floor(
          (updatedAlert.acknowledgedAt.getTime() - updatedAlert.receivedAt.getTime()) / 1000
        )
      : null;

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      responseTimeSeconds: responseTime,
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}