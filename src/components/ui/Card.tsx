import React from 'react';

export function Card({ children, className = '', ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`bg-card-bg backdrop-blur-xl border border-card-border rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:shadow-primary/10 hover:border-primary/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
