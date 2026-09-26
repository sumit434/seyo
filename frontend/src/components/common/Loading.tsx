import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  subtext?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading your experience...',
  subtext = 'Connecting with the merchant system',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[260px] animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mb-4 text-brand">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <h3 className="text-lg font-bold text-ink">{message}</h3>
      {subtext && <p className="mt-1 text-sm text-muted">{subtext}</p>}
    </div>
  );
};
