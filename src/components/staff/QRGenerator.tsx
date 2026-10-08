import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, RefreshCw, ExternalLink, Copy, Check, Radio, Smartphone, X, Zap, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { CustomerEntryPage } from '../../pages/CustomerEntryPage';
import { staffApi } from '../../services/staffApi';
import { copyToClipboard } from '../../utils/clipboard';
import { safeSessionStorage } from '../../utils/safeStorage';

interface EntryItem {
  id: string;
  entryType: string;
  label: string;
  permanentCode: string;
  customerUrl: string;
  qrDataUrl: string;
  sessionKey?: string;
  expiresAt?: string;
}

interface QRGeneratorProps {
  entries: EntryItem[];
  businessName: string;
  businessSlug?: string;
  businessTier?: string;
  sessionToken?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  entries,
  businessName,
  businessSlug,
  businessTier,
  sessionToken,
}) => {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [clientQrDataUrl, setClientQrDataUrl] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [entryOverrides, setEntryOverrides] = useState<Record<string, { customerUrl: string; qrDataUrl: string; sessionKey: string; expiresAt?: string }>>({});
  const [countdownSeconds, setCountdownSeconds] = useState<number>(900); // 15:00 = 900 seconds

  if (entries.length === 0) return null;
  const rawEntry = entries[selectedEntryIndex] || entries[0];
  const override = entryOverrides[rawEntry.id];
  const currentEntry: EntryItem = override
    ? {
        ...rawEntry,
        customerUrl: override.customerUrl,
        qrDataUrl: override.qrDataUrl,
        sessionKey: override.sessionKey,
        expiresAt: override.expiresAt,
      }
    : rawEntry;

  const isDynamicQr = currentEntry.entryType === 'merchant_qr';
  const isExpressLoyalty = currentEntry.entryType === 'loyalty' || currentEntry.entryType === 'instant_loyalty';
  const isPhysicalNfc = !isDynamicQr && !isExpressLoyalty;

  // Resolve business slug
  const slug = businessSlug || (currentEntry as any).businessSlug || 'bella-napoli';

  // Compute effective path and full URL using current window.location.origin
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Dynamic QR preserves the 15-minute unique session key query param (?sk=...)
  // Permanent physical NFC tags point to the permanent /api/entry/tap/:slug endpoint
  let customerPath: string;
  if (isDynamicQr) {
    const queryStr = currentEntry.customerUrl?.includes('?')
      ? currentEntry.customerUrl.slice(currentEntry.customerUrl.indexOf('?'))
      : (currentEntry.sessionKey ? `?sk=${currentEntry.sessionKey}` : '');
    customerPath = `/c/${slug}/v${queryStr}`;
  } else if (isExpressLoyalty) {
    customerPath = `/api/entry/tap/${slug}?mode=loyalty`;
  } else {
    customerPath = `/api/entry/tap/${slug}`;
  }

  const effectiveCustomerUrl = origin ? `${origin}${customerPath}` : currentEntry.customerUrl;

  // Generate clean client-side QR matching the real browser origin
  useEffect(() => {
    let isMounted = true;
    if (effectiveCustomerUrl) {
      QRCode.toDataURL(effectiveCustomerUrl, {
        margin: 1,
        width: 280,
        color: { dark: '#0e7c66', light: '#ffffff' },
      })
        .then(url => {
          if (isMounted) setClientQrDataUrl(url);
        })
        .catch(() => {
          if (isMounted) setClientQrDataUrl(currentEntry.qrDataUrl);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveCustomerUrl, currentEntry.qrDataUrl]);

  // Countdown timer for 15-minute Dynamic QR with Safari visibility re-sync
  useEffect(() => {
    if (!isDynamicQr) return;

    const computeRemainingSeconds = () => {
      if (currentEntry.expiresAt) {
        const diff = Math.ceil((new Date(currentEntry.expiresAt).getTime() - Date.now()) / 1000);
        return Math.max(0, Math.min(900, diff));
      }
      return 900;
    };

    setCountdownSeconds(computeRemainingSeconds());

    const timer = setInterval(() => {
      setCountdownSeconds(computeRemainingSeconds());
    }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setCountdownSeconds(computeRemainingSeconds());
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [currentEntry.id, currentEntry.sessionKey, currentEntry.expiresAt, isDynamicQr]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(effectiveCustomerUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshQr = async () => {
    setIsRefreshing(true);
    try {
      const token = sessionToken || safeSessionStorage.getItem('seyo_staff_session') || '';
      const res = await staffApi.refreshQr(token, currentEntry.id);
      if (res.success) {
        setEntryOverrides(prev => ({
          ...prev,
          [currentEntry.id]: {
            customerUrl: res.customerUrl,
            qrDataUrl: res.qrDataUrl,
            sessionKey: res.sessionKey,
            expiresAt: res.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
        }));
        // Reset countdown timer to 15:00 immediately
        setCountdownSeconds(900);
        if (origin) {
          const newPath = `/c/${slug}/v?sk=${res.sessionKey}`;
          const newUrl = `${origin}${newPath}`;
          try {
            const newQr = await QRCode.toDataURL(newUrl, {
              margin: 1,
              width: 280,
              color: { dark: '#0e7c66', light: '#ffffff' },
            });
            setClientQrDataUrl(newQr);
          } catch {
            setClientQrDataUrl(res.qrDataUrl);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh QR:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const qrToDisplay = clientQrDataUrl || currentEntry.qrDataUrl;

  return (
    <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 text-left space-y-5">
      {/* Header and Entry Option Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e7e6]">
        <div>
          <h3 className="text-base font-bold text-[#10181c] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#0e7c66]" />
            <span>Hardware & Digital Entry Points</span>
          </h3>
          <p className="text-xs text-[#6a787e]">
            {businessTier === 'combined'
              ? 'Select between Dynamic Counter QR, Physical NFC Tag, or Express Loyalty NFC Tag.'
              : 'Customers scan or tap these hardware identifiers to launch their daily engagement.'}
          </p>
        </div>

        {/* 3 Entry Selector Tabs for Combined Tier */}
        {entries.length > 1 && (
          <div className="flex items-center gap-1.5 bg-[#f1f3f2] p-1.5 rounded-2xl overflow-x-auto">
            {entries.map((ent, idx) => {
              const isEntQr = ent.entryType === 'merchant_qr';
              const isEntExpress = ent.entryType === 'loyalty' || ent.entryType === 'instant_loyalty';
              return (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => {
                    setSelectedEntryIndex(idx);
                    setCopied(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedEntryIndex === idx
                      ? 'bg-white text-[#0e7c66] shadow-xs'
                      : 'text-[#6a787e] hover:text-[#10181c]'
                  }`}
                >
                  {isEntQr ? (
                    <QrCode className="w-3.5 h-3.5" />
                  ) : isEntExpress ? (
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Radio className="w-3.5 h-3.5" />
                  )}
                  <span>{ent.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Entry Option Banner with Journey Flow Summary */}
      <div className="bg-[#f8faf9] rounded-2xl p-4 border border-[#e2e7e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isDynamicQr
                  ? 'bg-emerald-100 text-emerald-800'
                  : isExpressLoyalty
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {isDynamicQr
                ? '15-Minute Dynamic QR'
                : isExpressLoyalty
                ? 'Permanent NFC • entryType: loyalty'
                : 'Permanent NFC • entryType: combined'}
            </span>
            <span className="font-semibold text-[#10181c]">{currentEntry.label}</span>
          </div>
          <p className="text-[#6a787e]">
            {isDynamicQr && 'Counter printed QR card. Session key valid for 15 minutes. Automatically claims on number entry.'}
            {isPhysicalNfc && 'Permanent physical NFC tag for customer counters/tables. Full combined journey.'}
            {isExpressLoyalty && 'Second permanent NFC tag for fast-track loyalty stamps. Completely skips the Spin stage.'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-[#0e7c66] bg-white px-3 py-1.5 rounded-xl border border-[#e2e7e6] shrink-0">
          <span className="text-[#6a787e] font-semibold">Flow:</span>
          {isExpressLoyalty ? (
            <span className="flex items-center gap-1 text-amber-700">
              <strong>Loyalty</strong> <ArrowRight className="w-3 h-3 inline" /> <strong>Review</strong>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <strong>Spin</strong> <ArrowRight className="w-3 h-3 inline" /> <strong>Loyalty</strong> <ArrowRight className="w-3 h-3 inline" /> <strong>Review</strong>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* QR Visual Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#f1f3f2]/60 rounded-3xl border border-[#e2e7e6] text-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#e2e7e6] mb-3">
            {qrToDisplay ? (
              <img
                src={qrToDisplay}
                alt="QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-[#6a787e] text-xs">
                Generating QR...
              </div>
            )}
          </div>

          {/* 15-Minute Countdown Timer directly below the QR code for Dynamic QR */}
          {isDynamicQr && (
            <div className="mb-3 px-3.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-1.5 text-xs text-amber-900 font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>
                Expires in <strong className="font-mono font-bold tracking-wider">{formatCountdown(countdownSeconds)}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#10181c] bg-white px-3 py-1 rounded-full border border-[#e2e7e6]">
              {currentEntry.permanentCode}
            </span>
          </div>
          <p className="text-xs text-[#6a787e] mt-1.5 font-medium">{currentEntry.label}</p>
        </div>

        {/* Details & Actions */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6a787e]">
              {isDynamicQr ? 'Destination Customer URL (Short-Lived Key)' : 'Permanent NFC Destination URL'}
            </span>
            <div className="mt-1 flex items-center gap-2 bg-[#f8faf9] p-3 rounded-2xl border border-[#e2e7e6]">
              <span className="text-xs font-mono text-[#10181c] truncate flex-1" title={effectiveCustomerUrl}>
                {effectiveCustomerUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1.5 text-[#0e7c66] hover:bg-[#e2f1ec] rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#e2f1ec]/60 border border-[#0e7c66]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0e7c66]">
              <Radio className="w-4 h-4" />
              <span>
                {isDynamicQr ? 'Dynamic Counter QR Instruction' : isExpressLoyalty ? 'Express Loyalty NFC Tag Instruction' : 'Physical NFC Tag Instruction'}
              </span>
            </div>
            <p className="text-[11px] text-[#0a6252] leading-relaxed">
              {isDynamicQr && 'Keep this QR displayed at the front counter. Valid for 15 minutes. Use "Refresh QR" to generate a fresh unique session code.'}
              {isPhysicalNfc && 'Program physical NTAG213/215 stickers with the permanent URL above. When tapped, a fresh customer session is generated automatically.'}
              {isExpressLoyalty && 'Program express loyalty NTAG213/215 stickers with the permanent URL above. Customers tap to stamp loyalty and review directly, skipping spin.'}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isDynamicQr ? (
              // Option 1: Dynamic QR shows Refresh QR button
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshQr}
                isLoading={isRefreshing}
                className="gap-2 flex-1 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh QR</span>
              </Button>
            ) : (
              // Options 2 & 3: Physical NFC & Express Loyalty NFC show Copy NFC URL button
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2 flex-1 cursor-pointer bg-[#0e7c66] hover:bg-[#0a6252] text-white shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied NFC URL!' : 'Copy NFC URL'}</span>
              </Button>
            )}

            {/* Test Live Screen Button - Opens Interactive Mobile Simulator Modal */}
            <Button
              type="button"
              variant={isDynamicQr ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              className="gap-2 flex-1 shadow-xs cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Test Live Screen</span>
            </Button>
          </div>

          <div className="text-right">
            <a
              href={customerPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#0e7c66] font-semibold hover:underline"
            >
              <span>Open in new browser tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Mobile Device Simulator Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsPreviewModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
            {/* Phone Header Bar with Close and Direct Link */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  {isExpressLoyalty ? 'Express Loyalty Simulator' : 'Live Device Simulator'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={customerPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                  title="Open full page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
                  title="Close Simulator"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="w-full h-[650px] max-h-[85vh] bg-[#f1f3f2] rounded-[40px] border-[8px] border-[#10181c] shadow-2xl overflow-hidden flex flex-col relative">
              {/* Notch */}
              <div className="w-28 h-4 bg-[#10181c] rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-30" />

              {/* Live Interactive Customer Page Component */}
              <div className="flex-1 overflow-y-auto pt-4">
                <CustomerEntryPage
                  slug={slug}
                  entryMode={isExpressLoyalty ? 'loyalty' : 'combined'}
                  initialSessionKey={isDynamicQr ? currentEntry.sessionKey : undefined}
                />
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-32 h-1 bg-[#10181c]/30 rounded-full mx-auto my-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
