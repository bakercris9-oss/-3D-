import React, { useEffect, useRef } from 'react';
import { ElementType } from '../types';
import { ELEMENTS, ELEMENT_ORDER } from '../data/elements';
import { sound } from '../utils/audio';
import {
  ArrowLeft,
  Hand,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SelectScreenProps {
  selectedElement: ElementType;
  onSelectElement: (el: ElementType) => void;
  onConfirm: (el: ElementType) => void;
  onBack: () => void;
  cursorX: number; // 0 to 1
  cursorY: number; // 0 to 1
  fistProgress: number;
  isFist: boolean;
}

export const SelectScreen: React.FC<SelectScreenProps> = ({
  selectedElement,
  onSelectElement,
  onConfirm,
  onBack,
  cursorX,
  cursorY,
  fistProgress
}) => {
  const lastSelectedRef = useRef<ElementType>(selectedElement);

  // Return button hover state
  const isHoveringBack = cursorX > 0.78 && cursorY < 0.18;

  // Map cursor horizontal position (cursorX) to 5 cards when hand moves across screen
  useEffect(() => {
    if (!isHoveringBack && cursorX > 0.05 && cursorX < 0.95) {
      const index = Math.min(4, Math.max(0, Math.floor((cursorX - 0.05) / 0.18)));
      const newEl = ELEMENT_ORDER[index];
      if (newEl && newEl !== lastSelectedRef.current) {
        lastSelectedRef.current = newEl;
        sound.playHover();
        onSelectElement(newEl);
      }
    }
  }, [cursorX, cursorY, isHoveringBack, onSelectElement]);

  const handleCardClick = (el: ElementType) => {
    if (selectedElement === el) {
      sound.playConfirm();
      onConfirm(el);
    } else {
      sound.playHover();
      onSelectElement(el);
    }
  };

  const handleConfirmClick = () => {
    sound.playConfirm();
    onConfirm(selectedElement);
  };

  // Architectural Gable Peak SVG Path definitions for the 5 elements
  const renderGableArchSvg = (id: ElementType, isSelected: boolean) => {
    const strokeColor = isSelected ? '#d4af37' : '#a8a29e';
    switch (id) {
      case 'jin':
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-10 md:w-24 md:h-12 fill-none transition-colors duration-300">
            <path d="M10 40 Q50 -10 90 40" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'mu':
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-10 md:w-24 md:h-12 fill-none transition-colors duration-300">
            <path d="M10 40 L50 5 L90 40" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'shui':
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-10 md:w-24 md:h-12 fill-none transition-colors duration-300">
            <path d="M10 40 Q30 0 50 40 Q70 0 90 40" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'huo':
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-10 md:w-24 md:h-12 fill-none transition-colors duration-300">
            <path d="M10 40 L30 10 L50 30 L70 5 L90 40" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'tu':
        return (
          <svg viewBox="0 0 100 40" className="w-20 h-10 md:w-24 md:h-12 fill-none transition-colors duration-300">
            <path d="M10 40 L10 10 L90 10 L90 40" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getElementSummary = (id: ElementType) => {
    switch (id) {
      case 'jin':
        return '头圆而足阔，如大钟覆地，象征富贵圆满。';
      case 'mu':
        return '头圆而身直，挺拔秀丽，寓意事业生机勃勃。';
      case 'shui':
        return '三波或多波起伏，如波浪叠现，意指财源广进。';
      case 'huo':
        return '尖锐多角，参差不齐，如火焰升腾，象征兴旺。';
      case 'tu':
        return '头平而体方，端庄稳重，寓意基业长青。';
      default:
        return '';
    }
  };

  return (
    <div className="relative z-10 w-full h-full flex select-none overflow-hidden">
      {/* Background Architectural Vector Curve Overlay */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 600" className="w-full h-full stroke-[#d4af37]" fill="none">
          <path d="M200 50 Q100 50 100 150 T0 250" strokeWidth="0.6" />
          <path d="M200 100 Q120 100 120 200 T20 300" strokeWidth="0.6" />
          <path d="M200 150 Q140 150 140 250 T40 350" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Left Sophisticated Dark Vertical Architectural Column */}
      <div className="w-16 md:w-20 border-r border-stone-800 flex flex-col items-center py-10 justify-between shrink-0 bg-[#0c0c0c]/80 backdrop-blur-sm z-20">
        <div className="[writing-mode:vertical-rl] text-[10px] md:text-xs tracking-[0.45em] text-stone-500 uppercase font-sans">
          Architectural Heritage
        </div>
        <div className="h-28 w-px bg-stone-700/60" />
        <div className="[writing-mode:vertical-rl] text-[#d4af37] text-lg md:text-xl font-serif font-bold tracking-widest">
          五行形制
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between p-4 md:p-8 overflow-y-auto z-10">
        {/* Top Header Row with Title, Establishment and Back Button */}
        <header className="flex justify-between items-start md:items-end mb-4">
          <div>
            <div className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-[#d4af37]/80 uppercase mb-1">
              WU XING SELECTION // PHASE 02
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-light tracking-tight text-white flex flex-wrap items-baseline gap-3">
              五行之粹 <span className="text-[#d4af37] text-xl md:text-2xl italic font-serif">The Five Elements</span>
            </h1>
            <p className="text-stone-400 max-w-md font-sans text-xs md:text-sm leading-relaxed mt-1">
              潮汕民居屋脊两侧的山墙顶构件，分为金、木、水、火、土五种基本形态。
            </p>
          </div>

          {/* Top-Right Tools & Return Button */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-stone-500 text-[10px] tracking-widest font-sans uppercase mb-0.5">
                ESTABLISHED
              </div>
              <div className="text-sm font-serif font-bold border-t border-stone-700 pt-0.5 text-stone-300">
                MING DYNASTY
              </div>
            </div>

            {/* Return Button */}
            <div className="relative group mt-1">
              {isHoveringBack && fistProgress > 0 && (
                <div
                  className="absolute -inset-1 bg-rose-500/30 rounded-lg blur-md transition-all duration-75"
                  style={{ opacity: fistProgress }}
                />
              )}

              <button
                id="btn-back-to-welcome"
                onClick={() => {
                  sound.playHover();
                  onBack();
                }}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900/90 border rounded transition-all duration-200 cursor-pointer ${
                  isHoveringBack
                    ? 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] text-rose-300 scale-105'
                    : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-xs font-serif tracking-wider">返回上一级</span>

                {isHoveringBack && fistProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-rose-500/20 rounded pointer-events-none transition-all duration-75"
                    style={{ width: `${fistProgress * 100}%` }}
                  />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Center 5 Element Cards Section */}
        <section className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 my-2 items-stretch">
          {ELEMENT_ORDER.map((elKey) => {
            const el = ELEMENTS[elKey];
            const isSelected = selectedElement === elKey;

            return (
              <div
                key={elKey}
                id={`card-element-${elKey}`}
                onClick={() => handleCardClick(elKey)}
                className={`group relative p-5 md:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer rounded-lg backdrop-blur-sm overflow-hidden ${
                  isSelected
                    ? 'bg-stone-900/80 border-2 border-[#d4af37]/80 shadow-[0_0_30px_rgba(212,175,55,0.15)] scale-[1.03] z-20'
                    : 'bg-stone-900/40 border border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/60 opacity-85 hover:opacity-100 z-10'
                }`}
                style={{
                  minHeight: '260px'
                }}
              >
                {/* Subtle corner decorations */}
                <div className={`absolute top-1.5 left-1.5 w-2 h-2 border-t border-l ${isSelected ? 'border-[#d4af37]' : 'border-stone-700'}`} />
                <div className={`absolute top-1.5 right-1.5 w-2 h-2 border-t border-r ${isSelected ? 'border-[#d4af37]' : 'border-stone-700'}`} />
                <div className={`absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l ${isSelected ? 'border-[#d4af37]' : 'border-stone-700'}`} />
                <div className={`absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r ${isSelected ? 'border-[#d4af37]' : 'border-stone-700'}`} />

                {/* Top Character and Pinyin */}
                <div className="flex justify-between items-start">
                  <div
                    className={`text-4xl md:text-5xl font-serif font-light transition-all duration-300 ${
                      isSelected ? 'text-[#d4af37] font-normal scale-110 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-[#d4af37]/70'
                    }`}
                  >
                    {el.char}
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase">
                    {el.pinyin.split(' ')[0]}
                  </span>
                </div>

                {/* Middle Architectural Gable Curve Diagram */}
                <div className="flex flex-col items-center gap-3 my-3">
                  <div className="h-14 w-full flex items-end justify-center">
                    {renderGableArchSvg(elKey, isSelected)}
                  </div>
                  <h3 className={`font-serif font-medium text-sm text-center tracking-wide ${isSelected ? 'text-white font-semibold' : 'text-stone-300'}`}>
                    {el.name.slice(0, 1)}式 · {el.shapeName.split('·')[0].replace('顶', '').replace('平直陡立', '挺拔').replace('波浪起伏', '连绵').replace('锐角尖峰', '灵动').replace('平顶方正', '浑厚')}
                  </h3>
                  <p className="text-[11px] text-stone-400 text-center leading-relaxed line-clamp-2 font-sans px-1">
                    {getElementSummary(elKey)}
                  </p>
                </div>

                {/* Bottom Status / Selection Tag */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-center">
                  {isSelected ? (
                    <span className="text-[11px] font-serif text-[#d4af37] flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3 text-[#d4af37]" /> 已选定 · 握拳确认
                    </span>
                  ) : (
                    <span className="text-[10px] font-serif text-stone-500">
                      滑动选中
                    </span>
                  )}
                </div>

                {/* Fist Charge Fill Layer on Selected Card */}
                {isSelected && fistProgress > 0 && !isHoveringBack && (
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#d4af37]/25 via-white/10 to-transparent transition-all duration-75 pointer-events-none"
                    style={{ height: `${fistProgress * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </section>

        {/* Selected Element Concept Banner */}
        <div className="mt-3 px-5 py-2 bg-stone-900/60 border border-stone-800 rounded-lg text-xs md:text-sm text-stone-300 font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37] font-semibold">【{ELEMENTS[selectedElement].name}】</span>
            <span className="text-stone-400 font-sans text-xs">{ELEMENTS[selectedElement].wuxingPrinciple}</span>
          </div>
          <span className="text-stone-500 font-mono text-[10px] hidden md:inline">
            ARCHITECTURAL PROFILE: {selectedElement.toUpperCase()}
          </span>
        </div>

        {/* Footer Navigation and Action Bar */}
        <footer className="mt-4 flex flex-col md:flex-row items-center justify-between border-t border-stone-800 pt-4 gap-3 text-xs font-sans text-stone-400">
          <div className="flex items-center gap-6 md:gap-10 text-xs font-sans tracking-widest text-stone-400">
            <div>工艺 · 嵌瓷 / 绘彩</div>
            <div>材质 · 贝灰 / 木石</div>
            <div>美学 · 繁复 / 庄重</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-sans">
              <Hand className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>左右滑动切换 · 握拳保持1秒确认</span>
            </div>

            <button
              id="btn-confirm-element-selection"
              onClick={handleConfirmClick}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded transition-all duration-200 cursor-pointer font-serif text-xs font-semibold shadow-[0_0_15px_rgba(212,175,55,0.1)] active:scale-95"
            >
              <span>进入 {ELEMENTS[selectedElement].char} 厝角头世界</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
