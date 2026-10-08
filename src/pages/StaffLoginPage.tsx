import React, { useState, useEffect } from 'react';
import { staffApi } from '../services/staffApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Building2, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { safeSessionStorage } from '../utils/safeStorage';

export const StaffLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'bella-napoli') {
      setIdentifier('owner@bellanapoli.com');
      setPassword('seyo1234');
    } else if (demo === 'tokyo-ramen') {
      setIdentifier('lab@tokyoramen.jp');
      setPassword('seyo1234');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide business email or slug and staff password');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await staffApi.login(identifier.trim(), password);
      safeSessionStorage.setItem('seyo_staff_session', res.sessionToken);
      window.location.href = '/staff/terminal';
    } catch (err: any) {
      setError(err.message || 'Invalid staff credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (slug: string, email: string) => {
    setIdentifier(email);
    setPassword('seyo1234');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#e2e7e6] shadow-xl p-8 text-left space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0e7c66] text-white mx-auto flex items-center justify-center font-black text-2xl shadow-sm mb-3">
            S
          </div>
          <h2 className="text-2xl font-black text-[#10181c] tracking-tight">Staff Portal</h2>
          <p className="text-xs text-[#6a787e] mt-1">
            Sign in to manage vouchers, stamp cards, and QR entries
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Business Email or Slug"
            placeholder="e.g. owner@bellanapoli.com or bella-napoli"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            leftAddon={<Building2 className="w-5 h-5 text-[#0e7c66]" />}
            autoFocus
          />

          <Input
            label="Staff Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            leftAddon={<Lock className="w-5 h-5 text-[#0e7c66]" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="gap-2 shadow-md mt-2"
          >
            <span>Sign In to Terminal</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        {/* Demo Fast-Fill Box */}
        <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-[#e2e7e6] space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#10181c]">
            <Sparkles className="w-3.5 h-3.5 text-[#0e7c66]" />
            <span>Fast Demo Sign-In</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('bella-napoli', 'owner@bellanapoli.com')}
              className="text-left text-xs text-[#0e7c66] hover:underline font-medium cursor-pointer"
            >
              🍕 Bella Napoli Pizzeria (Combined Suite)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('tokyo-ramen', 'lab@tokyoramen.jp')}
              className="text-left text-xs text-[#0e7c66] hover:underline font-medium cursor-pointer"
            >
              🍜 Tokyo Ramen Lab (Spin Tier)
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-[#6a787e] hover:text-[#10181c] underline">
            ← Return to Marketing Site
          </a>
        </div>
      </div>
    </div>
  );
};
