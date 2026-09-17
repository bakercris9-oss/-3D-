import React from 'react';
import { sound } from '../utils/audio';
import { Hand } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: () => void;
  fistProgress: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter, fistProgress }) => {
  const handleClick = () => {
    sound.playConfirm();
    onEnter();
  };

  return (
    <div className="relative z-10 w-full h-full flex select-none overflow-hidden">
      {/* Background Architectural Vector Curve Overlay */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-15 pointer-events-none">
        <svg viewBox="0 0 200 600" className="w-full h-full stroke-[#d4af37]" fill="none">
          <path d="M200 50 Q100 50 100 150 T0 250" strokeWidth="0.8" />
          <path d="M200 100 Q120 100 120 200 T20 300" strokeWidth="0.8" />
          <path d="M200 150 Q140 150 140 250 T40 350" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Left Sophisticated Dark Vertical Architectural Column */}
      <div className="w-16 md:w-20 border-r border-stone-800 flex flex-col items-center py-10 justify-between shrink-0 bg-[#0c0c0c]/80 backdrop-blur-sm z-20">
        <div className="[writing-mode:vertical-rl] text-[10px] md:text-xs tracking-[0.45em] text-stone-500 uppercase font-sans">
          Architectural Heritage
        </div>
        <div className="h-28 w-px bg-stone-700/60" />
        <div className="[writing-mode:vertical-rl] text-[#d4af37] text-lg md:text-xl font-serif font-bold tracking-widest">
          潮汕厝角头
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-12 overflow-y-auto z-10">
        {/* Top Header Row */}
        <header className="flex justify-between items-start md:items-end mb-4">
          <div>
            <div className="text-[10px] md:text-xs tracking-[0.3em] text-[#d4af37]/80 uppercase font-sans mb-1">
              SYS.V3.0 // CHAOSHAN ARCHITECTURE ARCHIVE
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-white flex flex-wrap items-baseline gap-3">
              五行之粹 <span className="text-[#d4af37] text-xl md:text-2xl italic font-serif">The Five Elements</span>
            </h1>
            <p className="text-stone-400 max-w-lg font-sans text-xs md:text-sm leading-relaxed mt-2">
              潮汕民居屋脊两侧的装饰性构件，又称“山墙顶”。结合阴阳五行学说，分为金、木、水、火、土五种基本形态，寄托辟邪镇煞、家族昌隆之祈愿。
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-stone-500 text-[10px] tracking-widest font-sans uppercase mb-1">
              ESTABLISHED
            </div>
            <div className="text-sm md:text-base font-serif font-bold border-t border-stone-700 pt-1 text-stone-300">
              MING DYNASTY
            </div>
          </div>
        </header>

        {/* Central Republic-era Inscribed Plaque Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative group">
            {/* Holographic Glowing Aura */}
            <div
              className="absolute -inset-2 bg-gradient-to-r from-[#d4af37]/15 via-white/10 to-[#d4af37]/15 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition duration-500"
              style={{
                transform: fistProgress > 0 ? `scale(${1 + fistProgress * 0.1})` : 'scale(1)'
              }}
            />

            {/* Interactive Traditional Inscribed Plaque */}
            <button
              id="welcome-enter-btn"
              onClick={handleClick}
              className="relative px-8 py-6 md:px-16 md:py-9 bg-[#101012] border-2 border-[#d4af37]/80 shadow-[0_0_35px_rgba(212,175,55,0.18)] rounded-md transition-all duration-300 transform active:scale-95 group-hover:border-[#d4af37] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] cursor-pointer overflow-hidden"
            >
              {/* Plaque Inner Double Border with Inset Corner Knots */}
              <div className="absolute inset-1.5 border border-[#d4af37]/40 pointer-events-none rounded-sm" />
              <div className="absolute inset-2.5 border border-dashed border-[#d4af37]/20 pointer-events-none" />

              {/* Corner Decorative Ornaments */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#d4af37] pointer-events-none" />

              {/* Traditional Top Center Hanging Plaque Crown Ring */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 border-2 border-[#d4af37] rounded-t-full bg-black/90" />

              {/* Plaque Title Typography: "欢迎来到厝角头" */}
              <div className="flex flex-col items-center gap-1.5 z-10 relative">
                <span className="text-[10px] md:text-xs font-mono tracking-[0.4em] text-[#d4af37] uppercase">
                  HOLOGRAPHIC HERITAGE
                </span>
                <h2
                  className="text-2xl md:text-4xl lg:text-5xl font-serif font-black tracking-widest text-[#f5f5f4] drop-shadow-[0_2px_14px_rgba(212,175,55,0.4)]"
                  style={{
                    letterSpacing: '0.18em'
                  }}
                >
                  欢迎来到厝角头
                </h2>
                <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent my-1" />
                <span className="text-[11px] md:text-xs text-stone-400 font-serif tracking-widest">
                  金 · 木 · 水 · 火 · 土 · 建筑天际线
                </span>
              </div>

              {/* Traditional Red Seal Stamp */}
              <div className="absolute right-3.5 bottom-3 w-7 h-7 border border-red-700 bg-red-950/80 text-red-400 flex items-center justify-center text-[10px] font-serif leading-tight rotate-3 shadow-inner pointer-events-none opacity-90">
                潮厝
              </div>

              {/* Fist Charge Fill Layer */}
              {fistProgress > 0 && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/25 via-white/20 to-[#d4af37]/25 transition-all duration-75 pointer-events-none"
                  style={{ width: `${fistProgress * 100}%` }}
                />
              )}
            </button>
          </div>

          {/* Gesture Guide & Prompt Instruction */}
          <div className="mt-6 flex flex-col items-center gap-2 text-stone-300">
            <div className="flex items-center gap-2.5 px-5 py-2 bg-stone-900/70 border border-stone-800 rounded-full backdrop-blur-sm shadow-md">
              <Hand className="w-4 h-4 text-[#d4af37] animate-pulse" />
              <span className="text-xs md:text-sm font-sans tracking-wide">
                交互方式：<strong className="text-[#d4af37] font-semibold">右手握拳</strong> 确认进入下一个页面
              </span>
            </div>

            <p className="text-[11px] font-sans text-stone-500 tracking-wider">
              (亦可直接点击上方牌匾按钮进入五行形制选型)
            </p>
          </div>
        </div>

        {/* Footer Cultural Notes */}
        <footer className="flex flex-col md:flex-row items-center justify-between border-t border-stone-800 pt-4 text-xs font-sans text-stone-400 gap-2">
          <div className="flex gap-6 md:gap-10 text-stone-400 text-xs">
            <div>工艺 · 嵌瓷 / 绘彩</div>
            <div>材质 · 贝灰 / 木石</div>
            <div>美学 · 繁复 / 庄重</div>
          </div>
          <div className="text-stone-500 text-[11px] font-mono">
            DIGITAL POINT CLOUD RECONSTRUCTION & GESTURE INTERACTION
          </div>
        </footer>
      </div>
    </div>
  );
};
