import React from 'react';

interface ToggleSwitchProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void; // Custom onChange for the toggle's state
  disabled?: boolean;
  labelClassName?: string;
  // title prop and other label attributes will be handled by ...props
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  id, 
  label, 
  checked, 
  onChange, 
  disabled = false, 
  labelClassName,
  className, // Extract className to apply it specifically to the label
  ...props // Capture other props like title
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  // Moved defaultLabelClass logic inside the component
  const determinedLabelClassName = labelClassName || (typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme') ? 'text-secondary-700' : 'text-secondary-200');

  return (
    <label 
      htmlFor={id} 
      className={`flex items-center justify-between cursor-pointer py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props} // Spread props here for title, etc.
    >
      <span className={`text-sm font-medium ${determinedLabelClassName}`}>{label}</span>
      <div className="relative mr-3 rtl:ml-3 rtl:mr-0"> {/* Added margin for spacing */}
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-primary-500' : (typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme') ? 'bg-secondary-300' : 'bg-secondary-600')}`}></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ease-in-out ${
            checked ? 'transform translate-x-full' : ''
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;