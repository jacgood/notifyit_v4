import { NextRequest, NextResponse } from 'next/server'
import { scopes } from '@/lib/auth/azure-config'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    azureConfig: {
      clientId: process.env.AZURE_CLIENT_ID,
      tenantId: process.env.AZURE_TENANT_ID,
      hasClientSecret: !!process.env.AZURE_CLIENT_SECRET,
      redirectUri: process.env.NEXTAUTH_URL + '/api/auth/callback/microsoft-entra-id',
      scopes: scopes,
      expectedScopes: {
        hasOfflineAccess: scopes.includes('offline_access'),
        hasMailRead: scopes.includes('https://graph.microsoft.com/Mail.Read'),
        hasMailReadWrite: scopes.includes('https://graph.microsoft.com/Mail.ReadWrite'),
        hasUserRead: scopes.includes('https://graph.microsoft.com/User.Read')
      }
    },
    troubleshooting: {
      message: 'Check Azure AD App Registration',
      steps: [
        '1. Go to Azure Portal > Azure AD > App registrations',
        '2. Find your app: ' + process.env.AZURE_CLIENT_ID,
        '3. Check API permissions include offline_access',
        '4. Ensure admin consent is granted',
        '5. Check Token configuration for refresh token settings'
      ]
    }
  })
}