import { prisma } from '@/lib/db/prisma'

export interface MockUser {
  id: string
  email: string
  name: string
  azureId: string
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'dev@example.com',
    name: 'Development User',
    azureId: 'dev-azure-id',
  },
  {
    id: '2',
    email: 'engineer@example.com',
    name: 'Network Engineer',
    azureId: 'engineer-azure-id',
  },
]

export async function getMockUser(email: string): Promise<MockUser | null> {
  return mockUsers.find(user => user.email === email) || null
}

export async function createOrUpdateMockUser(mockUser: MockUser) {
  const defaultSound = await prisma.sound.findFirst({ where: { isDefault: true } })
  
  const existingUser = await prisma.user.findUnique({
    where: { email: mockUser.email },
  })
  
  if (existingUser) {
    return existingUser
  }
  
  return await prisma.user.create({
    data: {
      email: mockUser.email,
      name: mockUser.name,
      azureId: mockUser.azureId,
      alertSoundId: defaultSound?.id,
    },
  })
}