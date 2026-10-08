import React from 'react';
import { MIN_LOYALTY_TARGET, MAX_LOYALTY_TARGET, MIN_VALIDATION_DAYS, MAX_VALIDATION_DAYS } from '../../../shared/constants/limits';
import { Input } from '../common/Input';
import { Award, Calendar, Target } from 'lucide-react';

interface LoyaltyConfigurationProps {
  loyaltyTarget: number;
  loyaltyValidationDays: number;
  loyaltyReward: string;
  onChange: (fields: { loyaltyTarget?: number; loyaltyValidationDays?: number; loyaltyReward?: string }) => void;
  errors?: { [key: string]: string };
}

export const LoyaltyConfiguration: React.FC<LoyaltyConfigurationProps> = ({
  loyaltyTarget,
  loyaltyValidationDays,
  loyaltyReward,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-3xl border border-[#e2e7e6] text-left">
      <div className="pb-3 border-b border-[#e2e7e6]">
        <h3 className="text-lg font-bold text-[#10181c] flex items-center gap-2">
          <span>Digital Stamp Card & Milestones</span>
        </h3>
        <p className="text-xs text-[#6a787e] mt-0.5">
          Customers collect 1 stamp per calendar day. Visit target and validation days are independent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={`Visit Milestone Target (${MIN_LOYALTY_TARGET}–${MAX_LOYALTY_TARGET} visits)`}
          type="number"
          min={MIN_LOYALTY_TARGET}
          max={MAX_LOYALTY_TARGET}
          value={loyaltyTarget}
          onChange={e => onChange({ loyaltyTarget: parseInt(e.target.value, 10) || MIN_LOYALTY_TARGET })}
          error={errors.loyaltyTarget}
          helperText="Number of visits required to unlock the loyalty voucher."
          leftAddon={<Target className="w-5 h-5 text-[#0e7c66]" />}
        />

        <Input
          label={`Validation Window (${MIN_VALIDATION_DAYS}–${MAX_VALIDATION_DAYS} days)`}
          type="number"
          min={MIN_VALIDATION_DAYS}
          max={MAX_VALIDATION_DAYS}
          value={loyaltyValidationDays}
          onChange={e => onChange({ loyaltyValidationDays: parseInt(e.target.value, 10) || 30 })}
          error={errors.loyaltyValidationDays}
          helperText="Independent cycle validity window before visit stamps expire."
          leftAddon={<Calendar className="w-5 h-5 text-[#0e7c66]" />}
        />
      </div>

      <Input
        label="Milestone Reward Prize Title"
        placeholder="e.g. Free Wood-Fired Margherita Pizza, 50% Off Total Bill"
        value={loyaltyReward}
        onChange={e => onChange({ loyaltyReward: e.target.value })}
        error={errors.loyaltyReward}
        helperText="The high-value voucher awarded when customer reaches their visit milestone."
        leftAddon={<Award className="w-5 h-5 text-[#0e7c66]" />}
      />
    </div>
  );
};
