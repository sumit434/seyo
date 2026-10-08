import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { TopRanker } from '../../../shared/types/qr';
import { customerService } from '../../services/customerService';
import { Trophy, Medal, Flame, Loader2 } from 'lucide-react';

interface TopRankersModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessSlug: string;
}

export const TopRankersModal: React.FC<TopRankersModalProps> = ({
  isOpen,
  onClose,
  businessSlug,
}) => {
  const [rankers, setRankers] = useState<TopRanker[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && businessSlug) {
      setIsLoading(true);
      customerService
        .getTopRankers(businessSlug)
        .then(res => {
          setRankers(res.topRankers || []);
          setBusinessName(res.businessName || '');
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, businessSlug]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-sm">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-sm shadow-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-sm shadow-sm">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#f1f3f2] text-[#6a787e] flex items-center justify-center font-bold text-sm">
        #{rank}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Top 5 Loyal Legends"
      description={`Hall of Fame for ${businessName}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-left">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#6a787e]">
            <Loader2 className="w-6 h-6 animate-spin text-[#0e7c66]" />
            <span className="text-xs font-semibold">Calculating rankings...</span>
          </div>
        ) : rankers.length === 0 ? (
          <div className="py-8 text-center text-[#6a787e]">
            <Trophy className="w-10 h-10 mx-auto text-[#e2e7e6] mb-2" />
            <p className="text-sm font-semibold text-[#10181c]">No rankers yet</p>
            <p className="text-xs mt-1">Be the first to stamp visits and claim the #1 spot!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rankers.map(r => (
              <div
                key={r.rank}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  r.rank === 1
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-white border-[#e2e7e6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(r.rank)}
                  <div>
                    <h4 className="text-sm font-bold text-[#10181c]">{r.name}</h4>
                    <p className="text-xs text-[#6a787e] font-mono">{r.maskedMobile}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#0e7c66] font-black text-base font-mono">
                    <Flame className="w-4 h-4 fill-[#0e7c66]" />
                    <span>{r.totalVisits}</span>
                  </div>
                  <p className="text-[10px] text-[#6a787e] uppercase font-bold tracking-wider">
                    Lifetime Visits
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-[#e2e7e6] flex items-center justify-between text-[11px] text-[#6a787e]">
          <span>Rankings update after every verified customer visit.</span>
          <span className="font-semibold text-[#0e7c66]">Top 5 Legends</span>
        </div>
      </div>
    </Modal>
  );
};
