# OnCall Alert Manager

A Progressive Web App (PWA) that ensures on-call network engineers never miss critical helpdesk voicemails by providing persistent, acknowledgment-required alerts.

## 🚨 Problem

On-call engineers often miss critical infrastructure alerts because:
- Voicemail notifications via email are easy to overlook
- Standard email notifications don't reliably wake sleeping engineers
- No persistent alerting mechanism until acknowledgment
- Risk of missing critical issues during off-hours

## ✅ Solution

OnCall Alert Manager monitors your Exchange email for voicemail notifications and sends persistent alerts with custom sounds that repeat until acknowledged.

## 🎯 Features

### Core Functionality
- **Exchange Email Integration** - OAuth authentication with work email, monitors inbox for voicemail emails
- **Persistent Alerts** - Push notifications that repeat every 30 seconds until acknowledged
- **Custom Alert Sounds** - Upload and select custom alert sounds with vibration patterns
- **Alert Dashboard** - View pending/acknowledged alerts, listen to voicemails, track response times
- **PWA Support** - Works offline, installable on mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.5, React 19.1.0, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM
- **Authentication**: Auth0 + Azure AD OAuth 2.0
- **Queue**: BullMQ with Redis
- **APIs**: Microsoft Graph API for Exchange access

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Azure AD app registration for Exchange access
- Auth0 account
- HTTPS certificate (required for PWA)

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/oncall-alert-manager.git
cd oncall-alert-manager

# Copy environment variables
cp .env.example .env

# Configure .env with your credentials

# Start all services
docker compose up -d

# Run database migrations
docker compose exec app npm run db:migrate

# Seed default data
docker compose exec app npm run db:seed
```

Access the app at `http://localhost:3000`

### Manual Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed default data
npm run db:seed

# Run development server
npm run dev

# In another terminal, run the email monitoring worker
npm run worker
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/oncall_alerts"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Auth0
AUTH0_DOMAIN="your-domain.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
AUTH0_SECRET="32-character-secret"
APP_BASE_URL="http://localhost:3000"

# Azure AD (for Microsoft Graph API)
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_TENANT_ID="your-tenant-id"

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="generate-with-web-push"
VAPID_PRIVATE_KEY="generate-with-web-push"
VAPID_EMAIL="mailto:your-email@company.com"
```

### Azure AD Setup

1. Register an application in Azure Portal
2. Configure as **Confidential Client** (not public)
3. Add Microsoft Graph API permissions:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `offline_access`
4. Add redirect URI: `http://localhost:3000/api/auth/callback`
5. Generate and save client secret

### Auth0 Setup

1. Create a new application (Regular Web Application)
2. Configure allowed callback URLs: `http://localhost:3000/api/auth/callback`
3. Configure allowed logout URLs: `http://localhost:3000`
4. Enable Universal Login

## 📱 PWA Installation

### Desktop
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the prompts

### Mobile
1. Open the app in Chrome (Android) or Safari (iOS)
2. Tap "Add to Home Screen"
3. Follow the prompts

## 🧪 Testing

```bash
# Run tests
npm test

# Test alert functionality
npm run test:alerts

# Test push notifications
npm run test:push
```

## 🏗️ Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Core business logic
├── prisma/          # Database schema and migrations
├── public/          # Static assets and PWA files
├── workers/         # Background job workers
└── uploads/         # User uploaded files
```

## 🚦 Deployment

### Production Checklist

- [ ] Configure production environment variables
- [ ] Set up SSL certificate
- [ ] Configure reverse proxy (nginx)
- [ ] Set up PM2 for process management
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging

### Deploy with PM2

```bash
# Build production bundle
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor logs
pm2 logs
```

## 📊 Success Metrics

- Zero missed critical voicemails
- Average acknowledgment time < 2 minutes
- 100% alert delivery rate
- System uptime > 99.9%

## 🐛 Troubleshooting

### Notifications Not Working
- Ensure HTTPS is enabled
- Check browser notification permissions
- Verify service worker registration
- Test VAPID keys configuration

### Exchange Connection Issues
- Verify Azure AD app permissions
- Check token expiration
- Ensure Graph API access is granted
- Review firewall rules

### Authentication Errors
- Ensure Azure AD app is configured as confidential client
- Verify redirect URIs match configuration
- Check Auth0 domain and credentials

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for on-call network engineers who need reliable alerting
- Inspired by the need for better voicemail notification systems
- Thanks to all contributors and testers

## 📞 Support

For issues and feature requests, please open an issue on GitHub.