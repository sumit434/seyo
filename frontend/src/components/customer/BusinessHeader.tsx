import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { BusinessConfig } from '../../services/apiServices.js';

interface BusinessHeaderProps {
  business: BusinessConfig;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({ business }) => {
  return (
    <div className="w-full flex flex-col items-center text-center pb-4 pt-1">
      {/* Brand Icon Badge */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-3xl bg-brand-soft border-2 border-brand/20 flex items-center justify-center text-3xl shadow-sm">
          {business.logoEmoji || '🍽️'}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px] ring-2 ring-white">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h1 className="text-xl font-extrabold text-ink tracking-tight">
        {business.name}
      </h1>

      <p className="mt-0.5 text-xs font-medium text-muted flex items-center gap-1">
        <MapPin className="w-3 h-3 text-brand" />
        <span>{business.category}</span>
      </p>
    </div>
  );
};
