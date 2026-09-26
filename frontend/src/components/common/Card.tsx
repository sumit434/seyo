import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  inset?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, inset = false, className = '', ...props }) => {
  return (
    <div
      className={`${inset ? 'card-inset' : 'rounded-3xl border border-line bg-white p-5 shadow-sm'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
