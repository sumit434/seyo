import React from 'react';
import { Check, Disc3, Award, Star } from 'lucide-react';
import { FlowStage } from '../../flow/flowStages.js';
import { CustomerStatus } from '../../services/apiServices.js';

interface StageStepperProps {
  currentStage: FlowStage;
  tier: 'combined' | 'spin' | 'loyalty' | 'review' | 'spin-review' | 'loyalty-review';
  status: CustomerStatus | null;
}

export const StageStepper: React.FC<StageStepperProps> = ({ currentStage, tier, status }) => {
  if ((tier !== 'combined' && tier !== 'spin-review' && tier !== 'loyalty-review') || !status) return null;

  const steps = [
    {
      id: 'spin',
      label: 'Spin',
      icon: Disc3,
      isCompleted: status.todaySpun,
      isActive: currentStage === 'spin' || currentStage === 'voucher',
    },
    {
      id: 'loyalty',
      label: 'Loyalty',
      icon: Award,
      isCompleted: status.todayVisited,
      isActive: currentStage === 'loyalty' || currentStage === 'loyalty_reward',
    },
    {
      id: 'review',
      label: 'Review',
      icon: Star,
      isCompleted: status.reviewJourneyCompleted,
      isActive: currentStage === 'review',
    },
  ];

  return (
    <div className="w-full mb-4 px-1">
      <div className="flex items-center justify-between gap-1 p-1.5 rounded-2xl bg-surface-soft border border-line">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                step.isCompleted
                  ? 'bg-brand/15 text-brand-dark'
                  : step.isActive
                  ? 'bg-white text-ink shadow-xs border border-line'
                  : 'text-muted/70 opacity-60'
              }`}
            >
              {step.isCompleted ? (
                <Check className="w-3.5 h-3.5 text-brand stroke-[2.5]" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${step.isActive ? 'text-brand' : 'text-muted'}`} />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};