import React, { useEffect, useRef } from 'react';
import { PageStep } from '../types';

interface CyberBackgroundProps {
  intensity?: number;
  pageStep?: PageStep;
  mode?: 'dotmatrix' | 'blueprint' | 'dense';
}

interface SparseParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  pulseSpeed: number;
  phase: number;
  r: number;
  g: number;
  b: number;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({
  intensity = 0.5,
  pageStep = 'welcome'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageStepRef = useRef<PageStep>(pageStep);
  const intensityRef = useRef<number>(intensity);

  useEffect(() => {
    pageStepRef.current = pageStep;
  }, [pageStep]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize sparse, elegant floating background particles (approx 45 particles)
    const particleCount = 45;
    const particles: SparseParticle[] = [];
    
    // Palette of warm Lingnan architectural gold, amber & celestial glow
    const palette = [
      { r: 212, g: 175, b: 55 },  // Lingnan Architectural Gold
      { r: 245, g: 158, b: 11 },  // Warm Amber
      { r: 254, g: 243, b: 199 }, // Pale Golden Stardust
      { r: 180, g: 140, b: 60 },  // Ochre
      { r: 125, g: 211, b: 252 }  // Cyan Celestial accent (very sparse)
    ];

    for (let i = 0; i < particleCount; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.2, // 1.2px to 3.4px soft radius
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,  // Gentle upward float
        baseAlpha: 0.12 + Math.random() * 0.22, // Soft and non-intrusive (0.12 ~ 0.34)
        pulseSpeed: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        r: color.r,
        g: color.g,
        b: color.b
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Parallax mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Digital Oscilloscope Crosshair Helper
    const drawCalibrationCross = (cx: number, cy: number, size = 4, alpha = 0.15) => {
      const activeIntensity = intensityRef.current;
      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha * activeIntensity * 1.5})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx + size, cy);
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx, cy + size);
      ctx.stroke();
    };

    let time = 0;

    // =========================================================================
    // CLEAN OSCILLOSCOPE & SPARSE FLOATING PARTICLES CANVAS (NO BUILDINGS)
    // =========================================================================
    const render = () => {
      time += 0.006;
      const activeIntensity = intensityRef.current;

      // Dark digital canvas background
      ctx.fillStyle = 'rgba(7, 7, 9, 0.45)';
      ctx.fillRect(0, 0, width, height);

      ctx.save();

      // 1. Digital Coordinate Matrix Grid (Subtle and deep)
      const gridSpacing = 80;
      const offsetX = (mouseX * 12) % gridSpacing;
      const offsetY = (mouseY * 12) % gridSpacing;

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 * activeIntensity * 2})`;
      ctx.lineWidth = 0.5;

      for (let gx = offsetX; gx < width + gridSpacing; gx += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      for (let gy = offsetY; gy < height + gridSpacing; gy += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Calibration Crosses at Grid Intersections
      for (let gx = offsetX; gx < width + gridSpacing; gx += gridSpacing * 2) {
        for (let gy = offsetY; gy < height + gridSpacing; gy += gridSpacing * 2) {
          drawCalibrationCross(gx, gy, 3, 0.15);
        }
      }

      // 2. Sparse Floating Atmospheric Particles (Non-intrusive & rich)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update positions with subtle floating physics and gentle horizontal drift
        p.y += p.vy;
        p.x += p.vx + Math.sin(time * 0.8 + p.phase) * 0.18;

        // Wrap around boundaries smoothly
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        // Dynamic pulsing opacity
        const pulse = Math.sin(time * p.pulseSpeed + p.phase);
        const currentAlpha = Math.max(
          0.04,
          (p.baseAlpha + pulse * 0.12) * activeIntensity
        );

        // Soft radial glow gradient for each particle
        const glowRadius = p.radius * 3.5;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha})`);
        grad.addColorStop(0.35, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha * 0.55})`);
        grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bright delicate center point
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Screen Boundary Frame & Corner Markers
      const margin = 24;
      const cLen = 16;
      ctx.strokeStyle = `rgba(212, 175, 55, ${0.22 * activeIntensity * 2})`;
      ctx.lineWidth = 1;

      // Top Left Corner
      ctx.beginPath();
      ctx.moveTo(margin, margin + cLen);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cLen, margin);
      // Top Right Corner
      ctx.moveTo(width - margin - cLen, margin);
      ctx.lineTo(width - margin, margin);
      ctx.lineTo(width - margin, margin + cLen);
      // Bottom Left Corner
      ctx.moveTo(margin, height - margin - cLen);
      ctx.lineTo(margin, height - margin);
      ctx.lineTo(margin + cLen, height - margin);
      // Bottom Right Corner
      ctx.moveTo(width - margin - cLen, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.lineTo(width - margin, height - margin - cLen);
      ctx.stroke();

      // Small corner decorative points
      ctx.fillStyle = `rgba(212, 175, 55, ${0.4 * activeIntensity * 2})`;
      ctx.fillRect(margin - 1.5, margin - 1.5, 3, 3);
      ctx.fillRect(width - margin - 1.5, margin - 1.5, 3, 3);
      ctx.fillRect(margin - 1.5, height - margin - 1.5, 3, 3);
      ctx.fillRect(width - margin - 1.5, height - margin - 1.5, 3, 3);

      // 4. Subtle Oscilloscope Scanning Line
      const sweepY = (time * 120) % (height + 100) - 50;
      const sweepGrad = ctx.createLinearGradient(0, sweepY - 20, 0, sweepY + 20);
      sweepGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
      sweepGrad.addColorStop(0.5, `rgba(212, 175, 55, ${0.018 * activeIntensity * 2})`);
      sweepGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, sweepY - 20, width, 40);

      // Scanline phosphor texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#070709' }}
    />
  );
};
