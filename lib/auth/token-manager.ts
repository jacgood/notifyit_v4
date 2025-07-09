import { ConfidentialClientApplication } from '@azure/msal-node'
import { azureConfig, scopes } from './azure-config'
import { prisma } from '@/lib/db/prisma'

export async function getAccessTokenForUser(userId: string): Promise<string | null> {
  try {
    console.log('Getting access token for user:', userId)
    
    // Get user's Microsoft account with refresh token
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'microsoft-entra-id',
        refresh_token: { not: null }
      },
      select: {
        refresh_token: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    console.log('Account found:', { 
      hasAccount: !!account, 
      hasRefreshToken: !!account?.refresh_token,
      email: account?.user?.email,
      refreshTokenLength: account?.refresh_token?.length 
    })

    if (!account?.refresh_token) {
      console.error('No refresh token found for user:', userId)
      return null
    }

    // Create MSAL client
    const cca = new ConfidentialClientApplication(azureConfig)

    try {
      console.log('Attempting to refresh access token...')
      
      // Try to get a new access token using the refresh token
      const tokenResponse = await cca.acquireTokenByRefreshToken({
        refreshToken: account.refresh_token,
        scopes: scopes,
        forceCache: false
      })

      console.log('Token refresh response:', {
        hasAccessToken: !!tokenResponse?.accessToken,
        accessTokenLength: tokenResponse?.accessToken?.length,
        expiresOn: tokenResponse?.expiresOn
      })

      if (tokenResponse?.accessToken) {
        // Note: MSAL doesn't typically return a new refresh token in refresh operations

        console.log('Successfully obtained access token')
        return tokenResponse.accessToken
      } else {
        console.error('No access token in response')
      }
    } catch (error: any) {
      console.error('Failed to get access token with refresh token:', error)
      
      // If refresh token is expired or invalid, we need to re-authenticate
      if (error?.errorCode === 'invalid_grant' || error?.message?.includes('AADSTS')) {
        console.error('Refresh token is invalid or expired. User needs to re-authenticate.')
        
        // Clear the invalid refresh token
        await prisma.account.updateMany({
          where: { 
            userId: userId,
            provider: 'microsoft-entra-id'
          },
          data: { refresh_token: null }
        })
      }
    }

    return null
  } catch (error) {
    console.error('Error in getAccessTokenForUser:', error)
    return null
  }
}