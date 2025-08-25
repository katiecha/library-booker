export const config = {
  booking: {
    userEmail: process.env.UNC_EMAIL,
    headless: process.env.HEADLESS !== 'false',
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  },
  
  schedule: {
    // Default booking preferences
    preferredTimes: [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '19:00' }
    ],
    
    // Days to automatically book (0 = Sunday, 1 = Monday, etc.)
    targetDays: [1, 2, 3, 4, 5], // Monday through Friday
    
    // How many days ahead to book
    daysAhead: parseInt(process.env.DAYS_AHEAD) || 7,
    
    // Cron schedule for when to attempt bookings
    cronSchedule: process.env.CRON_SCHEDULE || '0 8 * * *', // Daily at 8 AM
  },
  
  rooms: {
    // Room preferences (Davis Cubes)
    preferredRooms: [
      'Davis Collaboration Cube 1',
      'Davis Collaboration Cube 2',
      'Davis Collaboration Cube 3',
      'Davis Collaboration Cube 4'
    ],
    
    // Maximum booking duration (3 hours as per site limit)
    maxDuration: 180, // minutes
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'library-booker.log'
  }
};