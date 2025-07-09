import { prisma } from '@/lib/db/prisma';

async function refreshAccessToken(refreshToken: string, userId: string) {
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'openid profile email offline_access Mail.Read',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();
    
    // Update the stored tokens
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'microsoft-entra-id',
          providerAccountId: userId,
        },
      },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      },
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token. Please re-authenticate.');
  }
}

export async function getUserToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'microsoft-entra-id',
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      providerAccountId: true,
    },
  });

  if (!account) {
    throw new Error('No Microsoft account found for user');
  }

  // Check if token is expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) {
      throw new Error('Access token expired and no refresh token available. Please re-authenticate at /settings/reauth');
    }
    
    // Token is expired, refresh it
    console.log('Access token expired, refreshing...');
    return await refreshAccessToken(account.refresh_token, userId);
  }

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at,
  };
}