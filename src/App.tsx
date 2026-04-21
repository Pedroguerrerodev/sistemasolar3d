/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PlanetScene from './components/PlanetScene';
import SolarIntro from './components/SolarIntro';
import StarCursor from './components/StarCursor';
import CosmicBackdrop from './components/CosmicBackdrop';
import { useSpaceAudio } from './hooks/useSpaceAudio';

const PLANETS = [
  {
    id: 'pluto', name: 'PLUTÓN', distance: '39,5 UA', distanceKm: '5.906 M km', color: '#8B7355',
    description: 'UNA VEZ CONSIDERADO EL NOVENO PLANETA, PLUTÓN ES UN PLANETA ENANO EN EL CINTURÓN DE KUIPER. TIENE UNA SUPERFICIE COMPLEJA CON MONTAÑAS DE HIELO DE AGUA.',
    gravity: 0.063, temp: '-230 °C', moons: 5, diameter: '2.377 km',
  },
  {
    id: 'neptune', name: 'NEPTUNO', distance: '30,06 UA', distanceKm: '4.495 M km', color: '#274687',
    description: 'OSCURO, FRÍO Y AZOTADO POR VIENTOS SUPERSÓNICOS, EL GIGANTE DE HIELO NEPTUNO ES EL OCTAVO Y MÁS DISTANTE PLANETA DE NUESTRO SISTEMA SOLAR.',
    gravity: 1.14, temp: '-201 °C', moons: 16, diameter: '49.528 km',
  },
  {
    id: 'uranus', name: 'URANO', distance: '19,18 UA', distanceKm: '2.871 M km', color: '#82b3d1',
    description: 'URANO ES EL SÉPTIMO PLANETA DESDE EL SOL. TIENE EL TERCER RADIO PLANETARIO MÁS GRANDE Y LA CUARTA MASA PLANETARIA MÁS GRANDE.',
    gravity: 0.89, temp: '-197 °C', moons: 28, diameter: '51.118 km',
  },
  {
    id: 'saturn', name: 'SATURNO', distance: '9,539 UA', distanceKm: '1.429 M km', color: '#e3cb8f',
    description: 'ADORNADO CON UN DESLUMBRANTE Y COMPLEJO SISTEMA DE ANILLOS DE HIELO, SATURNO ES ÚNICO EN NUESTRO SISTEMA SOLAR. ES EL SEGUNDO PLANETA MÁS GRANDE.',
    gravity: 1.07, temp: '-178 °C', moons: 146, diameter: '116.460 km',
  },
  {
    id: 'jupiter', name: 'JÚPITER', distance: '5,203 UA', distanceKm: '778,6 M km', color: '#c99b75',
    description: 'JÚPITER ES MÁS DEL DOBLE DE MASIVO QUE EL RESTO DE LOS PLANETAS DE NUESTRO SISTEMA SOLAR COMBINADOS. LA GRAN MANCHA ROJA ES UNA TORMENTA DE SIGLOS DE ANTIGÜEDAD.',
    gravity: 2.53, temp: '-145 °C', moons: 95, diameter: '139.820 km',
  },
  {
    id: 'mars', name: 'MARTE', distance: '1,524 UA', distanceKm: '227,9 M km', color: '#c1440e',
    description: 'MARTE ES UN MUNDO POLVORIENTO, FRÍO Y DESÉRTICO CON UNA ATMÓSFERA MUY DELGADA. HAY EVIDENCIA SÓLIDA DE QUE MARTE FUE, HACE MILES DE MILLONES DE AÑOS, MÁS HÚMEDO Y CÁLIDO.',
    gravity: 0.38, temp: '-65 °C', moons: 2, diameter: '6.779 km',
  },
  {
    id: 'earth', name: 'TIERRA', distance: '1,00 UA', distanceKm: '149,6 M km', color: '#4b759e',
    description: 'NUESTRO PLANETA ES EL ÚNICO LUGAR QUE CONOCEMOS HABITADO POR SERES VIVOS. TAMBIÉN ES EL ÚNICO PLANETA EN NUESTRO SISTEMA SOLAR CON AGUA LÍQUIDA EN LA SUPERFICIE.',
    gravity: 1.0, temp: '15 °C', moons: 1, diameter: '12.742 km',
  },
  {
    id: 'venus', name: 'VENUS', distance: '0,723 UA', distanceKm: '108,2 M km', color: '#e89c51',
    description: 'NOMBRADO POR LA DIOSA ROMANA DEL AMOR Y LA BELLEZA. EN LA ANTIGÜEDAD, VENUS ERA CONSIDERADO A MENUDO DOS ESTRELLAS DISTINTAS: LA ESTRELLA VESPERTINA Y LA MATUTINA.',
    gravity: 0.904, temp: '465 °C', moons: 0, diameter: '12.104 km',
  },
  {
    id: 'mercury', name: 'MERCURIO', distance: '0,39 UA', distanceKm: '57,9 M km', color: '#888888',
    description: 'EL PLANETA MÁS PEQUEÑO DE NUESTRO SISTEMA SOLAR Y EL MÁS CERCANO AL SOL, MERCURIO ES SOLO LIGERAMENTE MÁS GRANDE QUE LA LUNA DE LA TIERRA.',
    gravity: 0.38, temp: '167 °C', moons: 0, diameter: '4.879 km',
  },
];

