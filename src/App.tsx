import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Booking from './pages/Booking';
import BookingSuccess from './pages/BookingSuccess';
import { useAuth } from './context/AuthContext';

function App() {
  // Temporarily bypass authentication
  const isAuthenticated = true;
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signin" element={<Navigate to="/booking" />} />
      <Route path="/signup" element={<Navigate to="/booking" />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking-success" element={<BookingSuccess />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;