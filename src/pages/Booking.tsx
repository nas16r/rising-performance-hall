import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarClock, Clock, CalendarDays } from 'lucide-react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { API_URL, OPENING_HOUR, CLOSING_HOUR, MIN_BOOKING_HOURS, MAX_BOOKING_HOURS } from '../config';

interface BookingFormData {
  eventName: string;
  date: Date | null;
  startTime: Date | null;
  duration: number;
}

interface BookedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<BookingFormData>({
    eventName: '',
    date: null,
    startTime: null,
    duration: MIN_BOOKING_HOURS,
  });
  
  const [errors, setErrors] = useState<Partial<BookingFormData & { general: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [endTime, setEndTime] = useState<string>('');

  useEffect(() => {
    // Fetch booked slots
    const fetchBookedSlots = async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings/slots`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setBookedSlots(response.data);
      } catch (error) {
        toast.error('Failed to fetch booked slots');
      }
    };
    
    fetchBookedSlots();
  }, []);

  useEffect(() => {
    // Calculate end time whenever start time or duration changes
    if (formData.startTime && formData.duration) {
      const endTimeDate = addHours(formData.startTime, formData.duration);
      setEndTime(format(endTimeDate, 'h:mm a'));
    } else {
      setEndTime('');
    }
  }, [formData.startTime, formData.duration]);

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      date,
      startTime: null // Reset start time when date changes
    }));
    
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const handleStartTimeChange = (time: Date | null) => {
    setFormData((prev) => ({ ...prev, startTime: time }));
    
    if (errors.startTime) {
      setErrors((prev) => ({ ...prev, startTime: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error on change
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<BookingFormData & { general: string }> = {};
    
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.duration || formData.duration < MIN_BOOKING_HOURS) {
      newErrors.duration = `Minimum booking duration is ${MIN_BOOKING_HOURS} hour`;
    }
    
    // Check if the end time exceeds closing time
    if (formData.startTime && formData.duration) {
      const endTimeDate = addHours(formData.startTime, formData.duration);
      const endTimeHour = endTimeDate.getHours();
      
      if (endTimeHour > CLOSING_HOUR || (endTimeHour === CLOSING_HOUR && endTimeDate.getMinutes() > 0)) {
        newErrors.duration = `Booking can't extend beyond ${CLOSING_HOUR}:00`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const bookingData = {
        userId: user?._id,
        eventName: formData.eventName,
        date: formData.date,
        startTime: formData.startTime,
        duration: formData.duration,
      };
      
      await axios.post(`${API_URL}/bookings`, bookingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Booking created successfully!');
      navigate('/booking-success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create booking';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out booked dates/times
  const isDateDisabled = (date: Date) => {
    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  };

  // Filter available time slots based on booked slots
  const filterTime = (time: Date) => {
    const hour = time.getHours();
    
    // Only allow times within opening hours
    if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
      return false;
    }
    
    // Check if the selected date and time slot is already booked
    if (formData.date) {
      const dateString = format(formData.date, 'yyyy-MM-dd');
      
      const isSlotBooked = bookedSlots.some(slot => {
        if (slot.date !== dateString) return false;
        
        const slotStartHour = parseInt(slot.startTime.split(':')[0]);
        const slotEndHour = parseInt(slot.endTime.split(':')[0]);
        
        return hour >= slotStartHour && hour < slotEndHour;
      });
      
      return !isSlotBooked;
    }
    
    return true;
  };

  const getTimeOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = OPENING_HOUR; i <= CLOSING_HOUR - MIN_BOOKING_HOURS; i++) {
      const timeOption = setHours(setMinutes(now, 0), i);
      options.push(timeOption);
    }
    
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 md:p-8 animate-slideUp">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">Book Your Event</h1>
            <p className="text-gray-600">Fill out the details to reserve your spot</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="eventName" className="form-label">Event Name</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                className={`form-input ${errors.eventName ? 'border-danger' : ''}`}
                placeholder="Enter your event name"
              />
              {errors.eventName && <p className="form-error">{errors.eventName}</p>}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="form-label flex items-center gap-1">
                  <CalendarDays size={16} />
                  Select Date
                </label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  filterDate={isDateDisabled}
                  minDate={new Date()}
                  placeholderText="Select a date"
                  className={`form-input ${errors.date ? 'border-danger' : ''}`}
                  dateFormat="MMMM d, yyyy"
                />
                {errors.date && <p className="form-error">{errors.date}</p>}
              </div>
              
              <div>
                <label htmlFor="startTime" className="form-label flex items-center gap-1">
                  <Clock size={16} />
                  Start Time
                </label>
                <DatePicker
                  selected={formData.startTime}
                  onChange={handleStartTimeChange}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={60}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  placeholderText="Select start time"
                  className={`form-input ${errors.startTime ? 'border-danger' : ''}`}
                  filterTime={filterTime}
                  includeTimes={getTimeOptions()}
                  disabled={!formData.date}
                />
                {errors.startTime && <p className="form-error">{errors.startTime}</p>}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="form-label flex items-center gap-1">
                  <CalendarClock size={16} />
                  Duration (hours)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`form-input ${errors.duration ? 'border-danger' : ''}`}
                  disabled={!formData.startTime}
                >
                  {[...Array(MAX_BOOKING_HOURS + 1 - MIN_BOOKING_HOURS)].map((_, i) => (
                    <option key={i} value={i + MIN_BOOKING_HOURS}>
                      {i + MIN_BOOKING_HOURS} hour{i + MIN_BOOKING_HOURS > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {errors.duration && <p className="form-error">{errors.duration}</p>}
              </div>
              
              <div>
                <label className="form-label">End Time</label>
                <div className="form-input bg-gray-50 flex items-center">
                  {endTime || 'Select start time first'}
                </div>
              </div>
            </div>
            
            {errors.general && (
              <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-md">
                {errors.general}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`btn btn-primary w-full mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Book Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Booking;