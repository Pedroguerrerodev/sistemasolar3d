import { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    alpha: number;
    speed: number;
    depth: number;
    hue: number;
}

const STAR_COUNT = 260;

export default function CosmicBackdrop() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random(),
            y: Math.random(),
            size: 0.4 + Math.random() * 1.8,
            alpha: 0.2 + Math.random() * 0.6,
            speed: 0.15 + Math.random() * 0.55,
            depth: Math.random(),
            hue: Math.random() > 0.82 ? 38 : Math.random() > 0.66 ? 215 : 0,
        }));

        const pointer = { x: 0, y: 0 };
        const smooth = { x: 0, y: 0 };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const onMove = (event: MouseEvent) => {
            pointer.x = event.clientX / window.innerWidth - 0.5;
            pointer.y = event.clientY / window.innerHeight - 0.5;
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMove);

        let time = 0;
        let raf = 0;

        const draw = () => {
            raf = requestAnimationFrame(draw);
            time += 0.01;
            smooth.x += (pointer.x - smooth.x) * 0.025;
            smooth.y += (pointer.y - smooth.y) * 0.025;

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            for (const star of stars) {
                const parallax = 8 + star.depth * 34;
                const x = star.x * width + smooth.x * parallax;
                const y = star.y * height + smooth.y * parallax * 0.65;
                const twinkle = 0.82 + Math.sin(time * star.speed + star.x * 10) * 0.18;
                const radius = star.size * twinkle;
                const alpha = star.alpha * (0.7 + twinkle * 0.3);

                const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
                const color = star.hue === 0
                    ? `rgba(255,255,255,${alpha * 0.45})`
                    : star.hue === 38
                        ? `rgba(255,214,150,${alpha * 0.4})`
                        : `rgba(165,200,255,${alpha * 0.35})`;

                glow.addColorStop(0, color);
                glow.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.beginPath();
                ctx.arc(x, y, radius * 4.5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = star.hue === 0
                    ? `rgba(255,255,255,${alpha})`
                    : star.hue === 38
                        ? `rgba(255,228,190,${alpha})`
                        : `rgba(190,220,255,${alpha})`;
                ctx.fill();
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMove);
        };
    }, []);

    return (
        <>
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -left-[12%] top-[4%] h-[42vw] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(255,129,61,0.10),rgba(255,129,61,0)_62%)] blur-3xl" />
                <div className="absolute right-[-8%] top-[12%] h-[34vw] w-[34vw] rounded-full bg-[radial-gradient(circle,rgba(88,123,255,0.10),rgba(88,123,255,0)_64%)] blur-3xl" />
                <div className="absolute bottom-[-10%] left-[18%] h-[26vw] w-[26vw] rounded-full bg-[radial-gradient(circle,rgba(255,220,148,0.08),rgba(255,220,148,0)_66%)] blur-3xl" />
                <div className="absolute left-[10%] top-[14%] h-[16vw] w-[34vw] rotate-[-18deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),rgba(147,172,255,0.04)_30%,rgba(0,0,0,0)_72%)] blur-2xl opacity-80" />
                <div className="absolute right-[8%] bottom-[16%] h-[14vw] w-[28vw] rotate-[22deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,214,153,0.08),rgba(255,214,153,0.03)_28%,rgba(0,0,0,0)_72%)] blur-2xl opacity-70" />
            </div>
            <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
        </>
    );
}
