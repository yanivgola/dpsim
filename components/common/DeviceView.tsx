import React, { useState } from 'react';

type Device = 'desktop' | 'tablet' | 'mobile';

interface DeviceViewProps {
  children: React.ReactNode;
}

const DeviceView: React.FC<DeviceViewProps> = ({ children }) => {
  const [device, setDevice] = useState<Device>('desktop');

  const deviceClasses = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-full mx-auto',
    mobile: 'w-[375px] h-full mx-auto',
  };

  return (
    <div className="w-full h-screen bg-neutral-200 dark:bg-neutral-900 flex flex-col items-center justify-center">
      <div className="flex space-x-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-md">
        <button onClick={() => setDevice('desktop')} className={`px-3 py-1 text-sm rounded-md ${device === 'desktop' ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>Desktop</button>
        <button onClick={() => setDevice('tablet')} className={`px-3 py-1 text-sm rounded-md ${device === 'tablet' ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>Tablet</button>
        <button onClick={() => setDevice('mobile')} className={`px-3 py-1 text-sm rounded-md ${device === 'mobile' ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>Mobile</button>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${deviceClasses[device]}`}>
        {children}
      </div>
    </div>
  );
};

export default DeviceView;
