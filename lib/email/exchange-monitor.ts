import { GraphClient } from '@/lib/auth/graph-client'
import { prisma } from '@/lib/db/prisma'
import { AlertStatus } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export interface VoicemailMessage {
  id: string
  subject: string
  from: string
  receivedDateTime: string
  hasAttachments: boolean
  attachments: Array<{
    id: string
    name: string
    contentType: string
    size: number
    contentBytes?: string
  }>
}

export interface MonitoringOptions {
  userId: string
  lastCheckTime?: Date
}

export class ExchangeMonitor {
  private graphClient: GraphClient

  constructor(accessToken: string) {
    this.graphClient = new GraphClient({ accessToken })
  }

  async monitorForVoicemails(options: MonitoringOptions): Promise<VoicemailMessage[]> {
    try {
      // Fetch recent emails without any filter - do all filtering client-side
      const messages = await this.graphClient.getMessages({
        orderBy: 'receivedDateTime desc',
        top: 100
      })

      const voicemailMessages: VoicemailMessage[] = []

      for (const message of messages.value || []) {
        // Client-side filtering for conditions we removed from server filter
        if (!this.isVoicemailMessage(message)) continue;
        if (!message.hasAttachments) continue;
        if (message.isRead) continue;
        
        // Skip time filtering - we'll check against existing alerts in the database instead
        
        // Get full message with attachments
        const fullMessage = await this.graphClient.getMessage(message.id)
        
        const voicemailMessage: VoicemailMessage = {
          id: message.id,
          subject: message.subject || 'No Subject',
          from: message.from?.emailAddress?.address || 'Unknown',
          receivedDateTime: message.receivedDateTime,
          hasAttachments: message.hasAttachments || false,
          attachments: []
        }

        // Process attachments
        if (fullMessage.attachments && fullMessage.attachments.length > 0) {
          for (const attachment of fullMessage.attachments) {
            if (this.isAudioAttachment(attachment)) {
              voicemailMessage.attachments.push({
                id: attachment.id,
                name: attachment.name || 'voicemail.wav',
                contentType: attachment.contentType || 'audio/wav',
                size: attachment.size || 0,
                contentBytes: attachment.contentBytes
              })
            }
          }
        }

        // Only include if it has audio attachments
        if (voicemailMessage.attachments.length > 0) {
          voicemailMessages.push(voicemailMessage)
        }
      }

      return voicemailMessages
    } catch (error) {
      console.error('Error monitoring for voicemails:', error)
      throw error
    }
  }

  async processVoicemailMessage(voicemailMessage: VoicemailMessage, userId: string): Promise<void> {
    try {
      // Check if we already processed this message
      const existingAlert = await prisma.alert.findUnique({
        where: { emailId: voicemailMessage.id }
      })

      if (existingAlert) {
        console.log(`Alert already exists for message ${voicemailMessage.id}`)
        return
      }

      // Download and save voicemail attachment
      let voicemailUrl: string | null = null
      
      if (voicemailMessage.attachments.length > 0) {
        const attachment = voicemailMessage.attachments[0] // Use first audio attachment
        voicemailUrl = await this.downloadAttachment(voicemailMessage.id, attachment)
      }

      // Create alert in database
      const alert = await prisma.alert.create({
        data: {
          userId,
          emailId: voicemailMessage.id,
          subject: voicemailMessage.subject,
          from: voicemailMessage.from,
          voicemailUrl,
          receivedAt: new Date(voicemailMessage.receivedDateTime),
          status: AlertStatus.PENDING
        }
      })

      // Create alert log
      await prisma.alertLog.create({
        data: {
          alertId: alert.id,
          action: 'CREATED',
          details: `Alert created for voicemail from ${voicemailMessage.from}`
        }
      })

      // Mark email as read
      await this.graphClient.markAsRead(voicemailMessage.id)

      console.log(`Created alert ${alert.id} for voicemail message ${voicemailMessage.id}`)
    } catch (error) {
      console.error('Error processing voicemail message:', error)
      throw error
    }
  }

  private isVoicemailMessage(message: any): boolean {
    const subject = message.subject || ''
    
    // Check for the specific pattern "Voice mail from"
    return subject.startsWith('Voice mail from')
  }

  private isAudioAttachment(attachment: any): boolean {
    const contentType = attachment.contentType || ''
    const name = (attachment.name || '').toLowerCase()
    
    const audioTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/m4a',
      'audio/aac',
      'audio/ogg'
    ]

    const audioExtensions = ['.wav', '.mp3', '.m4a', '.aac', '.ogg']
    
    return audioTypes.includes(contentType) || 
           audioExtensions.some(ext => name.endsWith(ext))
  }

  private async downloadAttachment(messageId: string, attachment: any): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'voicemails')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const timestamp = new Date().getTime()
      const extension = path.extname(attachment.name || '.wav')
      const filename = `voicemail_${timestamp}_${messageId}${extension}`
      const filepath = path.join(uploadsDir, filename)

      // Get attachment content
      let contentBytes = attachment.contentBytes
      
      if (!contentBytes) {
        // If not included in the message, fetch it separately
        const attachmentData = await this.graphClient.getAttachment(messageId, attachment.id)
        contentBytes = attachmentData.contentBytes
      }

      // Save to file
      if (contentBytes) {
        const buffer = Buffer.from(contentBytes, 'base64')
        fs.writeFileSync(filepath, buffer)
      }

      // Return relative path for database storage
      return `/uploads/voicemails/${filename}`
    } catch (error) {
      console.error('Error downloading attachment:', error)
      throw error
    }
  }

  async createWebhookSubscription(notificationUrl: string): Promise<any> {
    try {
      return await this.graphClient.createSubscription(notificationUrl)
    } catch (error) {
      console.error('Error creating webhook subscription:', error)
      throw error
    }
  }

  async deleteWebhookSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.graphClient.deleteSubscription(subscriptionId)
    } catch (error) {
      console.error('Error deleting webhook subscription:', error)
      throw error
    }
  }
}

export function createExchangeMonitor(accessToken: string): ExchangeMonitor {
  return new ExchangeMonitor(accessToken)
}