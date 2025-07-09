# CLAUDE.md - OnCall Alert Manager

## Project Overview

OnCall Alert Manager is a Progressive Web App (PWA) that ensures on-call network engineers never miss critical helpdesk voicemails by providing persistent, acknowledgment-required alerts.

### Problem Statement
- On-call engineers receive voicemail notifications via email that are easy to miss
- Standard email notifications don't reliably wake up sleeping engineers
- No persistent alerting mechanism until acknowledgment
- Risk of missing critical infrastructure issues during off-hours

### Solution
A PWA that monitors Exchange email for voicemail notifications and sends persistent alerts with custom sounds that repeat until acknowledged.

## Target Users
- Primary: On-call network engineers
- Secondary: IT team members who rotate on-call duties

## Core Features

### MVP Features
1. **Exchange Email Integration**
   - OAuth authentication with work email
   - Monitor inbox for voicemail emails
   - Download and store voicemail attachments

2. **Persistent Alert System**
   - Push notifications that repeat every 30 seconds
   - Custom alert sounds with upload capability
   - Vibration patterns for urgency
   - Alerts continue until acknowledged

3. **Alert Dashboard**
   - View pending and acknowledged alerts
   - Listen to voicemail attachments
   - Alert history and response metrics

4. **User Settings**
   - Select/upload custom alert sounds
   - Configure alert preferences
   - Test alert functionality

## Technical Architecture

### Tech Stack
```yaml
Frontend:
  - Next.js 15.3.5 (App Router)
  - React 19.1.0
  - TypeScript
  - Tailwind CSS 3.4.17 (minimal dark theme)
  - React Query (TanStack Query 5.81.5)
  - PWA with Service Workers

Backend:
  - Next.js API Routes
  - PostgreSQL (local database)
  - Prisma ORM 5.22.0
  - Microsoft Graph API
  - BullMQ (job queue)
  - Redis (queue backend)

Authentication:
  - Auth0 Universal Login (Primary)
  - Azure AD OAuth 2.0 (For Microsoft Graph API access)
  - Automatic user sync between Auth0 and database

Deployment:
  - Self-hosted or Docker
  - PM2 for process management
  - HTTPS required for PWA
  - Docker Compose for development
```

### Design System
```css
Primary Color: #DC2626 (Red-600 for urgency)
Secondary Color: #10B981 (Green-500 for acknowledged)
Background: #000000 (Pure black for OLED)
Text: #FFFFFF (High contrast)
Font: Inter
Border Radius: 8px
Style: Minimal, dark, high-contrast
```

## Project Structure
```
/oncall-alert-manager
├── /app
│   ├── /api
│   │   ├── /auth
│   │   │   ├── signin/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── signout/route.ts
│   │   ├── /alerts
│   │   │   ├── route.ts
│   │   │   └── [id]/acknowledge/route.ts
│   │   ├── /email-monitor
│   │   │   └── route.ts
│   │   ├── /sounds
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── /push/route.ts
│   ├── /dashboard/page.tsx
│   ├── /settings/page.tsx
│   ├── /login/page.tsx
│   └── layout.tsx
├── /components
│   ├── /ui
│   │   ├── AlertCard.tsx
│   │   ├── AcknowledgeButton.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── TimeDisplay.tsx
│   │   └── SoundSelector.tsx
│   └── /features
│       ├── AlertList.tsx
│       ├── SoundUploader.tsx
│       ├── ExchangeStatus.tsx
│       └── VoicemailPlayer.tsx
├── /lib
│   ├── /auth
│   │   ├── msal-config.ts
│   │   └── graph-client.ts
│   ├── /db
│   │   └── prisma.ts
│   ├── /email
│   │   └── exchange-monitor.ts
│   ├── /alerts
│   │   └── alert-service.ts
│   └── /sounds
│       └── sound-manager.ts
├── /prisma
│   ├── schema.prisma
│   ├── seed.ts
│   └── /migrations
├── /public
│   ├── /sounds
│   ├── manifest.json
│   └── service-worker.js
├── /uploads
│   ├── /sounds
│   └── /voicemails
├── /workers
│   └── email-monitor.worker.ts
└── /instructions
    ├── cursor-rules.md
    └── common-mistakes.md
```

