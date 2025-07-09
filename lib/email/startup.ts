import { emailScheduler } from './job-scheduler'

export async function initializeEmailMonitoring() {
  try {
    console.log('Initializing email monitoring...')
    
    // Schedule monitoring for all active users
    await emailScheduler.scheduleAllActiveUsers()
    
    console.log('Email monitoring initialized successfully')
  } catch (error) {
    console.error('Failed to initialize email monitoring:', error)
  }
}

// Auto-initialize if this file is run directly
if (require.main === module) {
  initializeEmailMonitoring()
}