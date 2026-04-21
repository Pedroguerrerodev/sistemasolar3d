import { useEffect, useRef } from 'react';

type Dot = { x: number; y: number; a: number; r: number };

const TRAIL_MAX = 24;

export default function StarCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const trailRef = useRef<Dot[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      trailRef.current.unshift({ x: e.clientX, y: e.clientY, a: 1, r: 3 });
      if (trailRef.current.length > TRAIL_MAX) trailRef.current.length = TRAIL_MAX;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);

    let frame = 0;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.a *= 0.88;
        p.r *= 0.97;
        if (p.a < 0.02) trailRef.current.splice(i, 1);
      }

      trailRef.current.forEach((p, i) => {
        const k = 1 - i / TRAIL_MAX;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7 * k);
        glow.addColorStop(0, `rgba(255,190,70,${p.a * 0.35 * k})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 7 * k, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,235,160,${p.a * k})`;
        ctx.fill();
      });

      const { x, y } = mouseRef.current;
      if (x >= 0) {
        const pulse = 1 + Math.sin(frame * 0.08) * 0.08;

        const halo = ctx.createRadialGradient(x, y, 0, x, y, 16 * pulse);
        halo.addColorStop(0, 'rgba(255,220,120,0.28)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, 16 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff7d5';
        ctx.shadowBlur = 9;
        ctx.shadowColor = 'rgba(255,200,70,0.9)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />;
}
