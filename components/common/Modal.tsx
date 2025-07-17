

import React, { useEffect, useState, useRef } from 'react';
import Button from '@/components/common/Button'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  titleId?: string; 
  descriptionId?: string; 
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footerContent,
  size = 'md',
  titleId: customTitleId,
  descriptionId: customDescriptionId
}) => {
  const [showContent, setShowContent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      setTimeout(() => {
        setShowContent(true);
        // Set initial focus
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus(); // Fallback to modal itself
        }
      }, 50);
    } else {
      setShowContent(false);
      previousFocusRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current || !isOpen) {
        return;
      }

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null); // Only visible, focusable elements

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleFocusTrap);
    }
    return () => {
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen]);


  if (!isOpen && !showContent) return null;

  const generatedTitleId = customTitleId || (title ? `modal-title-${Math.random().toString(36).substring(2, 9)}` : undefined);
  const generatedDescriptionId = customDescriptionId || (children ? `modal-description-${Math.random().toString(36).substring(2, 9)}` : undefined);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  const modalBaseClasses = `rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all duration-300 ease-out overflow-hidden flex flex-col max-h-[90vh]`;
  const modalThemeClasses = "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700";
  
  const titleClasses = "text-primary-700 dark:text-primary-300";
  const borderClasses = "border-neutral-200 dark:border-neutral-700";
  const footerBgClasses = "bg-neutral-100 dark:bg-neutral-700/50";
  const childrenTextColor = "text-neutral-800 dark:text-neutral-200";

  const backdropTransitionClass = isOpen ? "opacity-100" : "opacity-0";
  const modalContentTransitionClass = showContent && isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4";


  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-300 ease-in-out ${backdropTransitionClass}`}
      onClick={onClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby={generatedTitleId}
      aria-describedby={generatedDescriptionId}
    >
      <div 
        ref={modalRef}
        tabIndex={-1} // Make modal container focusable for fallback
        className={`${modalBaseClasses} ${modalThemeClasses} ${modalContentTransitionClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={`px-6 py-4 border-b ${borderClasses}`}>
            <h3 id={generatedTitleId} className={`text-xl font-semibold ${titleClasses}`}>{title}</h3>
          </div>
        )}
        <div id={generatedDescriptionId} className={`p-6 flex-grow overflow-y-auto ${childrenTextColor}`}> 
          {children}
        </div>
        {footerContent && (
          <div className={`px-6 py-4 border-t ${borderClasses} ${footerBgClasses} flex justify-end space-x-3 space-x-reverse`}>
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;