import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { prisma } from '@/lib/db/prisma'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
})

export class EmailMonitorScheduler {
  private queue: Queue

  constructor() {
    this.queue = new Queue('email-monitor', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  }

  async scheduleUserMonitoring(userId: string, accessToken: string) {
    try {
      // Add immediate job
      await this.queue.add(
        `monitor-user-${userId}`,
        { userId, accessToken },
        {
          jobId: `monitor-user-${userId}-${Date.now()}`,
        }
      )

      // Schedule recurring job every 5 minutes
      await this.queue.add(
        `monitor-user-${userId}-recurring`,
        { userId, accessToken },
        {
          jobId: `monitor-user-${userId}-recurring`,
          repeat: {
            pattern: '*/5 * * * *', // Every 5 minutes
          },
        }
      )

      console.log(`Scheduled email monitoring for user ${userId}`)
    } catch (error) {
      console.error(`Failed to schedule monitoring for user ${userId}:`, error)
      throw error
    }
  }

  async cancelUserMonitoring(userId: string) {
    try {
      // Remove recurring job
      await this.queue.removeRepeatable(
        `monitor-user-${userId}-recurring`,
        {
          pattern: '*/5 * * * *',
        }
      )

      console.log(`Cancelled email monitoring for user ${userId}`)
    } catch (error) {
      console.error(`Failed to cancel monitoring for user ${userId}:`, error)
      throw error
    }
  }

  async scheduleAllActiveUsers() {
    try {
      // Get all users with refresh tokens (active users)
      const users = await prisma.user.findMany({
        where: {
          refreshToken: { not: null }
        },
        select: {
          id: true,
          refreshToken: true
        }
      })

      console.log(`Scheduling monitoring for ${users.length} active users`)

      for (const user of users) {
        if (user.refreshToken) {
          await this.scheduleUserMonitoring(user.id, user.refreshToken)
        }
      }
    } catch (error) {
      console.error('Failed to schedule monitoring for all users:', error)
      throw error
    }
  }

  async getQueueStatus() {
    try {
      const waiting = await this.queue.getWaiting()
      const active = await this.queue.getActive()
      const completed = await this.queue.getCompleted()
      const failed = await this.queue.getFailed()

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      }
    } catch (error) {
      console.error('Failed to get queue status:', error)
      throw error
    }
  }

  async close() {
    await this.queue.close()
  }
}

export const emailScheduler = new EmailMonitorScheduler()