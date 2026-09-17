/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { ElementType, PageStep, HandGestureState } from './types';
import { CyberBackground } from './components/CyberBackground';
import { HandTracker } from './components/HandTracker';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SelectScreen } from './components/SelectScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ViewerScreen } from './components/ViewerScreen';

export default function App() {
  const [currentStep, setCurrentStep] = useState<PageStep>('welcome');
  const [selectedElement, setSelectedElement] = useState<ElementType>('shui');
  const [gestureState, setGestureState] = useState<HandGestureState>({
    hasHand: false,
    isRightHand: true,
    isLeftHand: false,
    cursorX: 0.5,
    cursorY: 0.5,
    handDistance: 0.5,
    handScale: 1.0,
    isFist: false,
    isPinching: false,
    isPalmOpen: true,
    fistProgress: 0,
    fistTriggered: false,
    hoveredElement: null,
    landmarks: []
  });

  // Handle gesture updates from MediaPipe tracker
  const handleGestureUpdate = useCallback((state: HandGestureState) => {
    setGestureState(state);
  }, []);

  // Handle Fist Confirmation trigger according to current active page
  const handleFistConfirm = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep === 'welcome') {
        // Page 1 -> Page 2 (Select)
        return 'select';
      } else if (prevStep === 'select') {
        // If hovering the top-right back button on Page 2
        const isHoveringBack = gestureState.cursorX > 0.78 && gestureState.cursorY < 0.18;
        if (isHoveringBack) {
          return 'welcome';
        }
        // Otherwise confirm selected element -> Page 3 (Loading buffer)
        return 'loading';
      }
      return prevStep;
    });
  }, [gestureState.cursorX, gestureState.cursorY]);

  // Page Transitions (Strict sequential routing: Welcome -> Select -> Loading -> Viewer)
  const handleEnterFromWelcome = () => {
    setCurrentStep('select');
  };

  const handleBackToWelcome = () => {
    setCurrentStep('welcome');
  };

  const handleConfirmSelection = (el: ElementType) => {
    setSelectedElement(el);
    setCurrentStep('loading');
  };

  const handleLoadingComplete = () => {
    setCurrentStep('viewer');
  };

  const handleBackToSelect = () => {
    setCurrentStep('select');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0c0c0c] text-stone-200 flex flex-col justify-between font-serif select-none">
      {/* 1. Cyberpunk Retro-Futuristic Dot Matrix & CRT Oscilloscope Grid Canvas */}
      <CyberBackground
        pageStep={currentStep}
        intensity={currentStep === 'viewer' ? 0.22 : 0.5}
        mode={currentStep === 'loading' ? 'blueprint' : 'dotmatrix'}
      />

      {/* 2. MediaPipe Hand Vision Tracker & Cursor (Only renders skeleton points, NO raw camera feed!) */}
      <HandTracker
        onGestureUpdate={handleGestureUpdate}
        onFistConfirm={handleFistConfirm}
        compactPosition="top-left"
        showCursor={true}
      />

      {/* 3. Screen Views according to Current Page Step */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {currentStep === 'welcome' && (
          <WelcomeScreen
            onEnter={handleEnterFromWelcome}
            fistProgress={gestureState.fistProgress}
          />
        )}

        {currentStep === 'select' && (
          <SelectScreen
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onConfirm={handleConfirmSelection}
            onBack={handleBackToWelcome}
            cursorX={gestureState.cursorX}
            cursorY={gestureState.cursorY}
            fistProgress={gestureState.fistProgress}
            isFist={gestureState.isFist}
          />
        )}

        {currentStep === 'loading' && (
          <LoadingScreen
            selectedElement={selectedElement}
            onComplete={handleLoadingComplete}
          />
        )}

        {currentStep === 'viewer' && (
          <ViewerScreen
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onBackToSelect={handleBackToSelect}
            handCursorX={gestureState.cursorX}
            handCursorY={gestureState.cursorY}
            handDistance={gestureState.handDistance}
            handScale={gestureState.handScale}
            isFist={gestureState.isFist}
          />
        )}
      </div>
    </main>
  );
}
