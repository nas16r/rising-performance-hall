import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { BG_IMAGES, VENUE_NAME } from '../config';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Change background image every 4 seconds
  useEffect(() => {
    setIsLoaded(true);
    
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % BG_IMAGES.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const handleBookNow = () => {
    navigate('/signin');
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Images */}
      {BG_IMAGES.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentBgIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-dark bg-opacity-60" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <div className={`text-center transform transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 tracking-tight">
            WELCOME TO <br />
            <span className="text-secondary">RISING PERFORMANCE HALL</span>
          </h1>
          
          <p className="text-white text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            The perfect venue for your next event, performance, or celebration.
            Book your date and make your vision come to life.
          </p>
          
          <button 
            onClick={handleBookNow}
            className="btn btn-secondary flex items-center justify-center gap-2 mx-auto"
          >
            <Calendar size={20} />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;