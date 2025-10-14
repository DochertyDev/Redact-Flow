import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-20 right-6 z-[9999] animate-slide-in-right">
      <div className="glass-card p-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] max-w-[500px]">
        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
        <p className="text-gray-800 text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
