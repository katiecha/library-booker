import dotenv from 'dotenv';
import { LibraryBooker } from './services/LibraryBooker.js';
import { Scheduler } from './utils/Scheduler.js';
import { logger } from './utils/logger.js';
import { config } from './config/config.js';

dotenv.config();

async function main() {
  try {
    logger.info('Starting Library Booking Agent...');
    
    const booker = new LibraryBooker(config.booking);
    const scheduler = new Scheduler();
    
    // Schedule booking attempts
    scheduler.scheduleBookings(config.schedule, async (bookingConfig) => {
      try {
        await booker.attemptBooking(bookingConfig);
      } catch (error) {
        logger.error('Booking attempt failed:', error);
      }
    });
    
    logger.info('Library Booking Agent started successfully');
    
  } catch (error) {
    logger.error('Failed to start Library Booking Agent:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down Library Booking Agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Library Booking Agent...');
  process.exit(0);
});

main().catch(console.error);