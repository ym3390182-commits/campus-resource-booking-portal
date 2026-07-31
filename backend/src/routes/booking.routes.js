const express = require('express');
const BookingController = require('../controllers/booking.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

const router = express.Router();

// All booking routes require authenticated user
router.use(authenticateJWT);

router.post('/', BookingController.create);
router.get('/my-bookings', BookingController.getMyBookings);
router.get('/calendar', BookingController.getCalendar);
router.patch('/:id/cancel', BookingController.cancel);

module.exports = router;
