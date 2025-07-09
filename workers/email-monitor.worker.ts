import { Worker, Job } from 'bullmq'
import { createExchangeMonitor } from '@/lib/email/exchange-monitor'
import { prisma } from '@/lib/db/prisma'
import { Redis } from 'ioredis'
import { getAccessTokenForUser } from '@/lib/auth/token-manager'

interface EmailMonitorJob {
  userId: string
}

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

export class EmailMonitorWorker {
  private worker: Worker

  constructor() {
    this.worker = new Worker(
      'email-monitor',
      this.processJob.bind(this),
      {
        connection: redis,
        concurrency: 5,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    )

    this.worker.on('completed', (job) => {
      console.log(`Email monitor job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`Email monitor job ${job?.id} failed:`, err)
    })

    this.worker.on('error', (err) => {
      console.error('Email monitor worker error:', err)
    })
  }

  private async processJob(job: Job<EmailMonitorJob>) {
    const { userId } = job.data
    
    try {
      console.log(`Processing email monitor job for user ${userId}`)

      const accessToken = await getAccessTokenForUser(userId)

      if (!accessToken) {
        throw new Error(`Could not obtain access token for user ${userId}`)
      }

      const monitor = createExchangeMonitor(accessToken)

      // Monitor for new voicemails without time filtering
      // We'll check against existing alerts in the database instead
      const voicemails = await monitor.monitorForVoicemails({
        userId
      })

      console.log(`Found ${voicemails.length} new voicemails for user ${userId}`)

      // Process each voicemail
      for (const voicemail of voicemails) {
        try {
          await monitor.processVoicemailMessage(voicemail, userId)
          console.log(`Processed voicemail ${voicemail.id} for user ${userId}`)
        } catch (error) {
          console.error(`Failed to process voicemail ${voicemail.id}:`, error)
          // Continue processing other voicemails even if one fails
        }
      }

      // Update user's last check time
      await prisma.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() }
      })

      return {
        success: true,
        processedCount: voicemails.length,
        userId
      }

    } catch (error) {
      console.error(`Email monitor job failed for user ${userId}:`, error)
      throw error
    }
  }

  async close() {
    await this.worker.close()
  }
}

// Create and start the worker
const worker = new EmailMonitorWorker()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down email monitor worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down email monitor worker...')
  await worker.close()
  process.exit(0)
})

export default worker