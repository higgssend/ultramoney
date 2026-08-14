import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  backdropClassName?: string;
  containerClassName?: string;
}

export const PortalModal: React.FC<PortalModalProps> = ({
  isOpen = true,
  onClose,
  children,
  backdropClassName = "bg-slate-950/60 backdrop-blur-sm",
  containerClassName = "w-full flex justify-center"
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 ${backdropClassName} animate-fade-in`}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={containerClassName}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default PortalModal;
