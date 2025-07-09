import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build the authorization URL with specific parameters to get refresh token
    const authUrl = new URL(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize`);
    
    authUrl.searchParams.set('client_id', process.env.AZURE_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/callback/microsoft-entra-id`);
    authUrl.searchParams.set('scope', 'openid profile email offline_access Mail.Read');
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent'); // Force consent
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    
    // Add a state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
    })).toString('base64');
    
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating re-authentication:', error);
    return NextResponse.json(
      { error: 'Failed to initiate re-authentication' },
      { status: 500 }
    );
  }
}