

import React from 'react';
// Theme prop removed as CSS will handle it via html.light-theme

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string; 
}

const Input: React.FC<InputProps> = ({ label, id, error, className, containerClassName, type = "text", labelClassName, ...props }) => {
  const htmlForId = id || props.name;

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={htmlForId} className={`block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300 ${labelClassName || ''}`}>{label}</label>}
      <input
        id={htmlForId}
        type={type}
        className={`block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;