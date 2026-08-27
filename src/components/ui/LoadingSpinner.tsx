import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = "Processing...", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 text-primary ${className}`}>
      <Loader2 className="w-5 h-5 animate-spin" />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
}