## Database Schema (Prisma)

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  azureId           String    @unique
  refreshToken      String?   @db.Text
  alertSoundId      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  alerts            Alert[]
  alertSound        Sound?    @relation(fields: [alertSoundId], references: [id])
  uploadedSounds    Sound[]   @relation("UploadedSounds")
  pushSubscriptions PushSubscription[]
}

model Alert {
  id              String    @id @default(cuid())
  userId          String
  emailId         String    @unique
  subject         String
  from            String
  voicemailUrl    String?
  receivedAt      DateTime
  acknowledgedAt  DateTime?
  status          AlertStatus @default(PENDING)
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  logs            AlertLog[]
}

model Sound {
  id          String    @id @default(cuid())
  name        String
  filename    String
  path        String
  isDefault   Boolean   @default(false)
  uploadedBy  String?
  createdAt   DateTime  @default(now())
  
  uploader    User?     @relation("UploadedSounds", fields: [uploadedBy], references: [id])
  users       User[]
}

model PushSubscription {
  id         String   @id @default(cuid())
  userId     String
  endpoint   String   @unique
  p256dh     String
  auth       String
  createdAt  DateTime @default(now())
  
  user       User     @relation(fields: [userId], references: [id])
}

enum AlertStatus {
  PENDING
  ACKNOWLEDGED
  EXPIRED
}
```

## Key Implementation Details

### Exchange Email Monitoring
- Uses Microsoft Graph API to access Exchange mailbox
- Polls for new emails every 60 seconds
- Filters for voicemail pattern: subject contains "Voicemail" + has attachments
- Downloads audio attachments (.wav, .mp3, .m4a)
- Marks processed emails as read

### Alert Flow
1. Email detected → Create alert in database
2. Trigger push notification via service worker
3. Play custom sound and vibrate
4. Repeat notification every 30 seconds
5. Continue until user acknowledges
6. Log acknowledgment time and user

### PWA Service Worker
- Handles push notifications
- Manages persistent alert repetition
- Plays custom alert sounds
- Works offline with queued actions
- Supports notification actions (Acknowledge, Snooze)

### Security Considerations
- OAuth tokens stored securely
- Refresh token rotation
- Email credentials never exposed to frontend
- All API routes require authentication
- Rate limiting on public endpoints
- Voicemail files access-controlled

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/oncall_alerts"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Auth0 Configuration
AUTH0_DOMAIN="your-auth0-domain.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"
AUTH0_SECRET="your-32-character-secret"
APP_BASE_URL="http://localhost:3000"

# Azure AD (for Microsoft Graph API access)
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_TENANT_ID="your-tenant-id"

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="generate-with-web-push"
VAPID_PRIVATE_KEY="generate-with-web-push"
VAPID_EMAIL="mailto:your-email@company.com"
```

## Development Guidelines

### Component Patterns
- Use functional components with TypeScript
- Server components by default
- Client components only when needed
- Minimal dark theme throughout
- High contrast for night visibility

### State Management
- Server state: React Query with 30s refresh
- UI state: React useState/useReducer
- Real-time: WebSocket subscriptions
- Offline: Service worker queue

### Error Handling
- Graceful degradation for offline
- Exponential backoff for retries
- User-friendly error messages
- Comprehensive logging

### Performance
- Lazy load non-critical components
- Virtualize long alert lists
- Optimize service worker caching
- Minimize bundle size

## Testing Strategy

### Unit Tests
- Alert service logic
- Email parsing
- Sound management
- Authentication flow

### Integration Tests
- Exchange connectivity
- Push notification delivery
- Database operations
- API endpoints

### E2E Tests
- Complete alert flow
- Acknowledgment process
- Sound upload/selection
- Offline functionality

