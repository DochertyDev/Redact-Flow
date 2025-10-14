import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5 relative backdrop-blur-sm border border-white border-opacity-20">
      <div
        className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
        style={{ width: `${clampedProgress}%` }}
      ></div>
      {message && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-gray-600">
          {message}
        </span>
      )}
    </div>
  );
};
