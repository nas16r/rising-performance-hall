import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Booking from './pages/Booking';
import BookingSuccess from './pages/BookingSuccess';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signin" element={!isAuthenticated ? <SignIn /> : <Navigate to="/booking" />} />
      <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/booking" />} />
      <Route path="/booking" element={isAuthenticated ? <Booking /> : <Navigate to="/signin" />} />
      <Route path="/booking-success" element={isAuthenticated ? <BookingSuccess /> : <Navigate to="/signin" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;