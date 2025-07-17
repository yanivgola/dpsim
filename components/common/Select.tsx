

import React from 'react';
// Theme prop removed

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  containerClassName?: string;
  defaultEmptyOption?: boolean | string; 
  labelClassName?: string; // Corrected casing: labelclassName -> labelClassName
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  options,
  error,
  className,
  containerClassName,
  value,
  defaultEmptyOption = "בחר...", 
  labelClassName, // Corrected casing for destructuring
  ...props
}) => {
  const htmlForId = id || props.name;
  // Moved inside the component function
  const defaultLabelClass = typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme') ? 'text-secondary-700' : 'text-secondary-300';
  
  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={htmlForId} className={`block text-sm font-medium mb-1 ${labelClassName || defaultLabelClass}`}>{label}</label>}
      <select
        id={htmlForId}
        value={value === undefined && defaultEmptyOption ? "" : value}
        className={`block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed themed-select ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        {...props}
      >
        {defaultEmptyOption && <option value="" disabled={value !== ""}>{typeof defaultEmptyOption === 'string' ? defaultEmptyOption : "בחר..."}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Select;