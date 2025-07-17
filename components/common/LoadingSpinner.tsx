import React, { useState, useEffect } from 'react';
import CustomLoadingSpinner from './CustomLoadingSpinner';

interface LoadingSpinnerProps {
  message?: string;
  tips?: string[];
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, tips }) => {
  const [currentTip, setCurrentTip] = useState<string | null>(null);

  useEffect(() => {
    if (tips && tips.length > 0) {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      const interval = setInterval(() => {
        setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tips]);

  return (
    <div className="flex flex-col justify-center items-center h-full p-4 text-center">
      <CustomLoadingSpinner />
      {message && <p className="mt-4 text-lg font-semibold text-neutral-800 dark:text-neutral-200">{message}</p>}
      {currentTip && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 animate-pulse">{currentTip}</p>}
    </div>
  );
};

export default LoadingSpinner;
