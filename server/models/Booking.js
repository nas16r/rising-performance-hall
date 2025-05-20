import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventName: {
    type: String,
    required: [true, 'Please provide an event name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date for the booking']
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide an end time']
  },
  duration: {
    type: Number,
    required: [true, 'Please provide duration in hours'],
    min: [1, 'Minimum booking duration is 1 hour']
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent overlapping bookings
bookingSchema.index(
  { 
    date: 1,
    startTime: 1,
    endTime: 1,
    status: 1
  }
);

// Static method to check for booking availability
bookingSchema.statics.checkAvailability = async function(date, startTime, endTime) {
  // Convert date string to Date object if needed
  const bookingDate = typeof date === 'string' ? new Date(date) : date;
  
  // Set the date components of startTime and endTime
  const startDateTime = new Date(startTime);
  startDateTime.setFullYear(bookingDate.getFullYear());
  startDateTime.setMonth(bookingDate.getMonth());
  startDateTime.setDate(bookingDate.getDate());
  
  const endDateTime = new Date(endTime);
  endDateTime.setFullYear(bookingDate.getFullYear());
  endDateTime.setMonth(bookingDate.getMonth());
  endDateTime.setDate(bookingDate.getDate());
  
  // Find overlapping bookings
  const overlappingBookings = await this.find({
    date: {
      $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
      $lt: new Date(bookingDate.setHours(23, 59, 59, 999))
    },
    status: { $ne: 'cancelled' },
    $or: [
      // New booking starts during an existing booking
      { 
        startTime: { $lte: startDateTime },
        endTime: { $gt: startDateTime }
      },
      // New booking ends during an existing booking
      {
        startTime: { $lt: endDateTime },
        endTime: { $gte: endDateTime }
      },
      // New booking encompasses an existing booking
      {
        startTime: { $gte: startDateTime },
        endTime: { $lte: endDateTime }
      }
    ]
  });
  
  return overlappingBookings.length === 0;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;