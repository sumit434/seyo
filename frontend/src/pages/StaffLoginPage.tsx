import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Store } from 'lucide-react';
import { useStaffAuth } from '../context/StaffAuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';

export const StaffLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useStaffAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      navigate('/staff/terminal');
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    clearError();
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center p-4 bg-surface-soft">
      <div className="w-full sm:max-w-[420px] bg-white rounded-3xl border border-line p-6 shadow-pop">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-2xl font-black shadow-sm mb-3">
            S
          </div>
          <h1 className="text-2xl font-black text-ink">Staff Terminal Login</h1>
          <p className="text-xs text-muted mt-1">
            Enterprise QR generator & voucher redemption terminal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Business Email"
            type="email"
            placeholder="manager@rusticfork.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Input
            label="Terminal Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading} className="w-full py-4 font-bold">
              <span>Enter Terminal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>

        {/* Demo Fast-Switch Buttons */}
        <div className="mt-6 pt-5 border-t border-line">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2 text-center">
            One-Click Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('manager@rusticfork.com')}
              className="p-2 rounded-xl bg-surface-soft hover:bg-brand-soft hover:text-brand-dark border border-line text-xs font-semibold text-left transition-colors cursor-pointer"
            >
              🍕 Rustic Fork
              <span className="text-[10px] text-muted block">Combined Tier</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('manager@brewco.com')}
              className="p-2 rounded-xl bg-surface-soft hover:bg-brand-soft hover:text-brand-dark border border-line text-xs font-semibold text-left transition-colors cursor-pointer"
            >
              ☕ Brew & Co.
              <span className="text-[10px] text-muted block">Loyalty Tier</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('manager@velvetlounge.com')}
              className="p-2 rounded-xl bg-surface-soft hover:bg-brand-soft hover:text-brand-dark border border-line text-xs font-semibold text-left transition-colors cursor-pointer"
            >
              🍸 Velvet Lounge
              <span className="text-[10px] text-muted block">Spin Tier</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('manager@glowsalon.com')}
              className="p-2 rounded-xl bg-surface-soft hover:bg-brand-soft hover:text-brand-dark border border-line text-xs font-semibold text-left transition-colors cursor-pointer"
            >
              ✨ Glow Studio
              <span className="text-[10px] text-muted block">Review Tier</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-muted hover:text-brand font-medium inline-flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Return to Merchant Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