const PLANET_CURIOSITIES: Record<string, string[]> = {
  pluto: [
    'UN AÑO EN PLUTÓN DURA 248 AÑOS TERRESTRES.',
    'SU MAYOR LUNA, CARONTE, ES TAN GRANDE QUE FORMAN CASI UN SISTEMA DOBLE.',
    'TIENE MONTAÑAS DE HIELO DE AGUA TAN DURAS COMO LA ROCA A ESAS TEMPERATURAS.',
  ],
  neptune: [
    'SUS VIENTOS PUEDEN SUPERAR LOS 2.000 KM/H.',
    'FUE EL PRIMER PLANETA DESCUBIERTO MEDIANTE CÁLCULOS MATEMÁTICOS ANTES DE OBSERVARSE.',
    'EMITE MÁS ENERGÍA DE LA QUE RECIBE DEL SOL.',
  ],
  uranus: [
    'GIRA PRÁCTICAMENTE TUMBADO SOBRE SU EJE.',
    'UNA ESTACIÓN EN URANO PUEDE DURAR MÁS DE 20 AÑOS TERRESTRES.',
    'SU COLOR AZUL VERDOSO SE DEBE AL METANO EN SU ATMÓSFERA.',
  ],
  saturn: [
    'SUS ANILLOS ESTÁN HECHOS SOBRE TODO DE HIELO Y POLVO.',
    'ES TAN POCO DENSO QUE FLOTARÍA EN AGUA SI EXISTIERA UN OCÉANO LO BASTANTE GRANDE.',
    'TIENE DECENAS DE LUNAS, MUCHAS DE ELLAS HELADAS.',
  ],
  jupiter: [
    'LA GRAN MANCHA ROJA ES UNA TORMENTA GIGANTE ACTIVA DESDE HACE SIGLOS.',
    'SU CAMPO MAGNÉTICO ES EL MÁS POTENTE DE TODOS LOS PLANETAS DEL SISTEMA SOLAR.',
    'TIENE TANTÍSIMA MASA QUE INFLUYE EN LA ESTABILIDAD DE MUCHOS OBJETOS CERCANOS.',
  ],
  mars: [
    'ALBERGA EL OLYMPUS MONS, EL VOLCÁN MÁS GRANDE CONOCIDO DEL SISTEMA SOLAR.',
    'SUS ATARDECERES TIENEN TONOS AZULADOS POR EL POLVO DE SU ATMÓSFERA.',
    'UN DÍA MARCIANO DURA SOLO UN POCO MÁS QUE UN DÍA TERRESTRE.',
  ],
  earth: [
    'ES EL ÚNICO PLANETA CON AGUA LÍQUIDA ESTABLE EN SUPERFICIE CONFIRMADA.',
    'SU ATMÓSFERA BLOQUEA GRAN PARTE DE LA RADIACIÓN DAÑINA DEL SOL.',
    'LA LUNA AYUDA A ESTABILIZAR LA INCLINACIÓN DEL EJE TERRESTRE.',
  ],
  venus: [
    'UN DÍA EN VENUS DURA MÁS QUE UN AÑO EN VENUS.',
    'GIRA EN SENTIDO CONTRARIO AL DE LA MAYORÍA DE LOS PLANETAS.',
    'SU EFECTO INVERNADERO EXTREMO LO CONVIERTE EN EL PLANETA MÁS CALIENTE.',
  ],
  mercury: [
    'TIENE CAMBIOS DE TEMPERATURA EXTREMOS ENTRE EL DÍA Y LA NOCHE.',
    'CASI NO TIENE ATMÓSFERA, POR ESO no RETIENE BIEN EL CALOR.',
    'SU SUPERFICIE ESTÁ MUY MARCADA POR IMPACTOS DE ASTEROIDES.',
  ],
};

