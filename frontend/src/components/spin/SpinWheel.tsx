import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { Button } from '../common/Button.js';

export interface SpinWheelSlice {
  id: string;
  rewardLabel: string;
  emoji: string;
  weight: number;
}

interface SpinWheelProps {
  slices: SpinWheelSlice[];
  onSpin: () => Promise<{ winningSlice: any; sliceIndex: number } | null>;
  onComplete?: () => void; // <--- Add this line here
  disabled?: boolean;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ slices, onSpin, onComplete, disabled = false }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonSlice, setWonSlice] = useState<SpinWheelSlice | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const numSlices = slices.length;
  const sliceAngle = 360 / (numSlices || 1);

  // Colors for slices
  const sliceColors = [
    '#0e7c66', // Green
    '#ffffff', // White
    '#0e7c66',
    '#ffffff',
    '#0e7c66',
    '#ffffff',
    '#0e7c66',
  ];

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || numSlices === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 8;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw slices
    // Draw slices
    for (let i = 0; i < numSlices; i++) {
      const startAngle = ((i * sliceAngle - 90) * Math.PI) / 180;
      const endAngle = (((i + 1) * sliceAngle - 90) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const isWhite = sliceColors[i % sliceColors.length] === '#ffffff';
      ctx.fillStyle = sliceColors[i % sliceColors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isWhite ? '#e2f1ec' : '#ffffff';
      ctx.stroke();

      // Emoji orientation facing the outer arc, pushed closer to the edge
      const midAngle = (startAngle + endAngle) / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);

      ctx.fillStyle = isWhite ? '#0e7c66' : '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const emoji = slices[i].emoji || '🎁';

      // Increased textRadius from 0.65 to 0.78 to move emojis closer to the arc edge
      const textRadius = radius * 0.78;
      
      ctx.save();
      ctx.translate(textRadius, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(emoji, 0, 0);
      ctx.restore();

      ctx.restore();
    }

    // Draw outer golden ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#E4B72F';
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0e7c66';
    ctx.stroke();

    // Center star icon
    ctx.fillStyle = '#0e7c66';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', centerX, centerY);
  }, [slices, numSlices, sliceAngle]);

  const handleStartSpin = async () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);

    const result = await onSpin();
    if (!result) {
      setIsSpinning(false);
      return;
    }

    const { winningSlice, sliceIndex } = result;

    const targetSliceCenter = sliceIndex * sliceAngle + sliceAngle / 2;
    const extraSpins = 360 * 5;
    const calculatedTarget = extraSpins + (360 - targetSliceCenter);

    setRotation(prev => prev + calculatedTarget);

    // 1. Wheel spins for 4.5s
    setTimeout(() => {
      setIsSpinning(false);

      // 2. Wait 2 seconds after stopping, then transition to the reward voucher page
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, 4500);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Title */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Guaranteed Reward</span>
        </div>
        <h2 className="text-xl font-black text-ink">Spin & Win Today!</h2>
        <p className="text-xs text-muted">
          Every slice is a winner. Spin the wheel to reveal your prize.
        </p>
      </div>

      {/* Wheel Visual Container */}
      <div className="relative my-2 w-[290px] h-[290px] flex items-center justify-center">
        {/* Top Pointer Indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 -mt-1 drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow-xs" />
        </div>

        {/* Rotating Canvas Wheel */}
        <div
          className="w-[280px] h-[280px] rounded-full shadow-pop transition-transform duration-[4500ms] ease-out will-change-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="w-full h-full rounded-full"
          />
        </div>
      </div>

      {/* Won Prize Banner if completed */}
      {wonSlice && !isSpinning && (
        <div className="w-full mt-4 p-4 rounded-2xl bg-brand-soft border border-brand/20 text-center animate-fadeIn">
          <div className="inline-flex p-2 rounded-xl bg-brand text-white mb-1.5 shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-ink">Congratulations! You Won:</h3>
          <p className="text-lg font-black text-brand mt-0.5">
            {wonSlice.emoji} {wonSlice.rewardLabel}
          </p>
        </div>
      )}

      {/* Spin Button */}
      <div className="w-full mt-5">
        <Button
          onClick={handleStartSpin}
          disabled={disabled || isSpinning}
          isLoading={isSpinning}
          className="text-base py-4 font-bold shadow-md"
        >
          <Sparkles className="w-5 h-5 mr-1" />
          <span>{isSpinning ? 'Selecting Your Reward...' : 'Spin the Wheel'}</span>
        </Button>
      </div>
    </div>
  );
};
