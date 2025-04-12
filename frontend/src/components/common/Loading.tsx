import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'gold' | 'mystic';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-primary-500',
    gold: 'border-gold-500',
    mystic: 'border-mystic-500'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${variantClasses[variant]} 
          border-4 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
};

export default Loading; 