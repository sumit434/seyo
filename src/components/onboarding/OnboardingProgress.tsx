import React from 'react';
import { Check } from 'lucide-react';
import { OnboardingStepName } from '../../../shared/types/business';

interface OnboardingProgressProps {
  currentStep: OnboardingStepName;
}

const STEPS: { id: OnboardingStepName; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'logo', label: 'Branding' },
  { id: 'configuration', label: 'Config' },
  { id: 'security', label: 'Security' },
  { id: 'confirmation', label: 'Launch' },
];

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full py-4 mb-6">
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        {STEPS.map((step, index) => {
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    isDone
                      ? 'bg-[#0e7c66] text-white'
                      : isCurrent
                      ? 'border-2 border-[#0e7c66] text-[#0e7c66] bg-white ring-4 ring-[#e2f1ec]'
                      : 'bg-white border border-[#e2e7e6] text-[#6a787e]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium transition-colors hidden sm:block ${
                    isCurrent ? 'text-[#0e7c66] font-bold' : isDone ? 'text-[#10181c]' : 'text-[#6a787e]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    currentIndex > index ? 'bg-[#0e7c66]' : 'bg-[#e2e7e6]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
