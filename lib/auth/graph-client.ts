import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'

interface GraphClientOptions {
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  tenantId?: string
}

export class GraphClient {
  private client: Client
  private accessToken?: string

  constructor(options: GraphClientOptions) {
    this.accessToken = options.accessToken

    if (options.accessToken) {
      // Use access token directly
      this.client = Client.init({
        authProvider: (done) => {
          done(null, options.accessToken!)
        }
      })
    } else if (options.clientId && options.clientSecret && options.tenantId) {
      // Use client credentials flow
      const credential = new ClientSecretCredential(
        options.tenantId,
        options.clientId,
        options.clientSecret
      )
      
      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default']
      })
      
      this.client = Client.initWithMiddleware({ authProvider })
    } else {
      throw new Error('Either accessToken or client credentials must be provided')
    }
  }

  async getUser() {
    try {
      return await this.client.api('/me').get()
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async getMessages(options: {
    filter?: string
    orderBy?: string
    top?: number
    skip?: number
  } = {}) {
    try {
      let query = this.client.api('/me/messages')
      
      if (options.filter) {
        query = query.filter(options.filter)
      }
      
      if (options.orderBy) {
        query = query.orderby(options.orderBy)
      }
      
      if (options.top) {
        query = query.top(options.top)
      }
      
      if (options.skip) {
        query = query.skip(options.skip)
      }
      
      return await query.get()
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  async getMessage(messageId: string) {
    try {
      return await this.client.api(`/me/messages/${messageId}`)
        .expand('attachments')
        .get()
    } catch (error) {
      console.error('Error fetching message:', error)
      throw error
    }
  }

  async getAttachment(messageId: string, attachmentId: string) {
    try {
      return await this.client.api(`/me/messages/${messageId}/attachments/${attachmentId}`)
        .get()
    } catch (error) {
      console.error('Error fetching attachment:', error)
      throw error
    }
  }

  async markAsRead(messageId: string) {
    try {
      return await this.client.api(`/me/messages/${messageId}`)
        .patch({ isRead: true })
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  }

  async createSubscription(notificationUrl: string) {
    try {
      const subscription = {
        changeType: 'created',
        notificationUrl,
        resource: '/me/messages',
        expirationDateTime: new Date(Date.now() + 3600000 * 24).toISOString(), // 24 hours
        clientState: 'SecretClientState'
      }
      
      return await this.client.api('/subscriptions').post(subscription)
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  async deleteSubscription(subscriptionId: string) {
    try {
      return await this.client.api(`/subscriptions/${subscriptionId}`).delete()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      throw error
    }
  }
}

export function createGraphClient(options: GraphClientOptions): GraphClient {
  return new GraphClient(options)
}