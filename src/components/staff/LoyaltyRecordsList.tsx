import React from 'react';
import { Award, Flame, Users } from 'lucide-react';

interface LoyaltyRecord {
  id: string;
  name: string;
  mobile?: string;
  mobileMasked: string;
  visitCount: number;
  target: number;
  totalVisits: number;
  lastVisitAt?: string;
}

interface LoyaltyRecordsListProps {
  records: LoyaltyRecord[];
  target: number;
}

export const LoyaltyRecordsList: React.FC<LoyaltyRecordsListProps> = ({ records, target }) => {
  if (records.length === 0) {
    return (
      <div className="py-12 bg-white rounded-3xl border border-[#e2e7e6] text-center text-[#6a787e] p-6">
        <Users className="w-10 h-10 mx-auto text-[#e2e7e6] mb-3" />
        <h4 className="font-bold text-[#10181c] text-base">No Loyalty Records Yet</h4>
        <p className="text-xs mt-1">Customer visit stamps will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-base font-bold text-[#10181c] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0e7c66]" />
          <span>Active Customer Loyalty Cards ({records.length})</span>
        </h3>
        <span className="text-xs text-[#6a787e]">Target: {target} visits</span>
      </div>

      <div className="bg-white rounded-3xl border border-[#e2e7e6] overflow-hidden shadow-xs divide-y divide-[#e2e7e6]">
        {records.map(rec => {
          const progressPercent = Math.min(100, Math.round((rec.visitCount / rec.target) * 100));
          const fullMobile = rec.mobile || rec.mobileMasked;

          return (
            <div key={rec.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f1f3f2]/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#10181c] text-sm">{rec.name}</h4>
                  <span className="font-mono text-xs text-[#10181c] font-semibold bg-[#f1f3f2] px-2.5 py-0.5 rounded-md border border-[#e2e7e6]">
                    {fullMobile}
                  </span>
                </div>
                <p className="text-xs text-[#6a787e]">
                  Last visit: {rec.lastVisitAt ? new Date(rec.lastVisitAt).toLocaleDateString() : 'Today'}
                </p>
              </div>

              {/* Progress and lifetime visits */}
              <div className="flex items-center gap-4 sm:min-w-[220px]">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#6a787e]">Current Cycle</span>
                    <span className="text-[#0e7c66] font-mono">{rec.visitCount} / {rec.target}</span>
                  </div>
                  <div className="w-full h-2 bg-[#e2e7e6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0e7c66] rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[#0e7c66] font-bold text-sm font-mono">
                    <Flame className="w-3.5 h-3.5 fill-[#0e7c66]" />
                    <span>{rec.totalVisits}</span>
                  </div>
                  <span className="text-[10px] text-[#6a787e] uppercase font-semibold">Total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
