import NextAuth from "next-auth"
import AzureAD from "next-auth/providers/microsoft-entra-id"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    AzureAD({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email offline_access Mail.Read",
          prompt: "consent", // Force consent to ensure we get refresh token
          access_type: "offline",
        },
      },
      token: {
        params: {
          scope: "openid profile email offline_access Mail.Read",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  debug: true,
  callbacks: {
    async signIn({ account }) {
      // Log refresh token status for debugging (can be removed in production)
      if (account?.provider === 'microsoft-entra-id') {
        console.log('Microsoft auth success:', {
          hasRefreshToken: !!account.refresh_token,
          scope: account.scope,
        });
      }
      
      // Always allow sign in (allowDangerousEmailAccountLinking handles account linking)
      return true
    },
    async session({ session, user }) {
      // Include user ID in session for database operations
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, we need to refresh it
      // But since we're using database sessions, this shouldn't be called
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
})