import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VENUE_NAME } from '../config';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't show navbar on welcome page
  if (location.pathname === '/') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl md:text-2xl font-display font-bold text-primary">
          {VENUE_NAME}
        </Link>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <User size={18} className="text-primary" />
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/signin" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary py-2 px-4 text-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;