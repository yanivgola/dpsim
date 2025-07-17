
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, containerClassName, labelClassName, ...props }) => {
  const htmlForId = id || props.name;
  const defaultLabelClass = typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme') ? 'text-secondary-700' : 'text-secondary-300';

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={htmlForId} className={`block text-sm font-medium mb-1 ${labelClassName || defaultLabelClass}`}>{label}</label>}
      <textarea
        id={htmlForId}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed themed-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Textarea;
