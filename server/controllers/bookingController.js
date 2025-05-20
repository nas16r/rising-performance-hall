import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { format, addHours } from 'date-fns';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { userId, eventName, date, startTime, duration } = req.body;
    
    // Calculate end time
    const endTime = addHours(new Date(startTime), duration);
    
    // Check if the slot is available
    const isAvailable = await Booking.checkAvailability(date, startTime, endTime);
    
    if (!isAvailable) {
      return res.status(400).json({ message: 'The selected time slot is already booked' });
    }
    
    // Create the booking
    const booking = await Booking.create({
      userId,
      eventName,
      date,
      startTime,
      endTime,
      duration
    });
    
    // Get user details for email
    const user = await User.findById(userId);
    
    if (user) {
      // Send confirmation email
      const emailData = {
        to: user.email,
        subject: 'Booking Confirmation - Rising Performance Hall',
        text: `
          Hello ${user.name},
          
          Your booking has been confirmed!
          
          Event: ${eventName}
          Date: ${format(new Date(date), 'MMMM d, yyyy')}
          Time: ${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}
          Duration: ${duration} hour${duration > 1 ? 's' : ''}
          
          If you need to make any changes, please contact us.
          
          Thank you for choosing Rising Performance Hall!
          
          Best regards,
          The Rising Performance Hall Team
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5927e3;">Booking Confirmation</h2>
            <p>Hello ${user.name},</p>
            <p>Your booking has been confirmed!</p>
            
            <div style="background-color: #f7f5ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${eventName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${format(new Date(date), 'MMMM d, yyyy')}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} hour${duration > 1 ? 's' : ''}</p>
            </div>
            
            <p>If you need to make any changes, please contact us.</p>
            <p>Thank you for choosing Rising Performance Hall!</p>
            
            <p>Best regards,<br>The Rising Performance Hall Team</p>
          </div>
        `
      };
      
      try {
        await sendEmail(emailData);
      } catch (error) {
        console.log('Email could not be sent', error);
        // Continue even if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error during booking creation',
      error: error.message
    });
  }
};

// Get all bookings for a user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({ date: 1, startTime: 1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
};

// Get all booked time slots (for calendar availability)
export const getBookedSlots = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $ne: 'cancelled' } }).select('date startTime endTime');
    
    const bookedSlots = bookings.map(booking => ({
      date: format(new Date(booking.date), 'yyyy-MM-dd'),
      startTime: format(new Date(booking.startTime), 'HH:mm'),
      endTime: format(new Date(booking.endTime), 'HH:mm')
    }));
    
    res.status(200).json(bookedSlots);
  } catch (error) {
    res.status(500).json({
      message: 'Server error while fetching booked slots',
      error: error.message
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error while cancelling booking',
      error: error.message
    });
  }
};