import React from 'react';

const CustomLoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse">
      <div className="w-2 h-8 bg-primary-500 rounded-full animate-wavey"></div>
      <div className="w-2 h-8 bg-primary-500 rounded-full animate-wavey" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-8 bg-primary-500 rounded-full animate-wavey" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-8 bg-primary-500 rounded-full animate-wavey" style={{ animationDelay: '0.3s' }}></div>
      <div className="w-2 h-8 bg-primary-500 rounded-full animate-wavey" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default CustomLoadingSpinner;
