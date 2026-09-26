import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Store, QrCode } from 'lucide-react';
import { useStaffAuth } from '../context/StaffAuthContext.js';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { business, logout } = useStaffAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-dvh w-full bg-surface-soft text-ink flex flex-col selection:bg-brand-soft selection:text-brand-dark">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-line shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-black text-lg shadow-xs">
                S
              </div>
              <span className="text-lg font-extrabold tracking-tight text-ink">SEYO</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-soft text-brand-dark">
              Staff Terminal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {business && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-soft border border-line text-xs font-semibold">
                <span>{business.logoEmoji || '🏢'}</span>
                <span className="text-ink">{business.name}</span>
                <span className="text-muted text-[10px] uppercase bg-white px-1.5 py-0.5 rounded border border-line">
                  {business.tier}
                </span>
              </div>
            )}

            <Link
              to="/"
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              title="All Merchants Demo"
            >
              <Store className="w-5 h-5" />
            </Link>

            {business && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">{children}</main>

      {/* Enterprise Staff Footer */}
      <footer className="border-t border-line bg-white py-4 px-4 text-center text-xs text-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span>SEYO Enterprise QR & NFC Engine • Scoped Business Security Active</span>
          </div>
          <div>
            <span className="text-muted">Multi-Tenant Protected Instance</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