### Manual Testing
- Test on real phones (iOS/Android)
- Various network conditions
- Screen locked/unlocked
- Do Not Disturb modes

## Deployment Checklist

1. **Prerequisites**
   - [ ] PostgreSQL database
   - [ ] Redis server
   - [ ] HTTPS certificate
   - [ ] Azure AD app registration

2. **Environment Setup**
   - [ ] Configure all environment variables
   - [ ] Run database migrations
   - [ ] Seed default sounds
   - [ ] Create upload directories

3. **Build & Deploy**
   - [ ] Build Next.js production bundle
   - [ ] Configure PM2 processes
   - [ ] Set up reverse proxy (nginx)
   - [ ] Enable HTTPS

4. **Post-Deployment**
   - [ ] Test push notifications
   - [ ] Verify Exchange connectivity
   - [ ] Check alert delivery
   - [ ] Monitor logs

## Success Metrics
- Zero missed critical voicemails
- Average acknowledgment time < 2 minutes
- 100% alert delivery rate
- System uptime > 99.9%

## Future Enhancements
- SMS fallback for critical alerts
- Integration with on-call scheduling
- Team escalation chains
- Alert analytics dashboard
- Mobile native apps
- Voice transcription of voicemails

## Common Issues & Solutions

### Notifications Not Working
- Check HTTPS is enabled
- Verify notification permissions
- Test service worker registration
- Check VAPID keys configuration

### Exchange Connection Fails
- Verify Azure AD permissions
- Check token expiration
- Ensure Graph API access
- Review firewall rules

### Alerts Not Repeating
- Check service worker is active
- Verify setTimeout not cleared
- Check browser background policies
- Test with screen locked

### Azure AD Authentication Issues

#### PKCE Error (AADSTS9002325)
**Error:** `AADSTS9002325: Proof Key for Code Exchange is required for cross-origin authorization code redemption`
**Solution:** The codebase now includes proper PKCE implementation with:
- Code verifier generation in signin route
- Code challenge sent to Azure AD
- Code verifier stored in cookie for callback
- Proper token exchange with PKCE verifier

#### Public Client Error (AADSTS700025) - CURRENT ISSUE
**Error:** `AADSTS700025: Client is public so neither 'client_assertion' nor 'client_secret' should be presented`
**Root Cause:** Azure AD app registration is configured as a public client instead of confidential client
**Symptoms:** Authentication redirects to `/login?error=callback_error`

**Fix Required in Azure Portal:**
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Select your app registration
3. Go to **Authentication** section
4. Under **Advanced settings**:
   - Set **Allow public client flows** to **No**
   - Ensure **Supported account types** is set to single tenant
5. Go to **Certificates & secrets** section
6. Ensure you have a valid **Client secret** 
7. Save changes

**Alternative Solution:** Modify the code to use PublicClientApplication instead of ConfidentialClientApplication if you want to keep it as public client, but this is not recommended for server-side applications.

**Current Status:** 
- ✅ PKCE implementation completed
- ✅ Microsoft Graph API client ready
- ✅ Email monitoring system implemented
- ❌ Azure AD app registration needs to be configured as confidential client
- ❌ Authentication flow blocked until Azure AD configuration is fixed

**Next Steps:**
1. Fix Azure AD app registration (public → confidential)
2. Test complete authentication flow
3. Verify Exchange email monitoring works
4. Implement Settings page and sound management

## Development Commands

### Local Development with Docker
```bash
# Start all services (PostgreSQL, Redis, Next.js)
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Rebuild after dependency changes
docker compose build app && docker compose up -d
```

### Local Development without Docker
```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed default data
npm run db:seed

# Run development
npm run dev

# Run worker (separate terminal)
npm run worker

# Build for production
npm run build

# Start production
npm start
```

### Database Commands
```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## Additional Resources
- [Microsoft Graph API Docs](https://docs.microsoft.com/en-us/graph/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Prisma Documentation](https://www.prisma.io/docs)