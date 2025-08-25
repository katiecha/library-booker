import cron from 'node-cron';
import { logger } from './logger.js';

export class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  scheduleBookings(scheduleConfig, bookingCallback) {
    logger.info(`Setting up booking schedule: ${scheduleConfig.cronSchedule}`);
    
    const job = cron.schedule(scheduleConfig.cronSchedule, async () => {
      try {
        logger.info('Running scheduled booking attempt...');
        
        const bookingConfigs = this.generateBookingConfigs(scheduleConfig);
        
        for (const config of bookingConfigs) {
          await this.delay(1000); // Small delay between attempts
          await bookingCallback(config);
        }
        
      } catch (error) {
        logger.error('Scheduled booking failed:', error);
      }
    });
    
    this.jobs.set('main', job);
    logger.info('Booking schedule established');
  }

  generateBookingConfigs(scheduleConfig) {
    const configs = [];
    const today = new Date();
    
    // Generate booking attempts for the next several days
    for (let i = 1; i <= scheduleConfig.daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const dayOfWeek = targetDate.getDay();
      
      // Only book on preferred days
      if (scheduleConfig.targetDays.includes(dayOfWeek)) {
        for (const timeSlot of scheduleConfig.preferredTimes) {
          configs.push({
            date: this.formatDate(targetDate),
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            purpose: 'Study session'
          });
        }
      }
    }
    
    return configs;
  }

  scheduleSpecificBooking(date, startTime, endTime, callback) {
    const bookingDate = new Date(date);
    const now = new Date();
    
    // Calculate when to attempt booking (e.g., 7 days before at 8 AM)
    const attemptDate = new Date(bookingDate);
    attemptDate.setDate(bookingDate.getDate() - 7);
    attemptDate.setHours(8, 0, 0, 0);
    
    if (attemptDate <= now) {
      logger.warn(`Booking date ${date} is too close or in the past`);
      return;
    }
    
    const cronTime = this.dateToCron(attemptDate);
    const jobId = `booking-${date}-${startTime}`;
    
    logger.info(`Scheduling booking attempt for ${date} ${startTime}-${endTime} at ${attemptDate}`);
    
    const job = cron.schedule(cronTime, async () => {
      try {
        await callback({
          date,
          startTime,
          endTime,
          purpose: 'Study session'
        });
        
        // Remove the job after execution
        this.cancelJob(jobId);
        
      } catch (error) {
        logger.error(`Scheduled booking for ${date} failed:`, error);
      }
    });
    
    this.jobs.set(jobId, job);
  }

  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.destroy();
      this.jobs.delete(jobId);
      logger.info(`Cancelled job: ${jobId}`);
    }
  }

  cancelAllJobs() {
    for (const [jobId, job] of this.jobs) {
      job.destroy();
      logger.info(`Cancelled job: ${jobId}`);
    }
    this.jobs.clear();
  }

  listJobs() {
    return Array.from(this.jobs.keys());
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  dateToCron(date) {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}