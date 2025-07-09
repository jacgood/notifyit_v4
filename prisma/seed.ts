import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default alert sounds
  const defaultSounds = [
    {
      name: 'Emergency Alert',
      filename: 'emergency-alert.wav',
      path: '/sounds/emergency-alert.wav',
      isDefault: true,
    },
    {
      name: 'Urgent Beep',
      filename: 'urgent-beep.wav',
      path: '/sounds/urgent-beep.wav',
      isDefault: true,
    },
    {
      name: 'Critical Alarm',
      filename: 'critical-alarm.wav',
      path: '/sounds/critical-alarm.wav',
      isDefault: true,
    },
    {
      name: 'High Priority',
      filename: 'high-priority.wav',
      path: '/sounds/high-priority.wav',
      isDefault: true,
    },
    {
      name: 'Bell Notification',
      filename: 'bell-notification-337658.mp3',
      path: '/sounds/bell-notification-337658.mp3',
      isDefault: true,
    },
  ]

  for (const sound of defaultSounds) {
    const existingSound = await prisma.sound.findFirst({
      where: { filename: sound.filename },
    })
    
    if (!existingSound) {
      await prisma.sound.create({
        data: sound,
      })
    }
  }

  console.log('Default sounds created')

  // Create sample user for development (optional)
  if (process.env.NODE_ENV === 'development') {
    const existingUser = await prisma.user.findUnique({
      where: { email: 'dev@example.com' },
    })
    
    if (!existingUser) {
      const defaultSound = await prisma.sound.findFirst({ where: { isDefault: true } })
      const sampleUser = await prisma.user.create({
        data: {
          email: 'dev@example.com',
          name: 'Development User',
          azureId: 'dev-azure-id',
          alertSoundId: defaultSound?.id,
        },
      })
      console.log('Sample user created:', sampleUser.email)
    } else {
      console.log('Sample user already exists')
    }
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })