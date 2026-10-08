import React, { useState } from 'react';
import { PRODUCT_TIERS, ProductTier } from '../../shared/constants/tiers';
import { Button } from '../components/common/Button';
import { PaymentModal } from '../components/payment/PaymentModal';
import {
  Sparkles,
  Award,
  Star,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Radio,
  ExternalLink,
  Store,
  Zap,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<ProductTier>('combined');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleOpenPurchase = (tier: ProductTier) => {
    setSelectedTier(tier);
    setIsPurchaseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f2] text-[#10181c] flex flex-col font-['Inter',sans-serif]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e2e7e6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0e7c66] text-white flex items-center justify-center font-black text-xl shadow-sm">
              S
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-[#10181c]">SEYO</span>
              <span className="text-[10px] font-bold text-[#0e7c66] block uppercase tracking-widest leading-none">
                Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button href="/staff/login" variant="outline" size="sm" className="hidden sm:inline-flex">
              Staff Terminal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenPurchase('combined')}
              className="gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e2f1ec] text-[#0e7c66] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen QR & NFC Customer Engagement</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-[#10181c] tracking-tight leading-[1.1] mb-6">
          Turn Every Dine-in & Retail Visit into <span className="text-[#0e7c66]">Lifelong Loyalty</span>.
        </h1>

        <p className="text-base sm:text-xl text-[#6a787e] max-w-2xl mx-auto leading-relaxed mb-8">
          One unified platform with 4 tiered engagement modes: 100% all-win spin wheels, digital milestone stamp cards, and verified Google reviews.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-12">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => handleOpenPurchase('combined')}
            className="gap-2 shadow-lg text-lg py-4"
          >
            <span>Launch Merchant Suite</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            href="/c/bella-napoli/v"
            variant="outline"
            size="lg"
            fullWidth
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Live Customer Demo</span>
          </Button>
        </div>

        {/* Live Demo Quick Cards */}
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 shadow-sm max-w-3xl mx-auto text-left">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e2e7e6]">
            <div>
              <h3 className="font-bold text-[#10181c] text-sm">Pre-Seeded Interactive Demos</h3>
              <p className="text-xs text-[#6a787e]">Test customer and staff journeys right now:</p>
            </div>
            <span className="text-xs font-semibold text-[#0e7c66] bg-[#e2f1ec] px-2.5 py-1 rounded-full">
              Ready to Explore
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-[#e2e7e6] bg-[#f8faf9] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0e7c66] uppercase">Combined Suite</span>
                <h4 className="font-bold text-[#10181c] text-sm mt-0.5">Bella Napoli Pizzeria</h4>
                <p className="text-[11px] text-[#6a787e]">Spin + Loyalty + Review journey</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <a href="/c/bella-napoli/v">
                  <span className="text-xs font-bold text-[#0e7c66] hover:underline flex items-center gap-1">
                    Customer Flow <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
                <a href="/staff/login?demo=bella-napoli">
                  <span className="text-xs font-bold text-[#6a787e] hover:underline flex items-center gap-1">
                    Staff Terminal <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#e2e7e6] bg-[#f8faf9] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase">Spin & Win Tier</span>
                <h4 className="font-bold text-[#10181c] text-sm mt-0.5">Tokyo Ramen Lab</h4>
                <p className="text-[11px] text-[#6a787e]">100% all-win gamified spins</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <a href="/c/tokyo-ramen/v">
                  <span className="text-xs font-bold text-[#0e7c66] hover:underline flex items-center gap-1">
                    Customer Flow <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
                <a href="/staff/login?demo=tokyo-ramen">
                  <span className="text-xs font-bold text-[#6a787e] hover:underline flex items-center gap-1">
                    Staff Terminal <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Tiers Section */}
      <section className="py-16 bg-white border-t border-[#e2e7e6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#10181c] tracking-tight">
              Transparent Merchant Tiers
            </h2>
            <p className="text-sm text-[#6a787e] mt-2">
              Select the perfect engagement model for your venue. Upgrade or expand anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {(Object.keys(PRODUCT_TIERS) as ProductTier[]).map(tierKey => {
              const tier = PRODUCT_TIERS[tierKey];
              const isPopular = tierKey === 'combined';

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'bg-[#0e7c66] text-white shadow-xl ring-2 ring-[#0e7c66] scale-[1.02]'
                      : 'bg-white border border-[#e2e7e6] text-[#10181c]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isPopular ? 'bg-white/20 text-white' : 'bg-[#e2f1ec] text-[#0e7c66]'
                        }`}
                      >
                        {tier.name}
                      </span>
                      {isPopular && (
                        <span className="text-[11px] font-bold text-amber-300">MOST POPULAR</span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 my-4">
                      <span className="text-3xl font-black">${tier.priceMonthly}</span>
                      <span className={`text-xs ${isPopular ? 'text-white/80' : 'text-[#6a787e]'}`}>
                        /month
                      </span>
                    </div>

                    <p className={`text-xs mb-6 ${isPopular ? 'text-white/90' : 'text-[#6a787e]'}`}>
                      {tier.tagline}
                    </p>

                    <div className="space-y-2.5 mb-6">
                      {tier.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPopular ? 'text-amber-300' : 'text-[#0e7c66]'
                            }`}
                          />
                          <span className={isPopular ? 'text-white' : 'text-[#10181c]'}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant={isPopular ? 'secondary' : 'primary'}
                    fullWidth
                    onClick={() => handleOpenPurchase(tier.id)}
                    className="gap-1.5"
                  >
                    <span>Choose {tier.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-16 px-4 max-w-5xl mx-auto text-left">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-[#10181c] tracking-tight">Industrial-Grade Architecture</h2>
          <p className="text-sm text-[#6a787e] mt-2">
            Engineered for reliability, multi-tenant isolation, and zero-spoofing customer security.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#e2e7e6] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e2f1ec] text-[#0e7c66] flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#10181c] text-base">Permanent NFC & Dynamic QR</h3>
            <p className="text-xs text-[#6a787e] leading-relaxed">
              Physical tags never expire. Customers receive cryptographically secure short-lived journey tokens preventing replay attacks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e2e7e6] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e2f1ec] text-[#0e7c66] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#10181c] text-base">Server-Authoritative Status</h3>
            <p className="text-xs text-[#6a787e] leading-relaxed">
              The backend automatically computes the first incomplete stage (Spin → Loyalty → Review) and enforces merchant timezone midnight resets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e2e7e6] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e2f1ec] text-[#0e7c66] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#10181c] text-base">Staff Terminal & PIN Gate</h3>
            <p className="text-xs text-[#6a787e] leading-relaxed">
              Staff redeem customer vouchers on-site with a secure 4-digit PIN. Real-time loyalty trackers and Top 5 Loyal Legends leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white border-t border-[#e2e7e6] text-xs text-[#6a787e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0e7c66] text-white flex items-center justify-center font-bold text-sm">
                S
              </div>
              <div>
                <span className="font-bold text-[#10181c] text-sm block">SEYO Technologies India</span>
                <span className="text-[11px] text-[#6a787e]">Offline-to-Online Loyalty & Rewards Platform</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <a href="/terms" className="text-[#0e7c66] hover:underline">
                Terms & Conditions
              </a>
              <span className="text-[#e2e7e6]">•</span>
              <a href="/privacy" className="text-[#0e7c66] hover:underline">
                Privacy Policy
              </a>
              <span className="text-[#e2e7e6]">•</span>
              <a href="/refund-policy" className="text-[#0e7c66] hover:underline">
                Cancellation & Refund
              </a>
              <span className="text-[#e2e7e6]">•</span>
              <a href="/staff/login" className="hover:text-[#10181c]">
                Staff Portal
              </a>
              <span className="text-[#e2e7e6]">•</span>
              <a href="/c/bella-napoli/v" className="hover:text-[#10181c]">
                Customer Demo
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f3f2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#6a787e]">
            <p>© {new Date().getFullYear()} SEYO Technologies India. All rights reserved. Secure online payment processing by Razorpay.</p>
            <p>Support: <a href="mailto:support@seyo.app" className="text-[#0e7c66] hover:underline font-medium">support@seyo.app</a> | Hotline: +91 98765 43210 | Pune, India</p>
          </div>
        </div>
      </footer>

      {/* Online Razorpay Payment Modal */}
      <PaymentModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        selectedTier={selectedTier}
      />
    </div>
  );
};
