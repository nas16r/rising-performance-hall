import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarClock, Clock, CalendarDays, User, Mail, Phone } from 'lucide-react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { OPENING_HOUR, CLOSING_HOUR, MIN_BOOKING_HOURS, MAX_BOOKING_HOURS } from '../config';

interface BookingFormData {
  eventName: string;
  date: Date | null;
  startTime: Date | null;
  duration: number;
  name: string;
  email: string;
  phone: string;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<BookingFormData>({
    eventName: '',
    date: null,
    startTime: null,
    duration: MIN_BOOKING_HOURS,
    name: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<Partial<BookingFormData & { general: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [endTime, setEndTime] = useState<string>('');

  useEffect(() => {
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
      startTime: null
    }));
    
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const handleStartTimeChange = (time: Date | null) => {
    if (time && formData.date) {
      // Combine the selected date with the selected time
      const combinedDateTime = new Date(formData.date);
      combinedDateTime.setHours(time.getHours());
      combinedDateTime.setMinutes(time.getMinutes());
      
      setFormData((prev) => ({ ...prev, startTime: combinedDateTime }));
    } else {
      setFormData((prev) => ({ ...prev, startTime: time }));
    }
    
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
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<BookingFormData & { general: string }> = {};
    
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-8), // Generate a random password
        options: {
          data: {
            name: formData.name,
            phone: formData.phone
          }
        }
      });

      if (authError) throw authError;

      const endTimeDate = addHours(formData.startTime!, formData.duration);
      
      // Then create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            event_name: formData.eventName,
            date: format(formData.date!, 'yyyy-MM-dd'),
            start_time: formData.startTime?.toISOString(),
            end_time: endTimeDate.toISOString(),
            duration: formData.duration,
            user_id: authData.user?.id
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Booking created successfully!');
      navigate('/booking-success');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeOptions = () => {
    if (!formData.date) return [];

    const options = [];
    const selectedDate = new Date(formData.date);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    // If booking for today, only show future times
    const startHour = isToday ? Math.max(OPENING_HOUR, now.getHours() + 1) : OPENING_HOUR;
    
    for (let hour = startHour; hour <= CLOSING_HOUR - MIN_BOOKING_HOURS; hour++) {
      const timeOption = setHours(setMinutes(selectedDate, 0), hour);
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
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              
              <div>
                <label htmlFor="name" className="form-label flex items-center gap-1">
                  <User size={16} />
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'border-danger' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="form-label flex items-center gap-1">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'border-danger' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="form-label flex items-center gap-1">
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-input ${errors.phone ? 'border-danger' : ''}`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Event Details</h2>
              
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