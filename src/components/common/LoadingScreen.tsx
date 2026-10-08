import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading SEYO experience...' }) => {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-[#f1f3f2]">
      <div className="w-16 h-16 rounded-2xl bg-[#0e7c66] flex items-center justify-center shadow-md mb-6 animate-pulse">
        <span className="text-white font-black text-2xl tracking-tight">S</span>
      </div>
      <div className="flex items-center gap-3 text-[#10181c] font-semibold text-lg">
        <Loader2 className="w-5 h-5 animate-spin text-[#0e7c66]" />
        <span>{message}</span>
      </div>
      <p className="text-xs text-[#6a787e] mt-4 uppercase tracking-widest font-bold">
        Powered by SEYO Platform
      </p>
    </div>
  );
};
