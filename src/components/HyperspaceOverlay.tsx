import { useEffect, useRef } from 'react';

export default function HyperspaceOverlay({ active }: { active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        let stars: any[] = [];
        let animationFrameId: number;

        const createStars = () => {
            stars = [];
            for (let i = 0; i < 400; i++) {
                stars.push({
                    x: Math.random() * w - w / 2,
                    y: Math.random() * h - h / 2,
                    z: Math.random() * 2000,
                    prevZ: Math.random() * 2000,
                });
            }
        };

        createStars();

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;

            const speed = active ? 40 : 0.5;

            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                star.prevZ = star.z;
                star.z -= speed;

                if (star.z < 1) {
                    star.x = Math.random() * w - w / 2;
                    star.y = Math.random() * h - h / 2;
                    star.z = 2000;
                    star.prevZ = 2000;
                }

                const projX = (star.x / star.z) * 1000 + cx;
                const projY = (star.y / star.z) * 1000 + cy;

                const prevProjX = (star.x / star.prevZ) * 1000 + cx;
                const prevProjY = (star.y / star.prevZ) * 1000 + cy;

                // Si la estrella no está en pantalla, no dibujar la línea
                if (projX < 0 || projX > w || projY < 0 || projY > h) continue;

                const colorVal = active ? Math.min(255, 255 - star.z / 10) : 255;
                // Hacer las estrellas ligeramente azules durante el hyperjump para el feel de Star Wars
                ctx.strokeStyle = active ? `rgba(${colorVal}, ${colorVal}, 255, 1)` : `rgba(255, 255, 255, ${1 - star.z / 2000})`;
                ctx.lineWidth = active ? 2 : 1;
                ctx.beginPath();
                ctx.moveTo(prevProjX, prevProjY);
                ctx.lineTo(projX, projY);
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            createStars();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [active]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-50 pointer-events-none mix-blend-screen transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'
                }`}
        />
    );
}
