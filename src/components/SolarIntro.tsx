import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SunCanvas from './SunCanvas';

interface Props {
  onComplete: () => void;
}

const STARS = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() < 0.14 ? 2 : 1,
  opacity: 0.2 + Math.random() * 0.5,
}));

export default function SolarIntro({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.set([sunRef.current, contentRef.current], { opacity: 0, y: 20, scale: 0.95 });
    const tl = gsap.timeline();
    tl.to(sunRef.current, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' })
      .to(contentRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5');
    return () => tl.kill();
  }, []);

  const handleStart = () => {
    const tl = gsap.timeline({ onComplete });
    tl.to(sunRef.current, { scale: 1.25, opacity: 0, duration: 0.7, ease: 'power2.in' })
      .to(contentRef.current, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 0)
      .to(rootRef.current, { opacity: 0, duration: 0.25 }, '-=0.2');
  };

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, top: s.top, left: s.left, opacity: s.opacity }}
          />
        ))}
      </div>

      <div ref={sunRef} className="relative z-10">
        <SunCanvas size={220} />
      </div>

      <div ref={contentRef} className="relative z-20 mt-10 text-center px-6">
        <p className="text-[10px] tracking-[0.45em] text-[#e89c51] mb-2 pl-[0.45em]">EXPLORADOR</p>
        <h1 className="text-4xl md:text-6xl tracking-[0.45em] text-white font-thin mb-2 pl-[0.45em]">SOLAR</h1>
        <p className="text-[9px] md:text-[10px] tracking-[0.3em] text-gray-500 mb-10 pl-[0.3em]">NUESTRO SISTEMA SOLAR EN THREE.JS</p>

        <button
          onClick={handleStart}
          className="group relative px-12 py-3 border border-[#e89c51]/70 text-[#e89c51] text-[10px] tracking-[0.45em] overflow-hidden hover:text-black transition-colors"
        >
          <span className="absolute inset-0 bg-[#e89c51] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
          <span className="relative">COMENZAR</span>
        </button>
      </div>
    </div>
  );
}
