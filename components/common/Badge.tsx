import React from 'react';

interface BadgeProps {
  label: string;
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

const Badge: React.FC<BadgeProps> = ({ label, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    secondary: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}>
      {label}
    </span>
  );
};

export default Badge;
