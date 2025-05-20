import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';

const BookingSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center animate-slideUp">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-success" />
            </div>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-primary mb-4">Booking Confirmed!</h1>
          
          <p className="text-gray-600 mb-6">
            Your booking has been successfully processed. A confirmation email has been sent to your registered email address with all the details.
          </p>
          
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              If you need to make any changes to your booking, please contact us at <span className="text-primary font-medium">support@risingperformancehall.com</span>
            </p>
          </div>
          
          <Link 
            to="/booking" 
            className="btn btn-primary flex items-center justify-center gap-2 mx-auto"
          >
            <Calendar size={20} />
            Book Another Event
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;