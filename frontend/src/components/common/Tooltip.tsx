import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number; // Delay in ms before showing tooltip
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const ARROW_HEIGHT = 8;
    const SPACING = 4;
    const EDGE_PADDING = 10;

    // Calculate initial position (centered below trigger)
    let top = triggerRect.bottom + ARROW_HEIGHT + SPACING;
    let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

    // Adjust horizontal position if tooltip would overflow viewport
    if (left < EDGE_PADDING) {
      left = EDGE_PADDING;
    } else if (left + tooltipRect.width > window.innerWidth - EDGE_PADDING) {
      left = window.innerWidth - tooltipRect.width - EDGE_PADDING;
    }

    // If tooltip would overflow bottom of viewport, position above trigger instead
    if (top + tooltipRect.height > window.innerHeight - EDGE_PADDING) {
      top = triggerRect.top - tooltipRect.height - ARROW_HEIGHT - SPACING;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      // Update position on scroll or resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <>
      <span 
        ref={triggerRef}
        className="relative" 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] px-4 py-3 text-sm font-medium text-gray-800 transition-opacity duration-300 pointer-events-none"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
