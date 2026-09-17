import React, { useState } from 'react';
import { ElementType } from '../types';
import { ELEMENTS, ELEMENT_ORDER } from '../data/elements';
import { ModelViewer3D } from './ModelViewer3D';
import { sound } from '../utils/audio';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Layers,
  Sparkles,
  Shield,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ViewerScreenProps {
  selectedElement: ElementType;
  onSelectElement: (el: ElementType) => void;
  onBackToSelect: () => void;
  handCursorX?: number;
  handCursorY?: number;
  handDistance?: number;
  handScale?: number;
  isFist?: boolean;
}

export const ViewerScreen: React.FC<ViewerScreenProps> = ({
  selectedElement,
  onSelectElement,
  onBackToSelect,
  handCursorX = 0.5,
  handCursorY = 0.5,
  handDistance = 0.5,
  handScale = 1.0,
  isFist = false
}) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'craft' | 'culture'>('intro');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const element = ELEMENTS[selectedElement];

  const handleAudioToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden font-serif">
      {/* Background Architectural Vector Curve Overlay */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 600" className="w-full h-full stroke-[#d4af37]" fill="none">
          <path d="M200 50 Q100 50 100 150 T0 250" strokeWidth="0.6" />
          <path d="M200 100 Q120 100 120 200 T20 300" strokeWidth="0.6" />
          <path d="M200 150 Q140 150 140 250 T40 350" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Top Navigation Bar */}
      <div className="w-full flex items-center justify-between pointer-events-auto z-30">
        {/* Empty space on top-left to avoid colliding with HandTracker HUD */}
        <div className="w-60 h-10 invisible md:visible" />

        {/* Center Element Quick Switch Tabs */}
        <div className="flex items-center gap-1.5 bg-[#101012]/90 border border-stone-800 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <span className="text-[10px] font-sans text-stone-500 uppercase mr-1 hidden sm:inline">
            切换五行:
          </span>
          {ELEMENT_ORDER.map((elKey) => {
            const el = ELEMENTS[elKey];
            const isSelected = selectedElement === elKey;
            return (
              <button
                key={elKey}
                id={`tab-element-${elKey}`}
                onClick={() => {
                  sound.playHover();
                  onSelectElement(elKey);
                }}
                className={`px-3 py-1 rounded-full text-xs font-serif transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#d4af37] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <span>{el.char}</span>
                <span className="text-[10px] opacity-80 hidden md:inline">{el.shapeName.split('·')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools & Back Button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-sound"
            onClick={handleAudioToggle}
            className="p-2 bg-[#101012]/90 border border-stone-800 backdrop-blur-md rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-colors cursor-pointer"
            title={isMuted ? '开启音效' : '静音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
          </button>

          <button
            id="btn-back-to-select"
            onClick={() => {
              sound.playHover();
              onBackToSelect();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#101012]/90 border border-stone-800 backdrop-blur-md rounded-lg text-xs font-serif text-stone-300 hover:text-white hover:border-[#d4af37]/60 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回选择</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Left Architectural Info (Bottom-Left) + Right 3D Model */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 min-h-0 relative items-stretch">
        {/* Left Side: Empty space on top, Info anchored to Bottom-Left */}
        <div className="lg:col-span-4 flex flex-col justify-end pointer-events-auto z-20">
          {/* Architectural Information Card */}
          <div
            id="cuojiaotou-info-panel"
            className="bg-[#101012]/95 border border-stone-800 backdrop-blur-xl rounded-xl p-4 shadow-[0_0_30px_rgba(212,175,55,0.08)] flex flex-col gap-3 max-h-[58vh] overflow-y-auto"
          >
            {/* Header: Name, Wuxing Character & Attributes */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl font-serif font-black shadow-md border bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]"
                >
                  {element.char}
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-bold text-stone-100 tracking-wide">
                    {element.name}
                  </h3>
                  <p className="text-[10px] font-mono text-stone-500">{element.pinyin}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#d4af37]/10 text-[10px] font-serif text-[#d4af37] border border-[#d4af37]/30">
                  {element.shapeName.split('·')[0]}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-lg text-xs font-serif">
              <button
                id="tab-intro"
                onClick={() => setActiveTab('intro')}
                className={`flex-1 py-1 rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'intro' ? 'bg-[#d4af37] text-black font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3 h-3" /> 形态结构
              </button>
              <button
                id="tab-craft"
                onClick={() => setActiveTab('craft')}
                className={`flex-1 py-1 rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'craft' ? 'bg-[#d4af37] text-black font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3 h-3" /> 嵌瓷工艺
              </button>
              <button
                id="tab-culture"
                onClick={() => setActiveTab('culture')}
                className={`flex-1 py-1 rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'culture' ? 'bg-[#d4af37] text-black font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Compass className="w-3 h-3" /> 风水寓意
              </button>
            </div>

            {/* Tab Content Display */}
            <div className="text-xs text-stone-300 leading-relaxed font-sans space-y-2">
              {activeTab === 'intro' && (
                <>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【山墙轮廓特征】</span>
                    <p>{element.shapeDescription}</p>
                  </div>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【五行建筑力学】</span>
                    <p>{element.architecturalFeature}</p>
                  </div>
                </>
              )}

              {activeTab === 'craft' && (
                <>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【国家级非遗 · 嵌瓷技艺】</span>
                    <p>{element.porcelainCraft}</p>
                  </div>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【代表性古建筑群】</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {element.typicalBuildings.map((b, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded text-[10px] font-serif text-[#d4af37]">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'culture' && (
                <>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【五行生克规矩】</span>
                    <p>{element.wuxingPrinciple}</p>
                  </div>
                  <div className="p-2.5 bg-stone-900/50 rounded border border-stone-800">
                    <span className="text-[#d4af37] font-serif text-[11px] block mb-1">【潮汕宗族文化象征】</span>
                    <p>{element.culturalSymbolism}</p>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Status Hint */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] font-sans text-stone-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#d4af37]" /> 潮汕建筑营造法式
              </span>
              <span>手势平移 / 缩放交互中</span>
            </div>
          </div>
        </div>

        {/* Right Side: 3D Holographic Model Viewer with Particle Zoom Dynamics */}
        <div className="lg:col-span-8 h-[60vh] lg:h-full relative pointer-events-auto">
          <ModelViewer3D
            elementType={selectedElement}
            handCursorX={handCursorX}
            handCursorY={handCursorY}
            handDistance={handDistance}
            handScale={handScale}
            isFist={isFist}
          />
        </div>
      </div>
    </div>
  );
};
