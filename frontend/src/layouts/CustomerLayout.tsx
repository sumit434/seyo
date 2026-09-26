import React from 'react';
import { Shield } from 'lucide-react';
import { BusinessConfig } from '../services/apiServices.js';
import { BusinessHeader } from '../components/customer/BusinessHeader.js';

interface CustomerLayoutProps {
  business: BusinessConfig | null;
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ business, children }) => {
  return (
    <div className="min-h-dvh w-full flex flex-col justify-between bg-white p-6 sm:p-10 selection:bg-brand-soft selection:text-brand-dark">
      {/* Full-Width Main Content Shell with Increased Top Spacing */}
      <main className="w-full max-w-xl mx-auto flex flex-col flex-1 pt-8 sm:pt-12">
        {business && <BusinessHeader business={business} />}
        <div className="w-full flex-1 flex flex-col justify-center my-6">{children}</div>
      </main>

      {/* SEYO Brand Footer */}
      <footer className="w-full max-w-xl mx-auto mt-8 flex justify-center items-center px-3 text-[11px] text-muted">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-muted/80">
          <Shield className="w-3.5 h-3.5 text-brand" />
          <span>Powered by SEYO Platform</span>
        </div>
      </footer>
    </div>
  );
};