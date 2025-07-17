
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyle = "font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-200 ease-in-out inline-flex items-center justify-center transform hover:scale-105 active:scale-95";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg",
  };

  const variantStyles = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm",
    secondary: "bg-secondary-200 text-secondary-700 hover:bg-secondary-300 active:bg-secondary-400 focus-visible:ring-secondary-400 border border-secondary-300 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm",
    ghost: "bg-transparent text-primary-600 hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary-500",
  };
  
  const disabledStyle = "opacity-60 cursor-not-allowed hover:scale-100 active:scale-100"; // Prevent scale on disabled

  const iconSpacingClass = children ? (size === 'sm' ? "mx-1" : "mx-1.5") : ""; // Adjusted spacing

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${(disabled || isLoading) ? disabledStyle : ''} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : undefined}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="טוען...">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className={iconSpacingClass}>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className={iconSpacingClass}>{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;