import React, { useEffect, useState } from 'react';
import { ElementType } from '../types';
import { ELEMENTS } from '../data/elements';
import { sound } from '../utils/audio';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  selectedElement: ElementType;
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ selectedElement, onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const element = ELEMENTS[selectedElement];

  useEffect(() => {
    sound.playWarp();

    const TOTAL_DURATION_MS = 3000; // 3-second waiting time
    const INTERVAL_MS = 30;
    const totalSteps = TOTAL_DURATION_MS / INTERVAL_MS;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(currentProgress);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        sound.playConfirm();
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [onComplete]);

  return (
    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 select-none">
      {/* Background Architectural Vector Curve Overlay */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 600" className="w-full h-full stroke-[#d4af37]" fill="none">
          <path d="M200 50 Q100 50 100 150 T0 250" strokeWidth="0.6" />
          <path d="M200 100 Q120 100 120 200 T20 300" strokeWidth="0.6" />
          <path d="M200 150 Q140 150 140 250 T40 350" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Oscilloscope Viewfinder Grid Box */}
      <div className="relative w-full max-w-2xl bg-[#101012]/90 border border-stone-800 backdrop-blur-xl rounded-xl p-8 md:p-12 shadow-[0_0_40px_rgba(212,175,55,0.08)] flex flex-col items-center text-center overflow-hidden">
        {/* Reticle Corner Brackets in Antique Gold */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]/60" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]/60" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]/60" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]/60" />

        {/* Scan line effect inside card */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4af37]/5 to-transparent h-12 animate-pulse pointer-events-none" />

        {/* Subtitle tag */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-sans tracking-[0.3em] text-[#d4af37] mb-3 uppercase">
          <Sparkles className="w-4 h-4 text-[#d4af37] animate-spin" />
          <span>HOLOGRAPHIC RECONSTRUCTION // 3.0S BUFFER</span>
        </div>

        <h2
          className="text-3xl md:text-5xl font-serif font-bold tracking-widest text-stone-100 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-2"
          style={{
            letterSpacing: '0.15em'
          }}
        >
          进入{element.char}厝角头世界
        </h2>

        <p className="text-sm font-serif text-stone-400 mb-8 tracking-wider">
          【 {element.shapeName} · 正在加载全息 3D 点云与嵌瓷材质 】
        </p>

        {/* 100% Progress Bar Container */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-stone-300">
            <span className="flex items-center gap-2 font-sans">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
              <span>载入建筑空间矩阵中...</span>
            </span>
            <span className="text-xl font-bold font-mono tracking-wider text-[#d4af37]">
              {progress}%
            </span>
          </div>

          {/* Glowing Antique Gold Progress Track */}
          <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-800">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out shadow-[0_0_15px_rgba(212,175,55,0.6)]"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #92400e, #d4af37, #fef08a)'
              }}
            />
          </div>

          {/* Bottom Telemetry Ticker */}
          <div className="flex justify-between text-[10px] font-mono text-stone-500 pt-2">
            <span>MODEL: {element.id.toUpperCase()}.GLB</span>
            <span>VERTEX BUFFER: PARSING</span>
            <span>TIME REMAINING: {Math.max(0, ((100 - progress) * 0.03)).toFixed(1)}S</span>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-800 flex justify-center">
            <button
              id="btn-skip-loading"
              onClick={() => {
                sound.playConfirm();
                onComplete();
              }}
              className="px-4 py-1.5 bg-stone-900 border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded text-xs font-serif transition-colors cursor-pointer"
            >
              直接进入建筑页面 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
