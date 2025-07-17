import React from 'react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default Widget;
