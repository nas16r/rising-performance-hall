import express from 'express';
import { 
  createBooking, 
  getUserBookings, 
  getBookedSlots,
  cancelBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All booking routes are protected
router.use(protect);

router.post('/', createBooking);
router.get('/', getUserBookings);
router.get('/slots', getBookedSlots);
router.patch('/:id/cancel', cancelBooking);

export default router;