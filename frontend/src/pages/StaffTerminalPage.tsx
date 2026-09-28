import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  RefreshCw,
  KeyRound,
  TrendingUp,
  AlertTriangle,
  Lock,
  Plus,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Percent,
} from 'lucide-react';
import { useStaffAuth } from '../context/StaffAuthContext.js';
import { StaffLayout } from '../layouts/StaffLayout.js';
import { Button } from '../components/common/Button.js';
import { Loading } from '../components/common/Loading.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { LogoUploader } from '../components/common/LogoUploader.tsx';
import { staffApi, offerApi, brandingApi, OfferData } from '../services/apiServices.js';

export const StaffTerminalPage: React.FC = () => {
  const { token, business, logout } = useStaffAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [terminalData, setTerminalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as any)?.newlyOnboarded
      ? `Welcome aboard ${(location.state as any)?.businessName || 'Merchant'}! Your initial campaign is active.`
      : null
  );

  // Tabs: 'qr' | 'tracker' | 'branding'
  const [activeTab, setActiveTab] = useState<'qr' | 'tracker' | 'branding'>('qr');

  // Dynamic QR State
  const [activeQR, setActiveQR] = useState<{
    qr: any;
    targetUrl: string;
    fullUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Offer Management State
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [offerToActivate, setOfferToActivate] = useState<OfferData | null>(null);
  const [confirmImmutabilityChecked, setConfirmImmutabilityChecked] = useState(false);
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDuration, setNewOfferDuration] = useState(30);

  // Branding State
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | undefined>(undefined);
  const [brandingLogoEmoji, setBrandingLogoEmoji] = useState('🏢');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Fetch terminal data
  const fetchData = async () => {
    if (!token) return;
    try {
      const data = await staffApi.getTerminalData(token);
      setTerminalData(data);
      setBrandingLogoUrl(data.business?.logoUrl);
      setBrandingLogoEmoji(data.business?.logoEmoji || '🏢');
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

  useEffect(() => {
    if (!token) {
      navigate('/staff/login');
      return;
    }
    fetchData();
  }, [token]);

  // Generate dynamic QR
  const handleGenerateQR = async (type: 'combined' | 'spin' | 'loyalty') => {
    if (!token) return;
    setIsGeneratingQR(true);
    try {
      const res = await staffApi.generateQR(token, type, 15);
      const fullUrl = `${window.location.origin}${res.targetUrl}`;

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
  useEffect(() => {
    if (terminalData?.business && !activeQR) {
      const defaultType =
        terminalData.business.tier === 'spin'
          ? 'spin'
          : terminalData.business.tier === 'loyalty'
          ? 'loyalty'
          : 'combined';
      handleGenerateQR(defaultType);
    }
  }, [terminalData?.business]);

  const handleCopyLink = () => {
    if (!activeQR) return;
    navigator.clipboard.writeText(activeQR.fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Offer Actions
  const handleOpenActivateModal = (offer: OfferData) => {
    setOfferToActivate(offer);
    setConfirmImmutabilityChecked(false);
    setShowActivateModal(true);
  };

  const handleConfirmActivation = async () => {
    if (!token || !offerToActivate) return;
    if (!confirmImmutabilityChecked) {
      setError('You must confirm the Offer Immutability Rule before activating.');
      return;
    }

    setIsOfferSubmitting(true);
    try {
      const res = await offerApi.activate(token, offerToActivate.id, true);
      if (res.success) {
        setShowActivateModal(false);
        setOfferToActivate(null);
        setSuccessMessage('Campaign activated! Configuration is now locked and serving live guests.');
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate offer');
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to stop this active campaign? Customers will no longer receive this offer.')) {
      return;
    }

    setIsOfferSubmitting(true);
    try {
      const res = await offerApi.cancel(token, offerId);
      if (res.success) {
        setSuccessMessage('Campaign cancelled. You can now configure and activate a new offer.');
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel offer');
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleCreateDraftOffer = async () => {
    if (!token || !newOfferTitle.trim()) return;
    setIsOfferSubmitting(true);
    try {
      const res = await offerApi.createDraft(token, {
        title: newOfferTitle.trim(),
        durationDays: newOfferDuration,
      });
      if (res.success) {
        setShowNewOfferModal(false);
        setNewOfferTitle('');
        setSuccessMessage('New campaign draft created! You can review and activate it when ready.');
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create draft offer');
    } finally {
      setIsOfferSubmitting(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!token || !terminalData?.business) return;
    setIsSavingBranding(true);
    try {
      const res = await brandingApi.updateBranding(token, terminalData.business.id, {
        logoUrl: brandingLogoUrl,
        logoEmoji: brandingLogoEmoji,
      });
      if (res.success) {
        setSuccessMessage('Brand identity updated! Changes will appear immediately on guest screens.');
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  if (isLoading) {
    return (
      <StaffLayout>
        <Loading message="Initializing Staff Terminal..." subtext="Loading merchant security credentials & active offers" />
      </StaffLayout>
    );
  }

  const biz = terminalData?.business;
  const stats = terminalData?.stats;
  const tier = biz?.tier || 'combined';
  const activeOffer = terminalData?.activeOffer as OfferData | null;
  const allOffers = (terminalData?.offers || []) as OfferData[];

  // Tracker calculations
  const scansCount = activeOffer?.metrics?.scans ?? stats?.activeOfferScans ?? 0;
  const checkinsCount = activeOffer?.metrics?.identifiedGuests ?? stats?.activeOfferIdentified ?? stats?.totalCustomers ?? 0;
  const issuedCount = activeOffer?.metrics?.rewardsIssued ?? stats?.activeOfferRewardsIssued ?? 0;
  const redeemedCount = activeOffer?.metrics?.rewardsRedeemed ?? stats?.activeOfferRewardsRedeemed ?? stats?.totalRewardsRedeemed ?? 0;
  const reviewsCount = activeOffer?.metrics?.reviewsPersisted ?? stats?.activeOfferReviewsPersisted ?? stats?.totalReviewsPersisted ?? 0;

  const checkinRate = scansCount > 0 ? Math.round((checkinsCount / scansCount) * 100) : 100;
  const redemptionRate = issuedCount > 0 ? Math.round((redeemedCount / issuedCount) * 100) : 0;

  return (
    <StaffLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand/20 flex items-center justify-center text-3xl shadow-xs overflow-hidden">
              {biz?.logoUrl ? (
                <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{biz?.logoEmoji || '🏢'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-ink">{biz?.name}</h1>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-dark">
                  {tier} Tier
                </span>
                {activeOffer ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Campaign Active
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    No Active Offer
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{biz?.category} • Timezone: {biz?.timezone}</p>
            </div>
          </div>

          {/* Quick Staff PIN Reference & Security Lockout Notice */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
            <KeyRound className="w-4 h-4 text-amber-700" />
            <div>
              <span className="block text-[10px] uppercase text-amber-700 font-bold">Voucher Server PIN</span>
              <span className="text-base font-black font-mono">
                {biz?.slug === 'rustic-fork'
                  ? '1234'
                  : biz?.slug === 'brew-co'
                  ? '2468'
                  : biz?.slug === 'velvet-lounge'
                  ? '7777'
                  : '9999'}
              </span>
            </div>
            <div className="border-l border-amber-200 pl-3 hidden sm:block">
              <span className="block text-[9px] uppercase text-amber-600 font-bold">Fraud Guard</span>
              <span className="text-[10px] text-amber-800 font-normal">5-attempt lockout</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white border border-line rounded-2xl p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Customer QR & NFC Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Campaign Tracker & Offers</span>
            {activeOffer && (
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Logo & Merchant Branding</span>
          </button>
        </div>

        {/* Global Notifications */}
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 font-bold ml-2 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: DYNAMIC QR & LIVE REDEMPTIONS */}
        {activeTab === 'qr' && (
          <>
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-xs font-semibold">Total Guests</span>
                  <Users className="w-4 h-4 text-brand" />
                </div>
                <span className="text-2xl font-black text-ink">{stats?.totalCustomers || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-xs font-semibold">Rewards Claimed</span>
                  <CheckCircle2 className="w-4 h-4 text-brand" />
                </div>
                <span className="text-2xl font-black text-ink">{stats?.totalRewardsRedeemed || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-xs font-semibold">Pending Vouchers</span>
                  <Gift className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-2xl font-black text-amber-600">
                  {stats?.activeVouchersWaiting || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-line shadow-xs">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-xs font-semibold">Reviews Stored</span>
                  <Star className="w-4 h-4 text-brand" />
                </div>
                <span className="text-2xl font-black text-ink">{stats?.totalReviewsPersisted || 0}</span>
              </div>
            </div>

            {/* QR Generation & Live Display Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Terminal Actions according to Merchant Tier */}
              <div className="lg:col-span-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-ink mb-1">Generate Customer QR Code</h2>
                <p className="text-xs text-muted mb-5">
                  Select which customer engagement experience to present at the table or counter.
                </p>

                <div className="flex flex-col gap-3">
                  {tier === 'combined' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleGenerateQR('combined')}
                        disabled={isGeneratingQR}
                        className="p-4 rounded-2xl border-2 border-brand/30 bg-brand-soft/40 hover:bg-brand-soft text-left transition-all cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-ink">Generate Combined QR</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand text-white">
                              Primary
                            </span>
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
                        className="p-4 rounded-2xl border border-line bg-surface-soft hover:bg-white text-left transition-all cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white text-brand border border-line flex items-center justify-center shrink-0 shadow-xs">
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

                {/* Refresh Live Metrics */}
                <div className="mt-6 pt-4 border-t border-line">
                  <Button variant="secondary" onClick={fetchData} className="w-full py-2.5 mb-4 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh Terminal Stats
                  </Button>
                </div>
                <Button variant="primary" className="w-full py-2.5 text-xs">
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy NFC Code
                </Button>
                
              </div>

              {/* Right: Active Dynamic QR Terminal Card */}
              <div className="lg:col-span-6 rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>15-Min TTL Dynamic QR</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
                    Active & Unlocked
                  </span>
                </div>

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

                <div className="w-full mt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="flex-1 py-3 text-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-brand" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        <span>Copy Customer Link</span>
                      </>
                    )}
                  </Button>

                  {activeQR && (
                    <a
                      href={activeQR.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1 py-3 text-xs font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <span>Open as Guest</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
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
          </>
        )}

        {/* TAB 2: CAMPAIGN TRACKER & OFFER LIFECYCLE */}
        {activeTab === 'tracker' && (
          <div className="flex flex-col gap-6">
            {/* Active Offer Hero Card */}
            {activeOffer ? (
              <div className="rounded-3xl border-2 border-brand/30 bg-white p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-line">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Active Offer
                      </span>
                      <span className="text-xs font-mono text-muted">ID: {activeOffer.id}</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-ink mt-1">{activeOffer.title}</h2>
                    {activeOffer.description && (
                      <p className="text-xs text-muted">{activeOffer.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      onClick={() => handleCancelOffer(activeOffer.id)}
                      disabled={isOfferSubmitting}
                      className="py-2 px-3 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel Campaign
                    </Button>
                  </div>
                </div>

                {/* Immutability Banner */}
                <div className="p-3 bg-brand-soft/50 border border-brand/20 rounded-2xl flex items-center gap-2.5 text-xs text-brand-dark">
                  <Lock className="w-4 h-4 text-brand shrink-0" />
                  <span>
                    <strong>Strict Immutability Enforced:</strong> This offer configuration is locked and served to all live customers.
                    To modify slice weights or rewards, you must cancel and launch a new campaign draft.
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wheel Slices if spin/combined */}
                  {(tier === 'spin' || tier === 'combined') && (
                    <div className="p-4 bg-surface-soft border border-line rounded-2xl">
                      <span className="text-xs font-bold text-ink block mb-2">Live Wheel Slices & Weights</span>
                      <div className="flex flex-col gap-1.5">
                        {(activeOffer.spinWheelConfiguration || biz?.spinWheelConfiguration || []).map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-xl border border-line/60">
                            <span className="font-semibold text-ink flex items-center gap-1.5">
                              <span>{s.emoji}</span>
                              <span>{s.rewardLabel}</span>
                            </span>
                            <span className="font-mono font-bold text-brand">{s.weight}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loyalty Target if loyalty/combined */}
                  {(tier === 'loyalty' || tier === 'combined') && (
                    <div className="p-4 bg-surface-soft border border-line rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink block mb-1">Loyalty Milestone Rule</span>
                        <div className="mt-2 p-3 bg-white border border-line rounded-xl">
                          <span className="text-[11px] text-muted block uppercase font-bold">Target Visits</span>
                          <span className="text-xl font-black text-brand">{activeOffer.loyaltyTarget || biz?.loyaltyTarget || 5} Visits</span>
                          <span className="text-[11px] text-muted block mt-2 uppercase font-bold">Unlocked Reward</span>
                          <span className="text-xs font-semibold text-ink">{activeOffer.loyaltyReward || biz?.loyaltyReward}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-line bg-white p-8 shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-ink mb-1">No Active Offer Running</h3>
                <p className="text-xs text-muted max-w-sm mb-4">
                  Your establishment currently has no active campaign. Guests will see the default menu experience until an offer is activated.
                </p>
                <Button onClick={() => setShowNewOfferModal(true)} className="py-2.5 px-4 text-xs font-bold">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Campaign Draft
                </Button>
              </div>
            )}

            {/* Campaign Offer History & Drafts */}
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">Offer History & Drafts</h3>
                  <p className="text-xs text-muted">Create, activate, or audit previous campaigns</p>
                </div>
                <Button onClick={() => setShowNewOfferModal(true)} className="py-2 px-3 text-xs font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Draft
                </Button>
              </div>

              <div className="flex flex-col divide-y divide-line">
                {allOffers.map((off) => (
                  <div key={off.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{off.title}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            off.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : off.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-surface-soft text-muted'
                          }`}
                        >
                          {off.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted block mt-0.5">
                        Duration: {off.durationDays} days • Created {new Date(off.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {off.status === 'draft' && (
                        <Button
                          onClick={() => handleOpenActivateModal(off)}
                          className="py-1.5 px-3 text-xs h-auto"
                        >
                          Activate Campaign
                        </Button>
                      )}
                      {off.status === 'active' && (
                        <Button
                          variant="danger"
                          onClick={() => handleCancelOffer(off.id)}
                          className="py-1.5 px-2.5 text-xs h-auto"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOGO & MERCHANT BRANDING */}
        {activeTab === 'branding' && (
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-6 max-w-xl mx-auto w-full">
            <div>
              <h2 className="text-base font-bold text-ink">Merchant Branding & Logo</h2>
              <p className="text-xs text-muted">
                Customize the visual identity guests see when scanning your QR or NFC tags
              </p>
            </div>

            <LogoUploader
  currentLogoUrl={brandingLogoUrl}
  currentEmoji={brandingLogoEmoji}
  onLogoChange={({ logoUrl, logoEmoji }: { logoUrl?: string; logoEmoji?: string }) => {
    if (logoUrl !== undefined) setBrandingLogoUrl(logoUrl);
    if (logoEmoji !== undefined) setBrandingLogoEmoji(logoEmoji);
  }}
/>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button
                onClick={handleSaveBranding}
                disabled={isSavingBranding}
                className="py-2.5 px-6 text-xs font-bold"
              >
                {isSavingBranding ? 'Saving Changes...' : 'Save Brand Identity'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM ACTIVATION MODAL (Strict Immutability Rule) */}
      {showActivateModal && offerToActivate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-line rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink">Confirm Campaign Activation</h3>
                <span className="text-xs font-bold text-amber-700 uppercase">Strict Immutability Notice</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed flex flex-col gap-2">
              <p>
                <strong>Important Audit Constraint:</strong> Once this offer (<em>{offerToActivate.title}</em>) is activated, its reward slices, weights, and loyalty targets become <strong>strictly immutable</strong>.
              </p>
              <p>
                They cannot be edited while active to preserve audit integrity and fairness. To adjust parameters later, you will need to cancel this offer and create a new campaign.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-ink font-semibold">
              <input
                type="checkbox"
                checked={confirmImmutabilityChecked}
                onChange={(e) => setConfirmImmutabilityChecked(e.target.checked)}
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <span>I confirm that these rewards and probabilities are correct and accept the immutability lock.</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowActivateModal(false);
                  setOfferToActivate(null);
                }}
                className="py-2 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmActivation}
                disabled={!confirmImmutabilityChecked || isOfferSubmitting}
                className="py-2 px-5 text-xs font-bold"
              >
                {isOfferSubmitting ? 'Locking & Activating...' : 'Confirm & Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW OFFER DRAFT MODAL */}
      {showNewOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-line rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink">Create New Campaign Draft</h3>
                <p className="text-xs text-muted">Prepare a new reward offer for activation</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Weekend Dining Rewards"
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface-soft p-3 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={newOfferDuration}
                  onChange={(e) => setNewOfferDuration(Math.max(1, Number(e.target.value) || 30))}
                  className="w-full rounded-2xl border border-line bg-surface-soft p-3 text-xs font-semibold"
                  min={1}
                  max={365}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => setShowNewOfferModal(false)}
                className="py-2 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDraftOffer}
                disabled={!newOfferTitle.trim() || isOfferSubmitting}
                className="py-2 px-5 text-xs font-bold"
              >
                {isOfferSubmitting ? 'Creating...' : 'Create Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};
