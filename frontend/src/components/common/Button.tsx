// File: src/components/common/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean; // Add this
}

const Button: React.FC<ButtonProps> = ({ children, className = '', type = 'button', onClick, disabled = false }) => {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;