function formatDistance(planet: { distance: string; distanceKm: string }, compact = false) {
  return compact
    ? `${planet.distance} · ${planet.distanceKm}`
    : `${planet.distance} · ${planet.distanceKm}`;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeIndex, setActiveIndex] = useState(7);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const { startAmbient, playPlanetSound, toggleMute, muted, started } = useSpaceAudio();

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    startAmbient();
  }, [startAmbient]);

  // Iniciar audio en primera interacción del usuario
  const handleFirstInteraction = useCallback((index: number) => {
    startAmbient();
    setActiveIndex(index);
    playPlanetSound(index);
  }, [startAmbient, playPlanetSound]);

  useEffect(() => {
    setIsTransitioning(true);
    setShowPanel(false);
    const timer = setTimeout(() => setIsTransitioning(false), 2200);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Sonido al cambiar planeta (solo si ya inició el audio)
  useEffect(() => {
    if (started) playPlanetSound(activeIndex);
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navegación por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      startAmbient();
      setActiveIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      startAmbient();
      setActiveIndex(prev => Math.min(PLANETS.length - 1, prev + 1));
    } else if (e.key === 'Escape') {
      setShowPanel(false);
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMute();
    }
  }, [startAmbient, toggleMute]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activePlanet = PLANETS[activeIndex];
  const weightOnPlanet = weightKg !== '' && !isNaN(Number(weightKg))
    ? (Number(weightKg) * activePlanet.gravity).toFixed(1)
    : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-orange-500/30 select-none" style={{ cursor: 'none' }}>
      <StarCursor />
      <CosmicBackdrop />
      <AnimatePresence>
        {showIntro && <SolarIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <PlanetScene activeIndex={activeIndex} onPlanetChange={setActiveIndex} />

      {/* Top Header */}
      <div className="absolute top-[4%] md:top-[6%] left-1/2 -translate-x-1/2 text-center tracking-[0.4em] z-10 pl-[0.4em]">
        <h1 className="text-[10px] md:text-sm font-light text-gray-200">EXPLORADOR SOLAR</h1>
        <p className="text-[8px] md:text-[10px] text-[#e89c51] mt-1 md:mt-2">SOLO CON THREE.JS</p>
      </div>

      {/* Hint teclado + botón mute */}
      <div className="absolute top-[4%] md:top-[6%] right-4 md:right-10 z-10 flex flex-col items-end gap-2">
        <button
          onClick={toggleMute}
          title={muted ? 'Activar sonido (M)' : 'Silenciar (M)'}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <span className="text-[8px] text-gray-600 tracking-widest hidden md:block">↑ ↓ NAVEGAR · M MUTE</span>
      </div>

      {/* Top Planet Bottom Half Shadow Overlay */}
      {activeIndex > 0 && (
        <div
          className={`absolute left-0 right-0 z-10 pointer-events-none transition-opacity ${isTransitioning ? 'opacity-0 duration-0' : 'opacity-100 duration-1000'}`}
          style={{
            top: '16%',
            height: '36%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.32) 62%, rgba(0,0,0,0.14) 82%, rgba(0,0,0,0) 100%)',
          }}
        />
      )}

      {/* Center Content (Next Planet Name) */}
      {activeIndex > 0 && (
        <div
          className="absolute top-[14%] md:top-[18%] left-1/2 -translate-x-1/2 text-center tracking-[0.2em] z-20 cursor-pointer opacity-60 hover:opacity-100 transition-opacity pl-[0.2em]"
          onClick={() => handleFirstInteraction(activeIndex - 1)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`next-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
            >
              <p className="text-[8px] text-gray-400 mb-1">PLANETA</p>
              <h2 className="text-xs text-gray-200">{PLANETS[activeIndex - 1].name}</h2>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Content (Active Planet Info) */}
      <div className="absolute bottom-8 md:bottom-16 left-1/2 -translate-x-1/2 text-center z-10 w-full max-w-2xl px-4 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
          >
            <p className="text-[8px] md:text-[10px] tracking-[0.3em] text-[#e89c51] mb-1 md:mb-2 pl-[0.3em]">PLANETA</p>
            <h2 className="text-4xl md:text-6xl tracking-[0.4em] font-thin mb-4 md:mb-6 pl-[0.4em]">{activePlanet.name}</h2>

            <p className="text-[10px] md:text-xs leading-loose tracking-[0.2em] text-gray-300 max-w-xl mx-auto mb-6 md:mb-8 pl-[0.2em]">
              {activePlanet.description}
            </p>

            <button
              onClick={() => setShowPanel(true)}
              className="text-[8px] md:text-[10px] tracking-[0.3em] text-[#e89c51] uppercase border-b border-[#e89c51] pb-1 hover:text-white hover:border-white transition-colors pl-[0.3em]"
            >
              LEER MÁS
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left Sidebar */}
      <div className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4 md:gap-8 scale-75 md:scale-100 origin-left">
        {PLANETS.map((planet, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={planet.id}
              onClick={() => handleFirstInteraction(idx)}
              className="flex items-center gap-4 group text-left"
            >
              <div className="relative flex items-center justify-center w-4 h-4">
                <div className={`absolute w-3 h-3 rounded-full border transition-all duration-300 ${isActive ? 'border-white' : 'border-white opacity-40 group-hover:opacity-80'}`} />
                {isActive && <div className="absolute w-1.5 h-1.5 bg-white rounded-full" />}
              </div>

              <div className="flex items-center gap-3">
                {isActive ? (
                  <div className="w-8 h-[2px] bg-[#e89c51]" />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full shadow-inner opacity-50 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${planet.color} 0%, #000 80%)`,
                      boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.8), 0 0 4px ${planet.color}40`
                    }}
                  />
                )}
                <div className={`flex flex-col transition-all duration-300 ${isActive ? 'translate-x-2' : ''}`}>
                  <span className={`text-xs tracking-[0.2em] ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {planet.name}
                  </span>
                  <span className={`text-[9px] tracking-wider ${isActive ? 'text-[#e89c51]' : 'text-gray-700 group-hover:text-gray-500'}`}>
                    {formatDistance(planet, true)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel de datos físicos + calculadora de peso */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
            />

            {/* Panel lateral */}
            <motion.div
              className="absolute right-0 top-0 h-full z-40 w-full max-w-sm bg-black/90 border-l border-white/10 flex flex-col p-8 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              {/* Cerrar */}
              <button
                onClick={() => setShowPanel(false)}
                className="self-end text-gray-500 hover:text-white text-xs tracking-widest mb-8 transition-colors"
              >
                ✕ CERRAR
              </button>

              {/* Nombre planeta */}
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.4em] text-[#e89c51] mb-2">DATOS DEL PLANETA</p>
                <h2
                  className="text-3xl tracking-[0.3em] font-thin"
                  style={{ color: activePlanet.color }}
                >
                  {activePlanet.name}
                </h2>
              </div>

              {/* Datos físicos */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { label: 'DIÁMETRO', value: activePlanet.diameter },
                  { label: 'TEMPERATURA', value: activePlanet.temp },
                  { label: 'LUNAS', value: String(activePlanet.moons) },
                  { label: 'GRAVEDAD', value: `${activePlanet.gravity}g` },
                  { label: 'DISTANCIA AL SOL', value: formatDistance(activePlanet) },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-white/10 p-3">
                    <p className="text-[8px] tracking-[0.2em] text-gray-500 mb-1">{label}</p>
                    <p className="text-sm tracking-wider text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Separador */}
              <div className="border-t border-white/10 mb-8" />

              {/* Datos curiosos */}
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.4em] text-[#e89c51] mb-4">DATOS CURIOSOS</p>
                <div className="space-y-3">
                  {PLANET_CURIOSITIES[activePlanet.id].map((fact) => (
                    <div key={fact} className="border border-white/10 p-3 bg-white/[0.02]">
                      <p className="text-[10px] leading-relaxed tracking-[0.12em] text-gray-300">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-white/10 mb-8" />

              {/* Calculadora de peso */}
              <div>
                <p className="text-[9px] tracking-[0.4em] text-[#e89c51] mb-4">¿CUÁNTO PESARÍAS AQUÍ?</p>
                <p className="text-[10px] text-gray-500 tracking-wider mb-4 leading-relaxed">
                  INTRODUCE TU PESO EN LA TIERRA (KG)
                </p>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="ej. 70"
                  className="w-full bg-transparent border border-white/20 text-white text-sm tracking-wider px-4 py-3 outline-none focus:border-[#e89c51] transition-colors placeholder:text-gray-700 mb-4 select-text"
                />
                {weightOnPlanet !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4 border border-white/10"
                  >
                    <p className="text-[9px] tracking-[0.3em] text-gray-500 mb-1">TU PESO EN {activePlanet.name}</p>
                    <p className="text-4xl font-thin tracking-widest" style={{ color: activePlanet.color }}>
                      {weightOnPlanet} <span className="text-sm">kg</span>
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

