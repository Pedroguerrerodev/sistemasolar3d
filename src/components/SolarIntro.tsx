import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SunCanvas from './SunCanvas';

interface Props {
  onComplete: () => void;
}

const STARS = Array.from({ length: 180 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() < 0.14 ? 2 : 1,
  opacity: 0.1 + Math.random() * 0.7,
  duration: 2 + Math.random() * 4,
}));

const TERMINAL_LINES = [
  "INICIANDO INTERFAZ DE NAVEGACIÓN...",
  "ESTABLECIENDO ENLACE ORBITAL...",
  "CALIBRANDO SENSORES GRAVITACIONALES...",
  "ACTIVANDO MOTORES DE CURVATURA...",
  "SISTEMAS AL 100%. LISTO PARA EL LANZAMIENTO."
];

export default function SolarIntro({ onComplete }: Props) {
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < TERMINAL_LINES.length) {
        setBootLines((prev) => [...prev, TERMINAL_LINES[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 1000);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setIsLeaving(true);
    setTimeout(onComplete, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isLeaving ? 0 : 1 }}
      transition={{ duration: 1, ease: 'easeIn' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      {/* Fondo de estrellas parpadeantes */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            initial={{ opacity: s.opacity }}
            animate={{ opacity: [s.opacity, s.opacity * 0.2, s.opacity] }}
            transition={{ duration: s.duration, repeat: Infinity, ease: 'linear' }}
            style={{ width: s.size, height: s.size, top: s.top, left: s.left }}
          />
        ))}
      </div>

      <AnimatePresence>
        {/* Destello blanco global (transición a 3D) */}
        {isLeaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
          />
        )}

        {booting && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute bottom-1/4 left-1/4 md:left-10 text-[9px] md:text-xs font-mono text-[#e89c51]/80 tracking-widest text-left"
          >
            {bootLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-2"
              >
                &gt; {line}
              </motion.div>
            ))}
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="mt-2 w-2 h-4 bg-[#e89c51]"
            />
          </motion.div>
        )}

        {!booting && (
          <motion.div
            key="main"
            className="relative z-10 flex flex-col items-center justify-center w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {/* Halo de luz radial detrás del sol */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isLeaving ? { scale: 5, opacity: 1 } : { scale: 1, opacity: 0.5 }}
              transition={{ duration: isLeaving ? 1.2 : 3, ease: 'easeIn' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] md:w-[40vw] aspect-square rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,rgba(232,156,81,0.5)_40%,transparent_80%)] blur-[20px] pointer-events-none z-0"
            />

            <motion.div
              className="relative z-10"
              animate={isLeaving ? { scale: 3, opacity: 0, y: -100 } : { scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeIn' }}
            >
              <SunCanvas size={280} />
            </motion.div>

            <motion.div
              className="relative z-20 mt-10 text-center px-6 max-w-3xl"
              animate={isLeaving ? { y: 100, opacity: 0, scale: 0.8 } : { y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeIn' }}
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.2em" }}
                animate={{ opacity: 1, letterSpacing: "0.5em" }}
                transition={{ duration: 2, delay: 0.2 }}
                className="text-[10px] md:text-sm text-[#e89c51] mb-2 uppercase"
              >
                SISTEMA OPERATIVO
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                className="text-4xl sm:text-5xl md:text-7xl tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.45em] text-white font-thin mb-8 pl-[0.2em] sm:pl-[0.3em] md:pl-[0.45em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] min-w-[300px]"
              >
                EXPLORADOR<br />SOLAR
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="text-[8px] sm:text-[9px] md:text-[11px] leading-[2] sm:leading-[2.5] tracking-[0.15em] sm:tracking-[0.25em] text-gray-400 mb-12 px-0 sm:px-2 md:px-12 uppercase font-light max-w-[90vw]"
              >
                Tu misión es explorar el espacio más allá de nuestro sistema solar.<br />
                <motion.span
                  animate={{ color: ["#9ca3af", "#ef4444", "#9ca3af"], textShadow: ["0 2px 5px rgba(255,0,0,0)", "0 2px 15px rgba(255,0,0,0.8)", "0 2px 5px rgba(255,0,0,0)"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 3 }}
                  className="font-bold tracking-[0.2em] sm:tracking-[0.3em] mt-3 block shadow-red"
                >
                  ADVERTENCIA: Evita acercarte al Punto de Singularidad.
                </motion.span>
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 2.2 }}
                onClick={handleStart}
                className="group relative px-6 sm:px-12 py-3 sm:py-4 border border-[#e89c51]/40 text-[#e89c51] text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.5em] overflow-hidden transition-all duration-300 hover:border-[#e89c51] hover:shadow-[0_0_20px_rgba(232,156,81,0.4)] hover:bg-white"
              >
                <span className="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover:text-black group-hover:font-bold">
                  INICIAR MOTOR DE SALTO
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>

                {/* Luz blanca de hiperespacio al hacer click (Warp Jump Effect) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isLeaving ? { opacity: 1, scale: 50 } : { opacity: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: "circIn" }}
                  className="absolute inset-0 bg-white z-50 pointer-events-none blend-screen rounded-full origin-center"
                />

                {/* Lector de escaneo de fondo */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full w-[200%] bg-gradient-to-r from-transparent via-[#e89c51]/20 to-transparent transition-transform duration-1000 mix-blend-screen" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de escaneo / Estética UI futurista */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30" />

      {/* Viñeta para darle un tono de cine */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />

      {/* Créditos del creador (Desplazado abajo a la derecha estilo terminal) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booting || isLeaving ? 0 : 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute bottom-6 right-6 z-50 text-right"
      >
        <p className="text-[7px] md:text-[9px] tracking-[0.3em] font-mono text-gray-600 uppercase">
          SYS.VER 1.0.42 // AUTORIZADO POR:<br />
          <a
            href="https://portfoliominimal-nu.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] md:text-[12px] font-semibold text-[#e89c51]/80 hover:text-[#e89c51] transition-colors inline-block mt-1"
          >
            &gt; Pedro Guerrero Pinta
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
