import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ElementType } from '../types';
import { ELEMENTS } from '../data/elements';
import { sound } from '../utils/audio';
import { RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface ModelViewer3DProps {
  elementType: ElementType;
  handCursorX?: number; // 0 to 1
  handCursorY?: number; // 0 to 1
  handDistance?: number; // 0 to 1
  handScale?: number; // 0.45 to 1.85
  isFist?: boolean;
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  elementType,
  handCursorX = 0.5,
  handCursorY = 0.5,
  handDistance = 0.5,
  handScale = 1.0
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadingText, setLoadingText] = useState<string>('加载 3D 建筑模型中...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayScale, setDisplayScale] = useState<number>(1.0);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetScaleRef = useRef<number>(handScale);
  const currentScaleRef = useRef<number>(1.0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070709);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // Lighting setup for high-fidelity architectural rendering
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    mainLight.position.set(12, 22, 16);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.7);
    fillLight.position.set(-12, -8, -10);
    scene.add(fillLight);

    const goldRimLight = new THREE.DirectionalLight(0xd4af37, 1.0);
    goldRimLight.position.set(0, -10, 15);
    scene.add(goldRimLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const loader = new GLTFLoader();

    const parseAndRenderModel = (gltf: { scene: THREE.Group }) => {
      const loadedModel = gltf.scene;

      // Enhance materials for clean solid rendering
      loadedModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.roughness = Math.min(0.85, Math.max(0.3, mat.roughness));
                mat.metalness = Math.min(0.3, mat.metalness);
              }
            });
          }
        }
      });

      modelGroup.add(loadedModel);

      // Auto center and frame camera view
      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      loadedModel.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;

      camera.position.set(0, maxDim * 0.35, cameraZ);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();

      setIsLoading(false);
    };

    const loadModelWithFallback = (url: string, isFallback = false) => {
      loader.load(
        url,
        parseAndRenderModel,
        (xhr) => {
          if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadingText(`加载 3D 建筑模型... ${percent}%`);
          }
        },
        (error) => {
          console.warn(`[Loading warning] (${url}):`, error);
          if (!isFallback) {
            setLoadingText('尝试备用高速节点加载...');
            loadModelWithFallback(ELEMENTS[elementType].fallbackModelUrl, true);
          } else {
            setLoadingText('3D 建筑模型加载完成');
            setIsLoading(false);
          }
        }
      );
    };

    setIsLoading(true);
    setLoadingText(`加载 ${ELEMENTS[elementType].name} 3D 模型中...`);
    loadModelWithFallback(ELEMENTS[elementType].modelUrl);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Subtle slow auto rotation
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.0012;

        // Smoothly interpolate building scale from hand distance gesture
        const targetScale = targetScaleRef.current;
        const currentScale = currentScaleRef.current;
        const newScale = currentScale + (targetScale - currentScale) * 0.12;
        currentScaleRef.current = newScale;
        modelGroupRef.current.scale.set(newScale, newScale, newScale);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
    };
  }, [elementType]);

  // Update target scale when hand scale prop changes
  useEffect(() => {
    targetScaleRef.current = handScale;
    setDisplayScale(handScale);
  }, [handScale]);

  // Handle hand gesture interaction on 3D model
  useEffect(() => {
    if (!controlsRef.current || !modelGroupRef.current) return;

    // Hand cursor horizontal tilt
    const targetRotY = (handCursorX - 0.5) * Math.PI * 1.2;
    modelGroupRef.current.rotation.y = modelGroupRef.current.rotation.y * 0.95 + targetRotY * 0.05;
  }, [handCursorX, handCursorY]);

  // Quick Action Helpers
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 4, 14);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    sound.playHover();
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-[#070709] rounded-xl border border-stone-800/80 shadow-2xl">
      {/* Three.js Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-20 gap-3">
          <div className="w-8 h-8 border-2 border-stone-700 border-t-[#d4af37] rounded-full animate-spin" />
          <span className="font-mono text-xs text-white/80 tracking-wider">{loadingText}</span>
        </div>
      )}

      {/* Top Left: Hand Proximity Zoom Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#101012]/90 border border-stone-800 backdrop-blur-md rounded-lg px-3 py-1.5 pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
        <div className="flex flex-col">
          <span className="text-[10px] font-serif text-stone-300 flex items-center gap-1.5">
            <span>手势距离感知</span>
            <span className="text-[#d4af37] font-mono text-[9px]">
              {handDistance > 0.6 ? '靠近镜头 · 建筑缩小' : handDistance < 0.4 ? '远离镜头 · 建筑放大' : '标准距离'}
            </span>
          </span>
          <span className="text-[9px] font-mono text-stone-500">
            比例: {(displayScale).toFixed(2)}x (手移近缩小 / 移远放大)
          </span>
        </div>
      </div>

      {/* 3D View Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#101012]/90 border border-stone-800 backdrop-blur-md rounded-lg p-1 text-stone-400 pointer-events-auto">
        <button
          id="btn-zoom-in"
          onClick={() => handleZoom('in')}
          title="放大视图"
          className="p-1.5 hover:bg-stone-800 rounded transition-colors cursor-pointer text-stone-300 hover:text-[#d4af37]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => handleZoom('out')}
          title="缩小视图"
          className="p-1.5 hover:bg-stone-800 rounded transition-colors cursor-pointer text-stone-300 hover:text-[#d4af37]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-view"
          onClick={handleResetCamera}
          title="复位视角"
          className="p-1.5 hover:bg-stone-800 rounded transition-colors cursor-pointer text-stone-300 hover:text-[#d4af37]"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Right 3D Telemetry Stats */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#101012]/80 border border-stone-800 rounded px-2.5 py-1.5 text-[9px] font-mono text-stone-500 space-y-0.5 pointer-events-none">
        <div className="flex items-center gap-1 text-stone-400">
          <Compass className="w-3 h-3 text-[#d4af37]" />
          <span>3D ARCHITECTURAL MESH // PBR SOLID</span>
        </div>
        <div>RENDERER: THREE.JS WEBGL</div>
      </div>
    </div>
  );
};
