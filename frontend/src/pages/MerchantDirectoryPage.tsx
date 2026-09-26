import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Disc3,
  Award,
  Star,
  Layers,
  Terminal,
  Store,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { customerApi, BusinessConfig } from '../services/apiServices.js';
import { Loading } from '../components/common/Loading.js';

export const MerchantDirectoryPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    customerApi
      .getAllBusinesses()
      .then(res => {
        setBusinesses(res.businesses || []);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-dvh bg-surface-soft text-ink flex flex-col selection:bg-brand-soft selection:text-brand-dark">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-line shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-xl shadow-xs">
              S
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-ink block leading-none">
                SEYO
              </span>
              <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">
                Customer Engagement Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/staff/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand-dark transition-colors shadow-xs"
            >
              <Terminal className="w-4 h-4" />
              <span>Staff Terminal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand/20 text-brand-dark text-xs font-bold mb-4">
          <Shield className="w-4 h-4 text-brand" />
          <span>Multi-Tenant Enterprise Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight max-w-3xl mx-auto leading-tight">
          One Customer Status Engine. <br className="hidden sm:inline" />
          <span className="text-brand">Multiple Engagement Modules.</span>
        </h1>

        <p className="mt-4 text-base text-muted max-w-2xl mx-auto leading-relaxed">
          SEYO transforms QR and NFC touchpoints into high-conversion dining and retail experiences.
          Guaranteed Spin & Win, Digital Loyalty tracking, and AI Google Review boosters—all authoritative, multi-tenant, and zero-drop.
        </p>
      </section>

      {/* Merchants Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-ink">Explore Test Establishments</h2>
            <p className="text-xs text-muted">
              Choose a merchant to test its customer journey or launch its staff terminal.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl border border-line p-12">
            <Loading message="Loading merchants..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map(b => {
              const isCombined = b.tier === 'combined';
              const isSpin = b.tier === 'spin';
              const isLoyalty = b.tier === 'loyalty';
              const isReview = b.tier === 'review';

              const customerRoute = isCombined
                ? `/c/${b.slug}/v`
                : isSpin
                ? `/c/${b.slug}/spin`
                : isLoyalty
                ? `/c/${b.slug}/loyalty`
                : `/review/${b.slug}`;

              return (
                <div
                  key={b.id}
                  className="rounded-3xl border border-line bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon & Tier Tag */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl bg-brand-soft border border-brand/20 flex items-center justify-center text-3xl shadow-xs">
                        {b.logoEmoji || '🏢'}
                      </div>
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                          isCombined
                            ? 'bg-brand text-white'
                            : 'bg-surface-soft text-ink border border-line'
                        }`}
                      >
                        {b.tier} Tier
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-ink">{b.name}</h3>
                    <p className="text-xs text-muted mt-0.5">{b.category}</p>

                    {/* Features list */}
                    <div className="my-4 space-y-1.5 text-xs text-ink/80">
                      {isCombined && (
                        <>
                          <div className="flex items-center gap-2">
                            <Disc3 className="w-3.5 h-3.5 text-brand" />
                            <span>Guaranteed Dining Rewards Wheel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-brand" />
                            <span>{b.loyaltyTarget}-Visit Loyalty Stamp Card</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-brand" />
                            <span>AI Google Review Booster</span>
                          </div>
                        </>
                      )}

                      {isLoyalty && (
                        <>
                          <div className="flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-brand" />
                            <span>{b.loyaltyTarget}-Stamp Loyalty Program</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-brand" />
                            <span>Reward: {b.loyaltyReward}</span>
                          </div>
                        </>
                      )}

                      {isSpin && (
                        <>
                          <div className="flex items-center gap-2">
                            <Disc3 className="w-3.5 h-3.5 text-brand" />
                            <span>Guaranteed Zero-Loss Wheel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-brand" />
                            <span>Server PIN Voucher Verification</span>
                          </div>
                        </>
                      )}

                      {isReview && (
                        <>
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-brand" />
                            <span>Guided Star Feedback</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-brand" />
                            <span>Pre-Handoff MongoDB Persistence</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-line flex items-center gap-2">
                    <Link
                      to={customerRoute}
                      className="btn-primary flex-1 py-3 text-xs font-bold"
                    >
                      <span>Open Customer Flow</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>

                    <Link
                      to="/staff/login"
                      className="btn-secondary py-3 px-3 text-xs font-bold"
                      title="Open Staff Terminal"
                    >
                      <Terminal className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Architecture Highlights Footer */}
      <section className="border-t border-line bg-white py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Authoritative Backend</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                The frontend never decides eligibility. Daily resets, compound identity, and guaranteed reward state transitions are enforced server-side.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Zero-Drop State Recovery</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Survives page refreshes, back navigations, and session restarts without re-entering mobile numbers or losing active vouchers.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Guaranteed Instant Rewards</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                No "Try Again" or empty slices. Every spin outcome awards genuine value, protected by staff 4-digit PIN verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
