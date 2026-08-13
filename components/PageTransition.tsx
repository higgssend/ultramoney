import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll position on route change
    if (containerRef.current) {
      const scrollParent = containerRef.current.closest('main') || window;
      scrollParent.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div 
      key={location.pathname} 
      ref={containerRef}
      className="w-full animate-page-enter"
    >
      {children}
    </div>
  );
};

export default PageTransition;
