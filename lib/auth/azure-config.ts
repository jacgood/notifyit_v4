import { Configuration, LogLevel } from '@azure/msal-node'

export const azureConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
  cache: {},
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            break
          case LogLevel.Info:
            console.info(message)
            break
          case LogLevel.Verbose:
            console.debug(message)
            break
          case LogLevel.Warning:
            console.warn(message)
            break
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info,
    },
  },
}

export const scopes = [
  'offline_access', // Put this first to ensure it's prioritized
  'openid',
  'profile',
  'email',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/User.Read'
]

export const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/callback/microsoft-entra-id'