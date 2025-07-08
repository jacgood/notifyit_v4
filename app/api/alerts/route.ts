import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/auth/session';
import { webpush } from '@/lib/push/web-push';
import { AlertStatus } from '@prisma/client';

// GET /api/alerts - Get all alerts for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as AlertStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailId, subject, from, voicemailUrl, receivedAt } = body;

    // Validate required fields
    if (!emailId || !subject || !from) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if alert already exists
    const existingAlert = await prisma.alert.findUnique({
      where: { emailId },
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: 'Alert already exists', alert: existingAlert },
        { status: 409 }
      );
    }

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        emailId,
        subject,
        from,
        voicemailUrl,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        status: AlertStatus.PENDING,
      },
    });

    // Create initial log entry
    await prisma.alertLog.create({
      data: {
        alertId: alert.id,
        action: 'CREATED',
        details: `Alert created from voicemail email for user ${session.user.email}`,
      },
    });

    // Send push notifications to all user's devices
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: 'New Voicemail Alert! 🚨',
            body: `From: ${from}`,
            alertId: alert.id,
            tag: `alert-${alert.id}`,
            timestamp: Date.now(),
            requireInteraction: true,
          })
        );
      } catch (error) {
        console.error('Failed to send push notification:', error);
        // If subscription is invalid, remove it
        if ((error as any).statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    });

    await Promise.allSettled(notificationPromises);

    return NextResponse.json({
      success: true,
      alert,
      notificationsSent: subscriptions.length,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}