import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { VENUE_NAME } from '../config';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  // Don't show navbar on welcome page
  if (location.pathname === '/') return null;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl md:text-2xl font-display font-bold text-primary">
          {VENUE_NAME}
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            <span className="text-sm font-medium">Guest User</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;