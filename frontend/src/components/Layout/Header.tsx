import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-4 glass-card rounded-none flex justify-between items-center border-b border-white border-opacity-20 fixed top-0 z-10">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold text-gray-800">
          <span className="text-primary">Redact</span>Flow
        </h1>
      </div>
    </header>
  );
};
