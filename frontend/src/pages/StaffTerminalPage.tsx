import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  QrCode,
  Disc3,
  Award,
  Star,
  Users,
  CheckCircle2,
  Gift,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Plus,
} from 'lucide-react';
import { useStaffAuth } from '../context/StaffAuthContext.js';
import { StaffLayout } from '../layouts/StaffLayout.js';
import { Button } from '../components/common/Button.js';
import { Loading } from '../components/common/Loading.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { staffApi } from '../services/apiServices.js';

export const StaffTerminalPage: React.FC = () => {
  const { token, business, logout } = useStaffAuth();
  const navigate = useNavigate();

  const [terminalData, setTerminalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic QR State
  const [activeQR, setActiveQR] = useState<{
    qr: any;
    targetUrl: string;
    fullUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch terminal data
  const fetchData = async () => {
    if (!token) return;
    try {
      const data = await staffApi.getTerminalData(token);
      setTerminalData(data);
      setError(null);
    } catch (err: any) {
      if (err.statusCode === 401) {
        logout();
        navigate('/staff/login');
      } else {
        setError(err.message || 'Failed to fetch terminal data');
      }
    } finally {
      setIsLoading(false);
    }
  };

// The repeating requests to /api/staff/terminal-data and page flicker will stop immediately.

 const hasFetchedData = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate('/staff/login');
      return;
    }
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchData();
    }
  }, [token]);

  // Generate dynamic QR
  // Update this line:
