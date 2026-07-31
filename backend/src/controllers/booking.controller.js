const BookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/responseHandler');

class BookingController {
  /**
   * POST /api/v1/bookings
   */
  static async create(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role_name;
      const { resourceId, eventTitle, purposeReason, startTime, endTime } = req.body;

      if (!resourceId || !eventTitle || !purposeReason || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID, Event Title, Purpose Reason, Start Time, and End Time are required.',
        });
      }

      const booking = await BookingService.createBooking({
        userId,
        userRole,
        resourceId,
        eventTitle,
        purposeReason,
        startTime,
        endTime,
      });

      return sendSuccess(res, 'Booking request processed successfully.', booking, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/my-bookings
   */
  static async getMyBookings(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      const bookings = await BookingService.getUserBookings(userId, status);
      return sendSuccess(res, 'My bookings retrieved successfully.', bookings, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/calendar
   */
  static async getCalendar(req, res, next) {
    try {
      const { resourceTypeId } = req.query;
      const events = await BookingService.getCalendarEvents(resourceTypeId);
      return sendSuccess(res, 'Calendar events retrieved successfully.', events, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/cancel
   */
  static async cancel(req, res, next) {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role_name;

      const result = await BookingService.cancelBooking(bookingId, userId, userRole);
      return sendSuccess(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BookingController;
