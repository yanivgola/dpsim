
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
  const baseStyle = "font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-300 ease-in-out inline-flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg",
  };

  const variantStyles = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700 dark:focus-visible:ring-primary-400",
    secondary: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 active:bg-neutral-400 focus-visible:ring-neutral-400 border border-neutral-300 shadow-sm dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 dark:active:bg-neutral-500 dark:focus-visible:ring-neutral-500 dark:border-neutral-600",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm",
    ghost: "bg-transparent text-primary-600 hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900 dark:active:bg-primary-800 dark:focus-visible:ring-primary-400",
  };
  
  const disabledStyle = "opacity-60 cursor-not-allowed";

  const iconSpacingClass = children ? (size === 'sm' ? "mx-1" : "mx-1.5") : "";

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