const handleGenerateQR = async (type: 'combined' | 'spin' | 'loyalty' | 'spin-review' | 'loyalty-review' | 'review') => {
    if (!token) return;
    setIsGeneratingQR(true);
    try {
      const res = await staffApi.generateQR(token, type as 'combined' | 'spin' | 'loyalty', 15);
      const fullUrl = `${window.location.origin}${res.targetUrl}`;

      // Generate visual QR data URL using qrcode package
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#10181c',
          light: '#ffffff',
        },
      });

      setActiveQR({
        qr: res.qr,
        targetUrl: res.targetUrl,
        fullUrl,
        qrDataUrl,
      });
    } catch (err: any) {
      setError(err.message || 'QR generation failed');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Generate initial QR on load if none exists
// Generate initial QR on load if none exists
  const hasGeneratedInitialQR = useRef(false);

  useEffect(() => {
    if (terminalData?.business && !activeQR && !hasGeneratedInitialQR.current) {
      hasGeneratedInitialQR.current = true;
      const defaultType =
        terminalData.business.tier === 'spin'
          ? 'spin'
          : terminalData.business.tier === 'loyalty'
          ? 'loyalty'
          : terminalData.business.tier === 'spin-review'
          ? 'spin-review'
          : terminalData.business.tier === 'loyalty-review'
          ? 'loyalty-review'
          : 'loyalty'; // Changed from 'combined' so it defaults to Loyalty for Combined tier
      handleGenerateQR(defaultType);
    }
  }, [terminalData?.business]);

  const handleCopyLink = () => {
    if (!activeQR) return;
    navigator.clipboard.writeText(activeQR.fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <StaffLayout>
        <Loading message="Initializing Staff Terminal..." subtext="Loading merchant security credentials" />
      </StaffLayout>
    );
  }

  const biz = terminalData?.business;
  const stats = terminalData?.stats;
  const tier = biz?.tier || 'combined';

  return (
    <StaffLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header Card */}
        {/* Top Header Card */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand/20 flex items-center justify-center text-3xl shadow-xs shrink-0">
              {biz?.logoEmoji || '🏢'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-ink">{biz?.name}</h1>
              <p className="text-xs text-muted mt-0.5">{biz?.category} • Timezone: {biz?.timezone}</p>
            </div>
          </div>

          {/* Badges & PIN Reference */}
          <div className="flex flex-row flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            {/* Unified Tier Badge */}
            <div className="flex items-center justify-center px-4 py-2.5 rounded-2xl bg-brand-soft text-brand-dark text-xs font-bold uppercase border border-brand/20">
              {tier} Tier
            </div>

            {/* Quick Staff PIN Reference */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex-1 md:flex-none justify-center md:justify-start">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase text-amber-700 font-bold">Server Voucher PIN</span>
                <span className="text-base font-black font-mono leading-tight">
                  {biz?.slug === 'rustic-fork'
                    ? '1234'
                    : biz?.slug === 'brew-co'
                    ? '2468'
                    : biz?.slug === 'velvet-lounge'
                    ? '7777'
                    : '9999'}
                </span>
              </div>
            </div>
          </div>
        </div>

{/* MOBILE VERSION: All-in-One Panel Box enclosing the 2x2 grid and refresh button */}
<div className="block md:hidden bg-white border border-line rounded-3xl p-6 shadow-sm">
  <div className="grid grid-cols-2 gap-2 mb-2.5">
    <div className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-[10px] font-semibold">Total Guests</span>
        <Users className="w-3.5 h-3.5 text-brand" />
      </div>
      <span className="text-lg font-black text-ink">{stats?.totalCustomers || 0}</span>
    </div>

    <div className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-[10px] font-semibold">Claimed</span>
        <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
      </div>
      <span className="text-lg font-black text-ink">{stats?.totalRewardsRedeemed || 0}</span>
    </div>

    <div className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-[10px] font-semibold">Pending</span>
        <Gift className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <span className="text-lg font-black text-amber-600">
        {stats?.activeVouchersWaiting || 0}
      </span>
    </div>

    <div className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-[10px] font-semibold">Reviews</span>
        <Star className="w-3.5 h-3.5 text-brand" />
      </div>
      <span className="text-lg font-black text-ink">{stats?.totalReviewsPersisted || 0}</span>
    </div>
  </div>

  {/* Horizontal Rectangular Refresh Button Inside the Same Box */}
  <button 
    onClick={fetchData}
    className="w-full py-2.5 px-3 bg-brand hover:bg-brand-soft text-white rounded-2xl font-medium text-md flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
  >
    <RefreshCw className="w-3.5 h-8" />
    <span>Refresh Stats</span>
  </button>
</div>

{/* DESKTOP VERSION: Single Panel Box with Icon-Only Button on Right */}
<div className="hidden md:flex bg-white border border-line rounded-3xl p-6 sm:p-5 items-center justify-between gap-3 shadow-sm">
  <div className="grid grid-cols-4 gap-3 flex-1">
    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-xs font-semibold">Total Guests</span>
        <Users className="w-4 h-4 text-brand" />
      </div>
      <span className="text-xl font-black text-ink">{stats?.totalCustomers || 0}</span>
    </div>

    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-xs font-semibold">Claimed</span>
        <CheckCircle2 className="w-4 h-4 text-brand" />
      </div>
      <span className="text-xl font-black text-ink">{stats?.totalRewardsRedeemed || 0}</span>
    </div>

    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-xs font-semibold">Pending</span>
        <Gift className="w-4 h-4 text-amber-600" />
      </div>
      <span className="text-xl font-black text-amber-600">
        {stats?.activeVouchersWaiting || 0}
      </span>
    </div>

    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-muted mb-0.5">
        <span className="text-xs font-semibold">Reviews</span>
        <Star className="w-4 h-4 text-brand" />
      </div>
      <span className="text-xl font-black text-ink">{stats?.totalReviewsPersisted || 0}</span>
    </div>
  </div>

  <button 
    onClick={fetchData}
    title="Refresh Status"
    className="shrink-0 w-14 h-14 bg-brand hover:bg-brand-soft text-white rounded-2xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
  >
    <RefreshCw className="w-5 h-5" />
  </button>
</div>

{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}


        {/* QR Generation & Live Display Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Terminal Actions according to Merchant Tier */}
          <div className="lg:col-span-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink mb-1">Generate Customer QR Code</h2>
            <p className="text-xs text-muted mb-5">
              Select which customer engagement experience to present at the table or counter.
            </p>

            <div className="flex flex-col gap-3">
              {/* Combined Tier Actions */}
              {tier === 'combined' && (
              <>
                  <button
                    type="button"
                    onClick={() => handleGenerateQR('combined')}
                    disabled={isGeneratingQR}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 ${
                      activeQR?.qr?.type === 'combined'
                        ? 'border-2 border-brand/30 bg-brand-soft/40 hover:bg-brand-soft'
                        : 'border border-line bg-surface-soft hover:bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      activeQR?.qr?.type === 'combined'
                        ? 'bg-brand text-white'
                        : 'bg-white text-brand border border-line'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">Generate Combined QR</span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Full journey: Spin & Win → Digital Loyalty Stamp → Google Review Booster.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateQR('loyalty')}
                    disabled={isGeneratingQR}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 ${
                      activeQR?.qr?.type === 'loyalty'
                        ? 'border-2 border-brand/30 bg-brand-soft/40 hover:bg-brand-soft'
                        : 'border border-line bg-surface-soft hover:bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      activeQR?.qr?.type === 'loyalty'
                        ? 'bg-brand text-white'
                        : 'bg-white text-brand border border-line'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-ink">Generate Instant Loyalty QR</span>
                      <p className="text-xs text-muted mt-1">
                        Skips spin and takes guest straight to visit stamp & review.
                      </p>
                    </div>
                  </button>
                </>
              )}

              {/* Spin Tier Action */}
              {tier === 'spin' && (
                <button
                  type="button"
                  onClick={() => handleGenerateQR('spin')}
                  disabled={isGeneratingQR}
                  className="p-4 rounded-2xl border-2 border-brand bg-brand-soft text-left transition-all cursor-pointer flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                    <Disc3 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink">Generate Spin & Win QR</span>
                    <p className="text-xs text-muted mt-1">
                      Guaranteed dining rewards wheel with staff PIN protection.
                    </p>
                  </div>
                </button>
              )}

              {/* Loyalty Tier Action */}
              {tier === 'loyalty' && (
                <button
                  type="button"
                  onClick={() => handleGenerateQR('loyalty')}
                  disabled={isGeneratingQR}
                  className="p-4 rounded-2xl border-2 border-brand bg-brand-soft text-left transition-all cursor-pointer flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink">Generate Digital Loyalty QR</span>
                    <p className="text-xs text-muted mt-1">
                      Daily visit tracking with milestone reward unlocked at {biz?.loyaltyTarget} visits.
                    </p>
                  </div>
                </button>
              )}

              {/* Spin + Review Tier Action */}
              {tier === 'spin-review' && (
                <button
                  type="button"
                  onClick={() => handleGenerateQR('spin-review')}
                  disabled={isGeneratingQR}
                  className="p-4 rounded-2xl border-2 border-brand bg-brand-soft text-left transition-all cursor-pointer flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                    <Disc3 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink">Generate Spin & Review QR</span>
                    <p className="text-xs text-muted mt-1">
                      Spins the wheel for guaranteed dining rewards followed immediately by the AI Google Review Booster.
                    </p>
                  </div>
                </button>
              )}

              {/* Loyalty + Review Tier Action */}
              {tier === 'loyalty-review' && (
                <button
                  type="button"
                  onClick={() => handleGenerateQR('loyalty-review')}
                  disabled={isGeneratingQR}
                  className="p-4 rounded-2xl border-2 border-brand bg-brand-soft text-left transition-all cursor-pointer flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink">Generate Loyalty & Review QR</span>
                    <p className="text-xs text-muted mt-1">
                      Tracks daily store visits toward milestone rewards followed immediately by the AI Google Review Booster.
                    </p>
                  </div>
                </button>
              )}

              {/* Review Tier Destination */}
              {tier === 'review' && (
                <div className="p-4 rounded-2xl border border-brand bg-brand-soft flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink">Review Booster Station Active</span>
                    <p className="text-xs text-muted mt-1">
                      Guides guests through ratings, AI drafts, and saves review records before Google handoff.
                    </p>
                  </div>
                </div>
              )}
            </div>

         {/* Left Panel Footer / Actions */}
<div className="mt-10 pt-5 border-t border-line flex flex-col gap-3">
  <Button variant="primary" onClick={() => {}} className="w-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1">
    <Plus className="w-3.5 h-3.5 mr-1" />
    Create offer
  </Button>

  <Button variant="secondary" onClick={() => {}} className="w-full py-2.5 text-xs">
    <span>Show Offer</span>
  </Button>
</div>

</div>

{/* Right: Active Dynamic QR Terminal Card */}
<div className="lg:col-span-6 rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col items-center text-center">
  <div className="w-full flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
      <Clock className="w-3.5 h-3.5 text-brand" />
      <span>15-Min TTL Dynamic QR</span>
    </div>

    {/* Active & Unlocked Aligned in the Center Top */}
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
      Active & Unlocked
    </span>

    {/* Copy Link Icon Button in Top Right Corner as Brand Green Rounded Square */}
    <button
      onClick={handleCopyLink}
      disabled={!activeQR}
      title="Copy Link"
      className="w-8 h-8 bg-brand hover:bg-brand-soft text-white rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
    >
      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  </div>

  {/* QR Code Canvas / Image Display */}
  {activeQR?.qrDataUrl ? (
    <div className="p-3 bg-white rounded-2xl border-2 border-line shadow-xs my-2 flex flex-col items-center">
      <img
        src={activeQR.qrDataUrl}
        alt="Dynamic Customer QR Code"
        className="w-56 h-56 rounded-lg object-contain"
      />
      <div className="mt-2 text-[11px] font-mono text-muted">
        Token: {activeQR.qr.key.slice(0, 16)}…
      </div>
    </div>
  ) : (
    <div className="w-56 h-56 rounded-2xl bg-surface-soft border border-line flex items-center justify-center text-xs text-muted">
      Generating QR...
    </div>
  )}

  <p className="text-xs text-muted mt-2 max-w-xs">
    Guest scans this QR code to check in. It automatically locks to the first customer who activates it.
  </p>

  {/* Bottom Actions: Open as Guest & Refresh QR */}
  <div className="w-full mt-4 flex flex-col sm:flex-row gap-2">
    {activeQR ? (
      <a
        href={activeQR.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary flex-1 py-3 text-xs inline-flex items-center justify-center gap-1"
      >
        <span>Open as Guest</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    ) : (
      <Button variant="secondary" disabled className="flex-1 py-3 text-xs">
        <span>Open as Guest</span>
      </Button>
    )}

    <Button
      onClick={() => activeQR?.qr?.type && handleGenerateQR(activeQR.qr.type)}
      disabled={isGeneratingQR || !activeQR}
      className="flex-1 py-3 text-xs"
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${isGeneratingQR ? 'animate-spin' : ''}`} />
      <span>Refresh QR</span>
    </Button>
  </div>
</div>
</div>

        {/* Recent Activity Audit Table */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-ink mb-3">Recent Vouchers & Redemptions</h2>
          {terminalData?.recentRewards && terminalData.recentRewards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted font-bold">
                    <th className="pb-3">Voucher Code</th>
                    <th className="pb-3">Reward Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {terminalData.recentRewards.map((rew: any) => (
                    <tr key={rew.id} className="py-2.5">
                      <td className="py-2.5 font-mono font-bold text-brand">{rew.code}</td>
                      <td className="py-2.5 font-semibold text-ink">{rew.title}</td>
                      <td className="py-2.5 uppercase font-bold text-[10px] text-muted">{rew.type}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            rew.status === 'redeemed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rew.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted">
                        {rew.redeemedAt
                          ? new Date(rew.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted">No vouchers redeemed yet today.</p>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};
