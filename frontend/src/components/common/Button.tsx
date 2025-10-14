import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  small?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  small,
  loading,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "font-medium rounded-lg transition-all duration-300 flex items-center justify-center";
  
  const sizeStyles = small
    ? "px-3 py-1.5 text-sm"
    : "px-4 py-2.5 text-base";

  const variantStyles = {
    primary:
      "glass-button hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-200 bg-opacity-40 backdrop-blur-md border border-gray-300 hover:bg-opacity-60 text-gray-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
    success:
      "bg-success bg-opacity-20 backdrop-blur-md border border-success hover:bg-opacity-30 text-green-800 shadow-md hover:shadow-lg hover:shadow-success/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
    danger:
      "bg-red-500 bg-opacity-20 backdrop-blur-md border border-red-400 hover:bg-opacity-30 text-red-800 shadow-md hover:shadow-lg hover:shadow-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};
