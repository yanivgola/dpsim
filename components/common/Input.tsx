

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
  // Determine default label color based on current theme (by checking html class)
  // Moved inside the component function
  const defaultLabelClass = typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme') ? 'text-secondary-700' : 'text-secondary-300';

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={htmlForId} className={`block text-sm font-medium mb-1 ${labelClassName || defaultLabelClass}`}>{label}</label>}
      <input
        id={htmlForId}
        type={type}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed themed-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;