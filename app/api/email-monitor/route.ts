import { NextRequest, NextResponse } from 'next/server'
import { createExchangeMonitor } from '@/lib/email/exchange-monitor'
import { emailScheduler } from '@/lib/email/job-scheduler'
import { auth } from '@/lib/auth'
import { getAccessTokenForUser } from '@/lib/auth/token-manager'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { action } = await request.json()

    // Get access token for Microsoft Graph API
    const accessToken = await getAccessTokenForUser(user.id)

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Unable to get access token. Please sign in again with Azure AD.' 
      }, { status: 401 })
    }

    if (action === 'start') {
      // Schedule recurring monitoring
      await emailScheduler.scheduleUserMonitoring(user.id, accessToken)
      
      return NextResponse.json({
        success: true,
        message: 'Email monitoring started'
      })
    } else if (action === 'stop') {
      // Cancel recurring monitoring
      await emailScheduler.cancelUserMonitoring(user.id)
      
      return NextResponse.json({
        success: true,
        message: 'Email monitoring stopped'
      })
    } else {
      // Manual check (immediate)
      const monitor = createExchangeMonitor(accessToken)

      // Get last check time from database or use 1 hour ago
      const lastCheckTime = new Date(Date.now() - 60 * 60 * 1000)

      const voicemails = await monitor.monitorForVoicemails({
        userId: user.id,
        lastCheckTime
      })

      console.log(`Email monitor: Found ${voicemails.length} voicemails matching "Voice mail from" pattern`)
      
      // Log subjects for debugging
      voicemails.forEach((vm, index) => {
        console.log(`  ${index + 1}. Subject: "${vm.subject}" | From: ${vm.from}`)
      })

      // Process each voicemail message
      const processedCount = voicemails.length
      
      for (const voicemail of voicemails) {
        await monitor.processVoicemailMessage(voicemail, user.id)
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${processedCount} voicemail messages`,
        count: processedCount
      })
    }

  } catch (error: any) {
    console.error('Email monitor error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to monitor emails',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get monitoring status
    const alertCount = await prisma.alert.count({
      where: { userId: user.id }
    })

    const pendingAlerts = await prisma.alert.count({
      where: { 
        userId: user.id,
        status: 'PENDING'
      }
    })

    const lastAlert = await prisma.alert.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    // Get queue status
    const queueStatus = await emailScheduler.getQueueStatus()

    return NextResponse.json({
      status: 'active',
      totalAlerts: alertCount,
      pendingAlerts,
      lastAlert: lastAlert?.createdAt,
      lastCheck: new Date().toISOString(),
      queue: queueStatus
    })

  } catch (error) {
    console.error('Email monitor status error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitor status' },
      { status: 500 }
    )
  }
}