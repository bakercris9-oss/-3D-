import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandGestureState, HandLandmarkPoint } from '../types';
import { sound } from '../utils/audio';
import { Camera, CameraOff, Sparkles, Sliders } from 'lucide-react';

interface HandTrackerProps {
  onGestureUpdate?: (state: HandGestureState) => void;
  onFistConfirm?: () => void;
  compactPosition?: 'top-left' | 'floating';
  showCursor?: boolean;
}

// MediaPipe Landmark Connections for skeleton rendering
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Palm base
];

// MediaPipe types definition for CDN
interface MPResults {
  multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
  multiHandedness?: Array<{ label: string; score: number }>;
}

interface MPHands {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MPResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
}

interface MPCamera {
  start: () => Promise<void>;
  stop: () => void;
}

declare global {
  interface Window {
    Hands?: new (config: { locateFile: (file: string) => string }) => MPHands;
    Camera?: new (
      videoElement: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width?: number;
        height?: number;
      }
    ) => MPCamera;
  }
}

export const HandTracker: React.FC<HandTrackerProps> = ({
  onGestureUpdate,
  onFistConfirm,
  compactPosition = 'top-left',
  showCursor = true
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const fistHoldStartTime = useRef<number | null>(null);
  const fistTriggeredRef = useRef<boolean>(false);
  const lastFistTriggerTime = useRef<number>(0);
  const requireFistReleaseRef = useRef<boolean>(false);
  const cameraInstanceRef = useRef<MPCamera | null>(null);
  const handsInstanceRef = useRef<MPHands | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gestureStatus, setGestureStatus] = useState<string>('等待手部识别...');
  const [fistProgress, setFistProgress] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isFistActive, setIsFistActive] = useState<boolean>(false);
  const [mouseSimMode, setMouseSimMode] = useState<boolean>(false);
  const [handDistance, setHandDistance] = useState<number>(0.5); // 0.0 (far) to 1.0 (close)
  const [handScale, setHandScale] = useState<number>(1.0); // 1.85 (far/large) to 0.45 (close/small)
  const [hoveredButtonLabel, setHoveredButtonLabel] = useState<string | null>(null);
  const handDistanceRef = useRef<number>(0.5);
  const simDistanceRef = useRef<number>(0.5);
  const hoveredTargetRef = useRef<HTMLElement | null>(null);

  // Helper to find clickable target under screen point
  const getClickableAt = (x: number, y: number): HTMLElement | null => {
    try {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        if (el.closest('#hand-gesture-cursor') || el.closest('#hand-tracker-hud')) continue;
        const clickable = el.closest(
          'button, [role="button"], a, .cursor-pointer, [id^="btn-"], [id^="tab-"], [id^="card-element-"], #welcome-enter-btn'
        ) as HTMLElement | null;
        if (clickable) return clickable;
      }
    } catch {
      // Fallback
    }
    return null;
  };

  // Helper to extract clean button label
  const getButtonText = (el: HTMLElement): string => {
    const text = el.innerText || el.getAttribute('title') || el.getAttribute('aria-label') || '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length > 0) return clean.slice(0, 14);
    if (el.id) return el.id.replace('btn-', '').replace('tab-', '');
    return '目标按钮';
  };

  // Load MediaPipe scripts from CDN dynamically if not available
  const loadMediaPipeScripts = async (): Promise<boolean> => {
    if (window.Hands && window.Camera) return true;

    return new Promise((resolve) => {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) resolve(true);
      };

      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script1.crossOrigin = 'anonymous';
      script1.onload = checkDone;
      script1.onerror = () => resolve(false);

      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      script2.crossOrigin = 'anonymous';
      script2.onload = checkDone;
      script2.onerror = () => resolve(false);

      document.head.appendChild(script1);
      document.head.appendChild(script2);
    });
  };

  // Check if hand is making a fist (Fingertips closer to wrist landmark 0 and MCP knuckles)
  const detectFist = (landmarks: Array<{ x: number; y: number; z: number }>): boolean => {
    if (!landmarks || landmarks.length < 21) return false;

    const wrist = landmarks[0];
    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerMCPs = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

    let foldedFingers = 0;

    for (let i = 0; i < 4; i++) {
      const tip = fingerTips[i];
      const mcp = fingerMCPs[i];

      const distTipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const distMcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

      // In a fist, fingertip curls closer to wrist than its MCP joint
      if (distTipToWrist < distMcpToWrist * 1.15) {
        foldedFingers++;
      }
    }

    // Thumb check (landmark 4 vs landmark 2/9)
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];
    const distThumbToIndex = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
    if (distThumbToIndex < 0.14) {
      foldedFingers++;
    }

    return foldedFingers >= 4;
  };

  // Smooth hand landmark processing
  const handleResults = useCallback(
    (results: MPResults) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // STRICT REQUIREMENT: Only render captured hand landmark dots/skeleton, NO raw webcam background!
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      // Subtle holographic grid lines in HUD window
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        setGestureStatus('等待手部进入视野...');
        fistHoldStartTime.current = null;
        setFistProgress(0);
        setIsFistActive(false);

        onGestureUpdate?.({
          hasHand: false,
          isRightHand: false,
          isLeftHand: false,
          cursorX: cursorRef.current.x,
          cursorY: cursorRef.current.y,
          isFist: false,
          isPinching: false,
          isPalmOpen: false,
          fistProgress: 0,
          fistTriggered: false,
          hoveredElement: null,
          landmarks: []
        });
        return;
      }

      const handsData: HandLandmarkPoint[][] = [];
      let activeHandLandmarks = results.multiHandLandmarks[0];
      let isRightHand = true;

      // Check handedness
      if (results.multiHandedness && results.multiHandedness.length > 0) {
        // MediaPipe mirrors webcams: 'Left' label often corresponds to user's Right hand in mirror view
        const label = results.multiHandedness[0].label;
        isRightHand = label === 'Left' || label === 'Right';
      }

      // Draw all detected hands' skeletal points
      results.multiHandLandmarks.forEach((landmarks) => {
        const converted = landmarks.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
        handsData.push(converted);

        // 1. Draw Skeleton Connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          // Mirror x for natural self-view
          const x1 = (1 - p1.x) * w;
          const y1 = p1.y * h;
          const x2 = (1 - p2.x) * w;
          const y2 = p2.y * h;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });

        // 2. Draw Landmark Dots
        landmarks.forEach((p, idx) => {
          const px = (1 - p.x) * w;
          const py = p.y * h;
          const isTip = [4, 8, 12, 16, 20].includes(idx);
          const isWrist = idx === 0;

          // Glowing dot
          ctx.fillStyle = isTip ? '#38bdf8' : isWrist ? '#f59e0b' : '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, isTip ? 3.5 : 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Outer halo
          ctx.strokeStyle = isTip ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, isTip ? 6 : 4, 0, Math.PI * 2);
          ctx.stroke();
        });
      });

      // Track Hand Cursor Position (Mirror X for intuitive pointing)
      // Use palm center / index MCP (landmarks 0 and 9)
      const palmX = 1 - (activeHandLandmarks[0].x + activeHandLandmarks[9].x) / 2;
      const palmY = (activeHandLandmarks[0].y + activeHandLandmarks[9].y) / 2;

      // Exponential moving average for smooth cursor
      const smoothFactor = 0.35;
      cursorRef.current.x = cursorRef.current.x * (1 - smoothFactor) + palmX * smoothFactor;
      cursorRef.current.y = cursorRef.current.y * (1 - smoothFactor) + palmY * smoothFactor;

      const screenX = cursorRef.current.x * window.innerWidth;
      const screenY = cursorRef.current.y * window.innerHeight;
      setCursorPos({ x: screenX, y: screenY });

      // Hit-test clickable elements under the gesture cursor
      const targetElement = getClickableAt(screenX, screenY);
      if (hoveredTargetRef.current && hoveredTargetRef.current !== targetElement) {
        hoveredTargetRef.current.classList.remove('gesture-hover-target', 'gesture-fist-charging');
      }
      if (targetElement) {
        targetElement.classList.add('gesture-hover-target');
        setHoveredButtonLabel(getButtonText(targetElement));
      } else {
        setHoveredButtonLabel(null);
      }
      hoveredTargetRef.current = targetElement;

      // Track Hand Distance / Proximity to Camera Lens
      // Wrist = 0, Middle MCP = 9, Middle Tip = 12, Index MCP = 5, Pinky MCP = 17
      const wrist = activeHandLandmarks[0];
      const middleMcp = activeHandLandmarks[9];
      const middleTip = activeHandLandmarks[12];
      const indexMcp = activeHandLandmarks[5];
      const pinkyMcp = activeHandLandmarks[17];

      // Physical hand span in normalized frame
      const palmLen = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);
      const fingerLen = Math.hypot(middleTip.x - middleMcp.x, middleTip.y - middleMcp.y);
      const palmWidth = Math.hypot(pinkyMcp.x - indexMcp.x, pinkyMcp.y - indexMcp.y);
      const estimatedSpan = Math.max(palmLen + fingerLen * 0.45, palmWidth * 1.5);

      // Map estimatedSpan (0.13 ~ 0.42) to normalized distance: 0.0 (far) to 1.0 (close)
      const rawCloseness = Math.min(1, Math.max(0, (estimatedSpan - 0.13) / 0.28));
      const distSmoothFactor = 0.25;
      handDistanceRef.current = handDistanceRef.current * (1 - distSmoothFactor) + rawCloseness * distSmoothFactor;
      
      // User rule: 手离镜头越近 -> 建筑放大; 手离镜头越远 -> 建筑缩小
      // handDistance: 0.0 (far) to 1.0 (close) -> scale: 0.55x (far) to 1.85x (close)
      const currentScale = 0.55 + handDistanceRef.current * 1.30;
      setHandDistance(handDistanceRef.current);
      setHandScale(currentScale);

      // Detect Fist Gesture
      const isFist = detectFist(activeHandLandmarks);
      setIsFistActive(isFist);

      const now = performance.now();
      const timeSinceLastTrigger = now - lastFistTriggerTime.current;
      const isCooldown = timeSinceLastTrigger < 1200;
      let currentProgress = 0;
      let triggered = false;

      if (!isFist) {
        // Hand is open or relaxed: reset hold timer and rearm trigger mechanism
        fistHoldStartTime.current = null;
        fistTriggeredRef.current = false;
        requireFistReleaseRef.current = false;
        setFistProgress(0);

        if (targetElement) {
          targetElement.classList.remove('gesture-fist-charging');
          setGestureStatus(`悬停: [${getButtonText(targetElement)}] · 单手握拳保持1.2秒即可确认`);
        } else {
          const distanceDesc = handDistanceRef.current > 0.65 ? '靠近镜头(放大)' : handDistanceRef.current < 0.35 ? '远离镜头(缩小)' : '标准距离';
          setGestureStatus(`手势追踪中 · 距离: ${distanceDesc} · 单手握拳确认`);
        }
      } else {
        // Hand is clenched into a fist
        if (requireFistReleaseRef.current || isCooldown) {
          // Locked out until user relaxes hand: prevents rapid chaining across pages
          setFistProgress(0);
          setGestureStatus('✊ 握拳已生效 · 请先张开手掌后再进行下一次确认');
        } else {
          if (targetElement) {
            targetElement.classList.add('gesture-fist-charging');
          }

          if (fistHoldStartTime.current === null) {
            fistHoldStartTime.current = now;
            fistTriggeredRef.current = false;
            sound.playHover();
          }

          // 1.2-Second Deliberate Reaction Buffer
          const HOLD_DURATION_MS = 1200;
          const elapsed = now - fistHoldStartTime.current;
          const currentProgress = Math.min(1, elapsed / HOLD_DURATION_MS);
          setFistProgress(currentProgress);

          const targetDesc = targetElement ? `[${getButtonText(targetElement)}]` : '当前操作';
          setGestureStatus(`✊ 单手握拳确认 ${targetDesc} ${Math.round(currentProgress * 100)}%...`);

          if (currentProgress >= 1 && !fistTriggeredRef.current) {
            fistTriggeredRef.current = true;
            requireFistReleaseRef.current = true;
            lastFistTriggerTime.current = now;
            triggered = true;
            sound.playConfirm();

            if (hoveredTargetRef.current) {
              const target = hoveredTargetRef.current;
              setGestureStatus(`✓ 握拳确认: ${getButtonText(target)}`);
              target.click();
            } else {
              setGestureStatus('✓ 握拳确认！');
              onFistConfirm?.();
            }
          }
        }
      }

      onGestureUpdate?.({
        hasHand: true,
        isRightHand,
        isLeftHand: !isRightHand,
        cursorX: cursorRef.current.x,
        cursorY: cursorRef.current.y,
        handDistance: handDistanceRef.current,
        handScale: currentScale,
        isFist,
        isPinching: false,
        isPalmOpen: !isFist,
        fistProgress: currentProgress,
        fistTriggered: triggered,
        hoveredElement: targetElement?.id || null,
        landmarks: handsData
      });
    },
    [onGestureUpdate, onFistConfirm]
  );

  // Initialize MediaPipe & Camera
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    try {
      await loadMediaPipeScripts();

      if (!window.Hands || !window.Camera) {
        throw new Error('MediaPipe 脚本加载失败，请使用鼠标模拟手势模式');
      }

      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5
      });

      hands.onResults(handleResults);
      handsInstanceRef.current = hands;

      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.setAttribute('playsinline', '');
      }

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsInstanceRef.current) {
            await handsInstanceRef.current.send({ image: videoRef.current });
          }
        },
        width: 320,
        height: 240
      });

      await camera.start();
      cameraInstanceRef.current = camera;
      setCameraActive(true);
      setCameraLoading(false);
      setGestureStatus('手势追踪已就绪');
    } catch (err: unknown) {
      console.warn('Camera/MediaPipe init error:', err);
      const errMsg = err instanceof Error ? err.message : '无法访问摄像头或权限被拒绝';
      setCameraError(errMsg);
      setCameraLoading(false);
      setCameraActive(false);
      setMouseSimMode(true); // Auto fallback to mouse simulation
    }
  };

  const stopCamera = () => {
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }
    if (handsInstanceRef.current?.close) {
      handsInstanceRef.current.close();
      handsInstanceRef.current = null;
    }
    setCameraActive(false);
    setGestureStatus('手势追踪已暂停');
  };

  // Mouse Simulation Handler for testing without camera
  useEffect(() => {
    if (!mouseSimMode) return;

    let holdTimer: number | null = null;
    let holdStart = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      cursorRef.current = { x: normX, y: normY };

      // Hit-test clickable elements in mouse simulation
      const targetElement = getClickableAt(e.clientX, e.clientY);
      if (hoveredTargetRef.current && hoveredTargetRef.current !== targetElement) {
        hoveredTargetRef.current.classList.remove('gesture-hover-target', 'gesture-fist-charging');
      }
      if (targetElement) {
        targetElement.classList.add('gesture-hover-target');
        setHoveredButtonLabel(getButtonText(targetElement));
      } else {
        setHoveredButtonLabel(null);
      }
      hoveredTargetRef.current = targetElement;

      // In mouse simulation mode, Shift+Vertical move can also adjust simulated hand distance
      if (e.shiftKey) {
        const rawCloseness = 1 - normY; // Move mouse up -> closer to camera (distance=1), move down -> farther (distance=0)
        simDistanceRef.current = rawCloseness;
        const currentScale = 0.55 + simDistanceRef.current * 1.30;
        setHandDistance(simDistanceRef.current);
        setHandScale(currentScale);
      }

      const currentScale = 0.55 + simDistanceRef.current * 1.30;

      onGestureUpdate?.({
        hasHand: true,
        isRightHand: true,
        isLeftHand: false,
        cursorX: normX,
        cursorY: normY,
        handDistance: simDistanceRef.current,
        handScale: currentScale,
        isFist: isFistActive,
        isPinching: false,
        isPalmOpen: !isFistActive,
        fistProgress: 0,
        fistTriggered: false,
        hoveredElement: targetElement?.id || null,
        landmarks: []
      });
    };

    const handleWheel = (e: WheelEvent) => {
      // DeltaY < 0 -> scrolling up -> hand closer -> scale larger
      // DeltaY > 0 -> scrolling down -> hand farther away -> scale smaller
      const delta = e.deltaY * 0.0012;
      simDistanceRef.current = Math.min(1, Math.max(0, simDistanceRef.current - delta));
      const currentScale = 0.55 + simDistanceRef.current * 1.30;
      setHandDistance(simDistanceRef.current);
      setHandScale(currentScale);

      onGestureUpdate?.({
        hasHand: true,
        isRightHand: true,
        isLeftHand: false,
        cursorX: cursorRef.current.x,
        cursorY: cursorRef.current.y,
        handDistance: simDistanceRef.current,
        handScale: currentScale,
        isFist: isFistActive,
        isPinching: false,
        isPalmOpen: !isFistActive,
        fistProgress: 0,
        fistTriggered: false,
        hoveredElement: hoveredTargetRef.current?.id || null,
        landmarks: []
      });
    };

    const handleMouseDown = () => {
      const now = performance.now();
      if (now - lastFistTriggerTime.current < 1200) return;

      setIsFistActive(true);
      if (hoveredTargetRef.current) {
        hoveredTargetRef.current.classList.add('gesture-fist-charging');
      }
      holdStart = performance.now();

      const checkHold = () => {
        const elapsed = performance.now() - holdStart;
        const prog = Math.min(1, elapsed / 1200);
        setFistProgress(prog);

        if (prog >= 1) {
          lastFistTriggerTime.current = performance.now();
          sound.playConfirm();
          if (hoveredTargetRef.current) {
            const target = hoveredTargetRef.current;
            setGestureStatus(`✓ 握拳确认: ${getButtonText(target)}`);
            target.click();
          } else {
            setGestureStatus('✓ 握拳确认！');
            onFistConfirm?.();
          }
          setFistProgress(0);
          setIsFistActive(false);
          if (hoveredTargetRef.current) {
            hoveredTargetRef.current.classList.remove('gesture-fist-charging');
          }
        } else {
          holdTimer = window.requestAnimationFrame(checkHold);
        }
      };
      holdTimer = window.requestAnimationFrame(checkHold);
    };

    const handleMouseUp = () => {
      setIsFistActive(false);
      setFistProgress(0);
      if (hoveredTargetRef.current) {
        hoveredTargetRef.current.classList.remove('gesture-fist-charging');
      }
      if (holdTimer) cancelAnimationFrame(holdTimer);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (holdTimer) cancelAnimationFrame(holdTimer);
      if (hoveredTargetRef.current) {
        hoveredTargetRef.current.classList.remove('gesture-hover-target', 'gesture-fist-charging');
      }
    };
  }, [mouseSimMode, isFistActive, onGestureUpdate, onFistConfirm]);

  // Auto start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      {/* 1. Strictly positioned Hand Tracking HUD (Top-Left corner) */}
      <div
        id="hand-tracking-hud"
        className={`fixed z-40 transition-all duration-300 ${
          compactPosition === 'top-left'
            ? 'top-4 left-4'
            : 'top-4 left-4'
        }`}
      >
        <div className="bg-[#101012]/95 border border-stone-800 backdrop-blur-md rounded-xl p-2.5 shadow-[0_0_25px_rgba(0,0,0,0.6)] w-56 flex flex-col gap-2">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-xs text-stone-300 border-b border-stone-800 pb-1.5 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="tracking-wider uppercase font-serif text-[11px] text-stone-200">视觉手势捕捉</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="btn-toggle-camera"
                onClick={cameraActive ? stopCamera : startCamera}
                title={cameraActive ? '暂停摄像头' : '启动摄像头'}
                className="p-1 hover:bg-stone-800 rounded transition-colors text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {cameraActive ? <Camera className="w-3.5 h-3.5 text-[#d4af37]" /> : <CameraOff className="w-3.5 h-3.5 text-rose-400" />}
              </button>
              <button
                id="btn-toggle-sim"
                onClick={() => setMouseSimMode(!mouseSimMode)}
                title="切换鼠标模拟手势模式"
                className={`p-1 hover:bg-stone-800 rounded transition-colors cursor-pointer ${mouseSimMode ? 'text-[#d4af37]' : 'text-stone-500'}`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* HUD Landmark Canvas: ONLY shows hand skeleton points, NO raw video feed! */}
          <div className="relative w-full h-36 bg-[#080808] rounded border border-stone-800 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={220}
              height={144}
              className="w-full h-full object-cover"
            />

            {/* Loading / Error indicator */}
            {cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-stone-300 text-xs gap-1.5">
                <div className="w-5 h-5 border-2 border-stone-600 border-t-[#d4af37] rounded-full animate-spin" />
                <span className="font-mono text-[10px]">加载视觉模型中...</span>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-[#0c0c0c]/95 text-center">
                <span className="text-[10px] text-stone-300 font-serif mb-1">摄像头未启用</span>
                <span className="text-[9px] text-stone-500">已开启鼠标模拟模式（移动光标，长按鼠标模拟握拳）</span>
              </div>
            )}

            {/* Corner reticle marks */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/60 pointer-events-none" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d4af37]/60 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#d4af37]/60 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d4af37]/60 pointer-events-none" />
          </div>

          {/* Gesture Status & 1s Reaction Buffer Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] text-stone-300 font-sans">
              <span className="truncate">{gestureStatus}</span>
              {isFistActive && (
                <span className="text-[#d4af37] font-bold text-[9px] flex items-center gap-0.5 font-mono">
                  <Sparkles className="w-2.5 h-2.5" /> 握拳蓄力
                </span>
              )}
            </div>

            {/* 1s Reaction buffer progress bar */}
            <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-700 via-[#d4af37] to-amber-200 transition-all duration-75"
                style={{ width: `${fistProgress * 100}%` }}
              />
            </div>

            {/* Hand Distance & Building Zoom HUD Meter */}
            <div className="pt-1 border-t border-stone-800/80 flex flex-col gap-1 text-[9px] font-sans">
              <div className="flex justify-between text-stone-400">
                <span>镜头距离感应:</span>
                <span className="text-[#d4af37] font-mono">
                  {handDistance > 0.6 ? '靠近 (建筑放大)' : handDistance < 0.4 ? '远离 (建筑缩小)' : '居中 (1.0x)'}
                </span>
              </div>
              <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-[#d4af37] to-rose-500 transition-all duration-100"
                  style={{ width: `${Math.round(handDistance * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-stone-500">
                <span>← 远离镜头 (缩小)</span>
                <span className="font-mono text-stone-300">{(handScale).toFixed(2)}x</span>
                <span>靠近镜头 (放大) →</span>
              </div>
            </div>

            <div className="text-[9px] text-stone-500 font-sans flex justify-between pt-0.5">
              <span>移动: 平移光标</span>
              <span>握拳: 确认</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-time Screen Hand Cursor ("画面也要出现光标，显示手势现在的位置") */}
      {showCursor && (
        <div
          id="hand-gesture-cursor"
          className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(${cursorPos.x - 24}px, ${cursorPos.y - 24}px, 0)`
          }}
        >
          {/* Futuristic Reticle Outer Ring */}
          <div
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              isFistActive
                ? 'border-[#d4af37] scale-125 shadow-[0_0_20px_rgba(212,175,55,0.8)]'
                : 'border-stone-400/80 scale-100 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
            }`}
          >
            {/* Center crosshair dot */}
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                isFistActive ? 'bg-[#d4af37] scale-150' : 'bg-stone-200'
              }`}
            />

            {/* Radial SVG progress circle for 1-second fist charge */}
            {fistProgress > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="3"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 * (1 - fistProgress)}
                  className="transition-all duration-75"
                />
              </svg>
            )}
          </div>

          {/* Coordinate Tag & Hint */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#101012]/95 px-2.5 py-1 rounded-md border border-[#d4af37]/40 text-[9px] font-sans text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center gap-1.5 backdrop-blur-md">
            <span className="text-[#d4af37] text-xs">✊</span>
            {hoveredButtonLabel ? (
              isFistActive ? (
                <span className="font-semibold text-white">
                  确认中 [{hoveredButtonLabel}] {(fistProgress * 100).toFixed(0)}%
                </span>
              ) : (
                <span>
                  单手握拳确认: <strong className="text-[#d4af37] font-semibold">{hoveredButtonLabel}</strong>
                </span>
              )
            ) : isFistActive ? (
              <span className="font-semibold text-white">
                握拳确认中 {(fistProgress * 100).toFixed(0)}%
              </span>
            ) : (
              <span>单手握拳选择确认</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};

