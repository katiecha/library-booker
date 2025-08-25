import puppeteer from 'puppeteer';
import axios from 'axios';
import { logger } from '../utils/logger.js';

export class LibraryBooker {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://calendar.lib.unc.edu';
    this.browser = null;
    this.page = null;
  }

  async init() {
    logger.info('Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: this.config.headless ?? true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }

  async attemptBooking(bookingConfig) {
    try {
      if (!this.browser) {
        await this.init();
      }

      logger.info(`Attempting to book room for ${bookingConfig.date} ${bookingConfig.startTime}-${bookingConfig.endTime}`);

      // Navigate to booking page
      await this.page.goto(`${this.baseUrl}/reserve/davis-cubes`, {
        waitUntil: 'networkidle2'
      });

      // Check if room is available
      const isAvailable = await this.checkAvailability(bookingConfig);
      if (!isAvailable) {
        logger.warn('Room not available for requested time slot');
        return { success: false, reason: 'Room not available' };
      }

      // Attempt to book the room
      const bookingResult = await this.bookRoom(bookingConfig);
      
      return bookingResult;

    } catch (error) {
      logger.error('Booking attempt failed:', error);
      throw error;
    }
  }

  async checkAvailability(bookingConfig) {
    try {
      // Wait for calendar to load
      await this.page.waitForSelector('.fc-view', { timeout: 10000 });
      
      // Navigate to the correct date if needed
      await this.navigateToDate(bookingConfig.date);
      
      // Check for available time slots
      const availableSlots = await this.page.evaluate((startTime, endTime) => {
        // This will need to be customized based on the actual calendar structure
        const timeSlots = document.querySelectorAll('.fc-time-grid-event, .fc-daygrid-event');
        // Logic to check if requested time slot is available
        return timeSlots.length === 0; // Simplified - no events means available
      }, bookingConfig.startTime, bookingConfig.endTime);

      return availableSlots;

    } catch (error) {
      logger.error('Error checking availability:', error);
      return false;
    }
  }

  async bookRoom(bookingConfig) {
    try {
      // Click on the time slot to start booking process
      await this.selectTimeSlot(bookingConfig);
      
      // Fill in booking form
      await this.fillBookingForm(bookingConfig);
      
      // Submit booking
      const result = await this.submitBooking();
      
      logger.info('Booking submitted successfully');
      return { success: true, ...result };

    } catch (error) {
      logger.error('Error during booking process:', error);
      return { success: false, error: error.message };
    }
  }

  async navigateToDate(targetDate) {
    // Implementation to navigate calendar to specific date
    // This will depend on the calendar widget structure
    logger.info(`Navigating to date: ${targetDate}`);
  }

  async selectTimeSlot(bookingConfig) {
    // Implementation to click on specific time slot
    logger.info(`Selecting time slot: ${bookingConfig.startTime}-${bookingConfig.endTime}`);
  }

  async fillBookingForm(bookingConfig) {
    try {
      // Wait for booking form to appear
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      
      // Fill in email
      await this.page.type('input[type="email"]', this.config.userEmail);
      
      // Fill in any additional required fields
      if (bookingConfig.purpose) {
        const purposeField = await this.page.$('textarea, input[name*="purpose"]');
        if (purposeField) {
          await purposeField.type(bookingConfig.purpose);
        }
      }
      
      logger.info('Booking form filled');
      
    } catch (error) {
      logger.error('Error filling booking form:', error);
      throw error;
    }
  }

  async submitBooking() {
    try {
      // Find and click submit button
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], .btn-primary');
      if (!submitButton) {
        throw new Error('Submit button not found');
      }
      
      await submitButton.click();
      
      // Wait for confirmation or error message
      await this.page.waitForSelector('.alert, .success, .error', { timeout: 10000 });
      
      const result = await this.page.evaluate(() => {
        const alertElement = document.querySelector('.alert, .success, .error');
        return {
          message: alertElement?.textContent?.trim(),
          success: alertElement?.classList.contains('success') || alertElement?.classList.contains('alert-success')
        };
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error submitting booking:', error);
      throw error;
    }
  }
}