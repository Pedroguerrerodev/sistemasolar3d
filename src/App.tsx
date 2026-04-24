/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PlanetScene from './components/PlanetScene';
import SolarIntro from './components/SolarIntro';
import StarCursor from './components/StarCursor';
import CosmicBackdrop from './components/CosmicBackdrop';
import Preloader from './components/Preloader';
import HyperspaceOverlay from './components/HyperspaceOverlay';
import { useSpaceAudio } from './hooks/useSpaceAudio';

const SplitTextReveal = ({ text, delay = 0, style }: { text: string, delay?: number, style?: React.CSSProperties }) => {
  return (
    <div className="overflow-hidden inline-block" style={style}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay }}
      >
        {text}
      </motion.div>
    </div>
  );
};

const PLANETS = [
  {
    id: 'pluto', name: 'PLUTÓN', distance: '5,4 HORAS LUZ', distanceKm: '5.906 M km', color: '#8B7355',
    description: 'UNA VEZ CONSIDERADO EL NOVENO PLANETA, PLUTÓN ES UN PLANETA ENANO EN EL CINTURÓN DE KUIPER. TIENE UNA SUPERFICIE COMPLEJA CON MONTAÑAS DE HIELO DE AGUA.',
    gravity: 0.063, temp: '-230 °C', moons: 5, diameter: '2.377 km',
  },
  {
    id: 'neptune', name: 'NEPTUNO', distance: '4,1 HORAS LUZ', distanceKm: '4.495 M km', color: '#274687',
    description: 'OSCURO, FRÍO Y AZOTADO POR VIENTOS SUPERSÓNICOS, EL GIGANTE DE HIELO NEPTUNO ES EL OCTAVO Y MÁS DISTANTE PLANETA DE NUESTRO SISTEMA SOLAR.',
    gravity: 1.14, temp: '-201 °C', moons: 16, diameter: '49.528 km',
  },
  {
    id: 'uranus', name: 'URANO', distance: '2,6 HORAS LUZ', distanceKm: '2.871 M km', color: '#82b3d1',
    description: 'URANO ES EL SÉPTIMO PLANETA DESDE EL SOL. TIENE EL TERCER RADIO PLANETARIO MÁS GRANDE Y LA CUARTA MASA PLANETARIA MÁS GRANDE.',
    gravity: 0.89, temp: '-197 °C', moons: 28, diameter: '51.118 km',
  },
  {
    id: 'saturn', name: 'SATURNO', distance: '1,3 HORAS LUZ', distanceKm: '1.429 M km', color: '#e3cb8f',
    description: 'ADORNADO CON UN DESLUMBRANTE Y COMPLEJO SISTEMA DE ANILLOS DE HIELO, SATURNO ES ÚNICO EN NUESTRO SISTEMA SOLAR. ES EL SEGUNDO PLANETA MÁS GRANDE.',
    gravity: 1.07, temp: '-178 °C', moons: 146, diameter: '116.460 km',
  },
  {
    id: 'jupiter', name: 'JÚPITER', distance: '43 MINUTOS LUZ', distanceKm: '778,6 M km', color: '#c99b75',
    description: 'JÚPITER ES MÁS DEL DOBLE DE MASIVO QUE EL RESTO DE LOS PLANETAS DE NUESTRO SISTEMA SOLAR COMBINADOS. LA GRAN MANCHA ROJA ES UNA TORMENTA DE SIGLOS DE ANTIGÜEDAD.',
    gravity: 2.53, temp: '-145 °C', moons: 95, diameter: '139.820 km',
  },
  {
    id: 'mars', name: 'MARTE', distance: '12,6 MINUTOS LUZ', distanceKm: '227,9 M km', color: '#c1440e',
    description: 'MARTE ES UN MUNDO POLVORIENTO, FRÍO Y DESÉRTICO CON UNA ATMÓSFERA MUY DELGADA. HAY EVIDENCIA SÓLIDA DE QUE MARTE FUE, HACE MILES DE MILLONES DE AÑOS, MÁS HÚMEDO Y CÁLIDO.',
    gravity: 0.38, temp: '-65 °C', moons: 2, diameter: '6.779 km',
  },
  {
    id: 'earth', name: 'TIERRA', distance: '8,3 MINUTOS LUZ', distanceKm: '149,6 M km', color: '#4b759e',
    description: 'NUESTRO PLANETA ES EL ÚNICO LUGAR QUE CONOCEMOS HABITADO POR SERES VIVOS. TAMBIÉN ES EL ÚNICO PLANETA EN NUESTRO SISTEMA SOLAR CON AGUA LÍQUIDA EN LA SUPERFICIE.',
    gravity: 1.0, temp: '15 °C', moons: 1, diameter: '12.742 km',
  },
  {
    id: 'venus', name: 'VENUS', distance: '6 MINUTOS LUZ', distanceKm: '108,2 M km', color: '#e89c51',
    description: 'NOMBRADO POR LA DIOSA ROMANA DEL AMOR Y LA BELLEZA. EN LA ANTIGÜEDAD, VENUS ERA CONSIDERADO A MENUDO DOS ESTRELLAS DISTINTAS: LA ESTRELLA VESPERTINA Y LA MATUTINA.',
    gravity: 0.904, temp: '465 °C', moons: 0, diameter: '12.104 km',
  },
  {
    id: 'mercury', name: 'MERCURIO', distance: '3,2 MINUTOS LUZ', distanceKm: '57,9 M km', color: '#888888',
    description: 'EL PLANETA MÁS PEQUEÑO DE NUESTRO SISTEMA SOLAR Y EL MÁS CERCANO AL SOL, MERCURIO ES SOLO LIGERAMENTE MÁS GRANDE QUE LA LUNA DE LA TIERRA.',
    gravity: 0.38, temp: '167 °C', moons: 0, diameter: '4.879 km',
  },
];

// Add the Deep Space objects to the very beginning (since array is ordered Pluto (far) to Mercury (close))
// Wait, the currently activeIndex 0 is Pluto, activeIndex 8 is Mercury. 
// If we prepend them, they get index 0, 1, 2 and shift the others.
const DEEP_SPACE_OBJECTS = [
  {
    id: 'blackhole', name: 'SGR A*', distance: '26.673 AÑOS LUZ', distanceKm: 'CENTRO GALÁCTICO', color: '#111111',
    description: 'UN AGUJERO NEGRO SUPERMASIVO EN EL CENTRO DE LA VÍA LÁCTEA. SU GRAVEDAD ES TAN INTENSA QUE NI SIQUIERA LA LUZ PUEDE ESCAPAR DE SU HORIZONTE DE SUCESOS.',
    gravity: 999999, temp: '-273 °C', moons: 0, diameter: '44 M km',
  },
  {
    id: 'pulsar', name: 'PSR B1919+21', distance: '2.283 AÑOS LUZ', distanceKm: 'DE LA TIERRA', color: '#ffccfc',
    description: 'UNA ESTRELLA DE NEUTRONES QUE GIRA A VELOCIDADES VERTIGINOSAS. EMITE RADIACIÓN DESDE SUS POLOS COMO UN FARO CÓSMICO EN LA OSCURIDAD DEL ESPACIO.',
    gravity: 200000, temp: '1 Millón °C', moons: 0, diameter: '20 km',
  },
  {
    id: 'kepler', name: 'KEPLER-10b', distance: '564 AÑOS LUZ', distanceKm: 'DE LA TIERRA', color: '#ff3300',
    description: 'UN MUNDO DE LAVA INFERNAL QUE ÓRBITA TAN CERCA DE SU ESTRELLA QUE SU SUPERFICIE DEBE ESTAR COMPLETAMENTE FUNDIDA. UN EXOPLANETA EXTREMO Y HOSTIL.',
    gravity: 3.3, temp: '1500 °C', moons: 0, diameter: '18.700 km',
  },
  {
    id: 'trappist', name: 'TRAPPIST-1e', distance: '39,46 AÑOS LUZ', distanceKm: 'DE LA TIERRA', color: '#2a5a75',
    description: 'UN EXOPLANETA ROCOSO QUE PODRÍA ESTAR CUBIERTO POR UN OCÉANO PROFUNDO. ÓRBITA EN LA ZONA HABITABLE DE UNA ESTRELLA ENANA ROJA.',
    gravity: 0.93, temp: '-10 °C', moons: 0, diameter: '11.600 km',
  },
  {
    id: 'oort', name: 'NUBE DE OORT', distance: '1 AÑO LUZ', distanceKm: 'LÍMITE DEL SISTEMA', color: '#748eb8',
    description: 'UNA ENVOLTURA ESFÉRICA GIGANTE DE COMETAS Y ROCAS HELADAS QUE MARCA LA FRONTERA GRAVITACIONAL DEL SOL CON EL ESPACIO INTERESTELAR.',
    gravity: 0.01, temp: '-268 °C', moons: 0, diameter: 'DESCONOCIDO',
  },
  {
    id: 'voyager', name: 'VOYAGER 1', distance: '22,4 HORAS LUZ', distanceKm: 'EN EL VACÍO', color: '#aaaaaa',
    description: 'OBJETO CREADO POR LA HUMANIDAD EN 1977. LLEVA UN "DISCO DE ORO" CON MENSAJES DE LA TIERRA, SURCANDO SOLA EL INMENSO FRÍO DEL ESPACIO PROFUNDO.',
    gravity: 0, temp: '-270 °C', moons: 0, diameter: '3.7 m',
  }
];

// Re-map the planats array so 0 is Blackhole, then Trappist, Kepler, Pluto...
const PLANETS_ALL = [...DEEP_SPACE_OBJECTS, ...PLANETS];

const PLANET_CURIOSITIES: Record<string, string[]> = {
  blackhole: [
    'EL TIEMPO SE DETIENE CERCA DEL HORIZONTE DE SUCESOS DEBIDO A LA DILATACIÓN TEMPORAL.',
    'LA MASA DE SAGITARIO A* ES UNOS 4 MILLONES DE VECES LA DEL SOL.',
    'CUALQUIER MATERIA QUE CAE EN EL AGUJERO NEGRO SUFRE UN PROCESO LLAMADO "ESPAGUETIZACIÓN".'
  ],
  pulsar: [
    'DA VUELTAS SOBRE SÍ MISMA EN CUESTIÓN DE SEGUNDOS O FRACCIONES DE SEGUNDO.',
    'FUE EL PRIMER PÚLSAR DE LA HISTORIA EN SER DESCUBIERTO, EN 1967.',
    'SU DENSIDAD ES TANTA QUE UNA CUCHARADITA PESARÍA MILLONES DE TONELADAS.'
  ],
  kepler: [
    'ES EL PRIMER EXOPLANETA ROCOSO CONFIRMADO POR LA MISIÓN KEPLER.',
    'SUS OCÉANOS DE LAVA PODRÍAN SER MÁS PROFUNDOS QUE LAS FOSAS MÁS HONDAS DE LA TIERRA.',
    'UN AÑO EN KEPLER-10b DURA MENOS DE UN DÍA TERRESTRE.'
  ],
  trappist: [
    'EL SISTEMA TRAPPIST-1 TIENE AL MENOS 7 PLANETAS DEL TAMAÑO DE LA TIERRA.',
    'SU ESTRELLA ES TAN PEQUEÑA QUE DESDE LA SUPERFICIE DE ESTE PLANETA SE VERÍA GIGANTE Y ROJA.',
    'PODRÍA TENER MÁS AGUA LÍQUIDA QUE TODOS LOS OCÉANOS DE LA TIERRA JUNTOS.'
  ],
  oort: [
    'RECIBE SU NOMBRE DEL ASTRÓNOMO HOLANDÉS JAN OORT.',
    'ESTÁ TAN LEJOS QUE LA LUZ DEL SOL TARDA UN AÑO ENTERO EN LLEGAR HASTA ALLÍ.',
    'ES EL HOGAR DE LOS COMETAS DE PERIODO LARGO QUE A VECES VISITAN LA TIERRA.'
  ],
  voyager: [
    'ES EL OBJETO HECHO POR EL SER HUMANO MÁS ALEJADO DE LA TIERRA.',
    'SU DISCO DE ORO CONTIENE SALUDOS EN 55 IDIOMAS Y MÚSICA TERRESTRE.',
    'AUNQUE SE APAGUE PRONTO, SEGUIRÁ VAGANDO POR EL ESPACIO DURANTE MILLONES DE AÑOS.'
  ],
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
  const [showPreloader, setShowPreloader] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  // Default is Mercury, the last item
  const [activeIndex, setActiveIndex] = useState(PLANETS_ALL.length - 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const { startAmbient, playPlanetSound, playHyperspaceTransition, playReturnTransition, toggleMute, muted, started, playWarningBeep, playSwallowBoom } = useSpaceAudio();

  const [hyperJumping, setHyperJumping] = useState(false);
  const [blackHoleWarningTimer, setBlackHoleWarningTimer] = useState<number | null>(null);
  const [isSwallowed, setIsSwallowed] = useState(false);

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false);
    setShowIntro(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    startAmbient();
  }, [startAmbient]);

  // Iniciar audio en primera interacción del usuario
  const handleFirstInteraction = useCallback((index: number) => {
    startAmbient();
    setActiveIndex(index);
  }, [startAmbient]);

  useEffect(() => {
    setIsTransitioning(true);
    setShowPanel(false);
    if (started) {
      playPlanetSound(activeIndex);
    }
    const timer = setTimeout(() => setIsTransitioning(false), 2200);
    return () => clearTimeout(timer);
  }, [activeIndex, started, playPlanetSound]);

  // Manejo de la cuenta atrás del agujero negro
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (activeIndex === 0 && !isSwallowed && !showIntro && !showPreloader) {
      setBlackHoleWarningTimer(20); // 20 segundos de cuenta atrás
      timerId = setInterval(() => {
        setBlackHoleWarningTimer(prev => {
          if (prev && prev > 1) {
            playWarningBeep(); // Beep on every count down second
          }
          if (prev && prev <= 1) {
            clearInterval(timerId);
            playSwallowBoom(); // El boom
            setIsSwallowed(true); // Trigger de la animación
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    } else {
      setBlackHoleWarningTimer(null);
    }
    return () => clearInterval(timerId);
  }, [activeIndex, isSwallowed, showIntro, showPreloader, playWarningBeep, playSwallowBoom]);

  // Navegación principal (Teclado, Rueda y Swipe)
  const navigatePlanet = useCallback((direction: 'next' | 'prev') => {
    if (isTransitioning || hyperJumping) return; // Evita el spam de scroll/swipe

    if (direction === 'next') {
      setActiveIndex(prev => {
        if (prev < PLANETS_ALL.length - 1) {
          startAmbient();
          if (prev === 5) {
            playReturnTransition(); // Regresar música al sistema solar
          }
          return prev + 1;
        }
        return prev;
      });
    } else {
      setActiveIndex(prev => {
        // Bloquear desplazamiento hacia el espacio profundo desde Plutón (índice 3)
        // El usuario solo puede ir desde Plutón hacia dentro o usar el botón
        if (prev === 6) return prev;

        if (prev > 0) {
          startAmbient();
          return prev - 1;
        }
        return prev;
      });
    }
  }, [isTransitioning, startAmbient, hyperJumping, playReturnTransition]);

  const triggerHyperspace = () => {
    if (activeIndex !== 6) return; // Solo desde Plutón
    setHyperJumping(true);
    startAmbient(); // Asegurar sonido
    playHyperspaceTransition(); // Iniciar transición hiperespacial y cambio de música

    // Hyperjump sequence y transición de canción duran 3 segundos
    setTimeout(() => {
      setActiveIndex(5); // Jump to Voyager / Espacio profundo / Espacio profundo
    }, 2800); // Casi al final del efecto de sonido

    setTimeout(() => {
      setHyperJumping(false); // Clear visual effect
    }, 4000);
  };

  // Navegación por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPanel(false);
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleMute();
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      navigatePlanet('prev');
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      navigatePlanet('next');
    }
  }, [navigatePlanet, toggleMute]);

  // Navegación por Wheel (Ratón/Trackpad) y Touch (Swipe)
  const touchStartY = useRef<number | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (showPanel) return; // Bloquear si el panel lateral está abierto
    if (e.deltaY > 30) navigatePlanet('next');
    else if (e.deltaY < -30) navigatePlanet('prev');
  }, [showPanel, navigatePlanet]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (showPanel) return;
    touchStartY.current = e.touches[0].clientY;
  }, [showPanel]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (showPanel || touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 40) { // Umbral de arrastre de 40px
      navigatePlanet(deltaY > 0 ? 'next' : 'prev');
    }
    touchStartY.current = null;
  }, [showPanel, navigatePlanet]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    // Navegación Touch nativa usando manejadores no pasivos en un ref
    const touchOptions = { passive: true } as EventListenerOptions;
    window.addEventListener('touchstart', handleTouchStart, touchOptions);
    window.addEventListener('touchend', handleTouchEnd, touchOptions);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleKeyDown, handleWheel, handleTouchStart, handleTouchEnd]);

  // Sonido al cambiar planeta (solo si ya inició el audio)

  const activePlanet = PLANETS_ALL[activeIndex];
  if (!activePlanet) {
    console.error('activePlanet is undefined! activeIndex:', activeIndex);
  }
  const weightOnPlanet = activePlanet && weightKg !== '' && !isNaN(Number(weightKg))
    ? (Number(weightKg) * (activePlanet.gravity || 1)).toFixed(1)
    : null;

  if (!activePlanet) return null; // Avoid crashing the whole app

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black text-white font-sans selection:bg-orange-500/30 select-none touch-none" style={{ cursor: 'none' }}>
      <StarCursor />

      <AnimatePresence>
        {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      <HyperspaceOverlay active={hyperJumping} />

      <CosmicBackdrop />
      <AnimatePresence>
        {showIntro && <SolarIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <PlanetScene activeIndex={activeIndex} planetsData={PLANETS_ALL} onPlanetChange={setActiveIndex} />

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showIntro ? 0 : 2, duration: 1.5, ease: "easeOut" }}
        className="absolute top-[4%] md:top-[6%] left-1/2 -translate-x-1/2 text-center tracking-[0.4em] z-10 pl-[0.4em] pointer-events-none"
      >
        <h1 className="text-[10px] md:text-sm font-light text-gray-200 uppercase">
          <SplitTextReveal text="Explorador Solar" delay={showIntro ? 0 : 2.2} />
        </h1>
      </motion.div>

      {/* Hint teclado + botón mute */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: showIntro ? 0 : 3, duration: 1 }}
        className="absolute top-[4%] md:top-[6%] right-4 md:right-10 z-10 flex flex-col items-end gap-2"
      >
        <button
          onClick={toggleMute}
          title={muted ? 'Activar sonido (M)' : 'Silenciar (M)'}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          {muted ? '??' : '??'}
        </button>
        <span className="text-[8px] text-gray-600 tracking-widest hidden md:block text-right">
          SCROLL / SWIPE PARA DESCENDER<br />
          M · MUTE
        </span>
      </motion.div>

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
      {activeIndex > 0 && activeIndex !== 6 && !hyperJumping && (
        <div
          className="absolute top-[14%] md:top-[18%] left-1/2 -translate-x-1/2 text-center tracking-[0.2em] z-20 cursor-pointer opacity-60 hover:opacity-100 transition-opacity pl-[0.2em]"
          onClick={() => {
            if (activeIndex !== 6) navigatePlanet('prev');
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`next-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
            >
              <p className="text-[8px] text-gray-400 mb-1">DESTINO</p>
              <h2 className="text-xs text-gray-200 uppercase">{PLANETS_ALL[activeIndex - 1].name}</h2>
              <p className="text-[6.5px] text-[#e89c51] mt-1 tracking-[0.3em] uppercase">DISTANCIA: {PLANETS_ALL[activeIndex - 1].distance}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* HUD RADAR ÓRBITAL (Lateral Izquierdo) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: showIntro ? 0 : 3.5, duration: 1.5 }}
        className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 md:gap-4 py-8 scale-75 md:scale-100 origin-left"
      >
        <p className="text-[7px] tracking-[0.4em] text-gray-500 mb-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
          {activeIndex < 6 ? 'ESPACIO PROFUNDO' : 'SISTEMA SOLAR'}
        </p>
        <div className="relative flex flex-col items-center gap-4 md:gap-6">
          {/* Línea conectora base */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/10 z-0"></div>

          {/* Progreso activo de la línea */}
          <motion.div
            className="absolute top-0 w-[1px] bg-gradient-to-b from-[#e89c51] to-transparent z-0"
            initial={false}
            animate={{ height: `${Math.max(0, (activeIndex - 3) / (PLANETS_ALL.length - 4)) * 100}%` }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          ></motion.div>

          {PLANETS_ALL.slice(3).map((p, i) => {
            const idx = i + 3;
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (isTransitioning) return;
                  startAmbient();
                  if (activeIndex < 6 && idx >= 6) {
                    playReturnTransition();
                  }
                  setActiveIndex(idx);
                }}
                className="relative z-10 flex items-center justify-center w-6 h-6 group cursor-pointer"
              >
                {/* Tooltip Hover */}
                <div className="absolute left-full ml-4 px-2 py-1 bg-black/80 border border-white/10 text-[9px] tracking-[0.3em] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-md">
                  {p.name}
                </div>

                {/* Nodo del planeta */}
                <motion.div
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${isActive ? 'bg-[#e89c51] shadow-[0_0_10px_rgba(232,156,81,0.8)]' : isPassed ? 'bg-white/50' : 'bg-white/20 group-hover:bg-white/60'}`}
                  animate={isActive ? { scale: [1, 1.5, 1], opacity: [1, 0.8, 1] } : { scale: 1 }}
                  transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                />

                {/* Anillo exterior activo */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 border border-[#e89c51]/30 rounded-full"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[7px] tracking-[0.4em] text-[#e89c51] mt-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>POSICIÓN</p>
      </motion.div>

      {/* Bottom Content (Active Planet Info) */}
      <div className="absolute bottom-4 md:bottom-16 left-1/2 -translate-x-1/2 text-center z-10 w-full max-w-[100vw] md:max-w-none px-4 md:px-6 pointer-events-none max-h-[45dvh] md:max-h-none flex flex-col justify-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
            className="flex flex-col items-center pointer-events-auto overflow-y-auto overflow-x-hidden md:overflow-x-visible touch-pan-y"
            style={{ maxHeight: '100%' }}
          >
            <p className="text-[8px] md:text-[10px] tracking-[0.3em] text-[#e89c51] mb-1 md:mb-2 pl-[0.3em] overflow-hidden shrink-0">
              <SplitTextReveal text={activePlanet.id === 'blackhole' ? "AGUJERO NEGRO" : (activeIndex < 6 ? "EXOPLANETA" : "PLANETA")} delay={0.1} />
            </p>
            <h2 className="text-4xl md:text-6xl md:text-[8rem] tracking-[0.2em] font-sans font-thin text-white mix-blend-overlay mb-4 md:mb-6 pl-[0.2em] opacity-80 uppercase leading-none shrink-0" style={{ whiteSpace: 'nowrap' }}>
              <SplitTextReveal text={activePlanet.name} delay={0.2} style={{ letterSpacing: '0.2em' }} />
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-[10px] md:text-xs leading-loose tracking-[0.2em] text-gray-300 max-w-xl mx-auto mb-4 md:mb-8 pl-[0.2em] uppercase shrink-0"
            >
              {activePlanet.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="flex justify-center gap-4 md:gap-8 shrink-0 pb-6 md:pb-8 pt-4 w-full"
            >
              <button
                onClick={() => setShowPanel(true)}
                className="pointer-events-auto text-[8px] md:text-[10px] tracking-[0.3em] uppercase bg-black/40 backdrop-blur-md text-[#e89c51] border border-[#e89c51]/30 px-6 py-3 md:px-8 md:py-4 rounded-full hover:bg-white/10 hover:text-white hover:border-white/50 transition-all duration-500 shadow-lg shadow-black/50"
              >
                <SplitTextReveal text="LEER MÁS" delay={0.9} />
              </button>

              {activePlanet.id === 'pluto' && (
                <button
                  onClick={triggerHyperspace}
                  className="pointer-events-auto text-[8px] md:text-[10px] tracking-[0.3em] text-cyan-400 uppercase bg-black/40 backdrop-blur-md shadow-lg shadow-black/50 border border-cyan-400/30 px-6 py-3 md:px-8 md:py-4 rounded-full hover:bg-cyan-500/10 hover:text-white hover:border-cyan-400/80 transition-all duration-500 opacity-90"
                >
                  <SplitTextReveal text="IR MÁS ALLÁ DEL SISTEMA SOLAR" delay={0.9} />
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
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
              className="absolute right-0 top-0 h-full z-40 w-full max-w-sm bg-black/80 backdrop-blur-md border-l border-white/5 flex flex-col overflow-y-auto pointer-events-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            >
              {/* Scanline decoration overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(translate-y-px,_transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 z-0"></div>

              {/* Cabecera / Cerrar */}
              <div className="sticky top-0 z-10 flex justify-between items-center p-6 pb-2 bg-gradient-to-b from-black via-black/80 to-transparent">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activePlanet.color }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[8px] tracking-[0.3em] text-gray-500 uppercase">DB-LINK ACTIVO</span>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="group relative text-[9px] tracking-widest text-gray-500 hover:text-white transition-colors uppercase p-2 flex items-center gap-2"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#e89c51]">-</span>
                  CERRAR
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#e89c51]">-</span>
                </button>
              </div>

              <div className="p-8 pt-4 pb-20 relative z-10 flex flex-col gap-10">

                {/* Nombre planeta */}
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[8px] tracking-[0.4em] text-[#e89c51] mb-2 uppercase"
                  >
                    {activePlanet.id === 'blackhole' ? 'ANOMALÍA CÓSMICA' : (activeIndex < 6 ? 'REGISTRO ESTELAR' : 'REGISTRO PLANETARIO')}
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl tracking-[0.3em] font-sans font-thin uppercase"
                    style={{ color: activePlanet.color, textShadow: `0 0 20px ${activePlanet.color}40` }}
                  >
                    {activePlanet.name}
                  </motion.h2>
                </div>

                {/* Datos físicos Grid SCI-FI */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-px bg-white/10"
                >
                  {[
                    { label: 'DIÁMETRO', value: activePlanet.diameter },
                    { label: 'TEMPERATURA', value: activePlanet.temp },
                    { label: 'LUNAS', value: String(activePlanet.moons || 0) },
                    { label: 'GRAVEDAD', value: activePlanet.gravity ? `${activePlanet.gravity}g` : 'DESCONOCIDA' },
                  ].map(({ label, value }, idx) => (
                    <div key={label} className="bg-black/90 p-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e89c51] to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
                      <p className="text-[7px] tracking-[0.3em] text-gray-500 mb-2 uppercase">{label}</p>
                      <p className="text-xs tracking-widest text-gray-100 font-light">{value}</p>
                    </div>
                  ))}
                  <div className="bg-black/90 p-4 col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e89c51] to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
                    <p className="text-[7px] tracking-[0.3em] text-gray-500 mb-2 uppercase">DISTANCIA SOLAR</p>
                    <p className="text-xs tracking-widest text-[#e89c51] font-light">{formatDistance(activePlanet)}</p>
                  </div>
                </motion.div>

                {/* Datos curiosos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <p className="text-[8px] tracking-[0.4em] text-white uppercase opacity-70">NOTAS DE CAMPO</p>
                    <span className="text-[7px] text-[#e89c51] tracking-[0.2em]">{activePlanet.moons ? `0${activePlanet.moons + 1}` : '01'}</span>
                  </div>

                  <div className="space-y-4">
                    {(PLANET_CURIOSITIES[activePlanet.id] || ['DATOS INSUFICIENTES', 'EN ESPERA DE NUEVAS SONDAS EXPLORATORIAS', 'ANOMALÍA GRAVITACIONAL DETECTADA']).map((fact, idx) => (
                      <div key={fact} className="relative pl-4 border-l border-[#e89c51]/30 hover:border-[#e89c51] transition-colors">
                        <div className="absolute left-[-2.5px] top-1.5 w-1 h-1 bg-[#e89c51] rounded-full" />
                        <p className="text-[9px] leading-[1.8] tracking-[0.15em] text-gray-400 font-light uppercase">
                          {fact}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Calculadora de peso HUD */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-white/5 to-transparent p-5 border border-white/5 relative"
                >
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#e89c51]/50" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#e89c51]/50" />

                  <p className="text-[8px] tracking-[0.4em] text-[#e89c51] mb-2 uppercase">SIMULACIÓN GRAVITATORIA</p>
                  <p className="text-[8px] text-gray-500 tracking-widest mb-4 opacity-70 uppercase">
                    MODIFICA LA MASA BASE (TERRESTRE)
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="70"
                      className="w-20 bg-black/50 border border-white/10 text-white text-center text-sm tracking-wider py-2 outline-none focus:border-[#e89c51] transition-colors placeholder:text-gray-700 font-mono"
                    />
                    <span className="text-[9px] tracking-[0.2em] text-gray-400">KG <br />TERRESTRES</span>
                  </div>

                  {weightOnPlanet !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-dashed border-white/20 pt-4"
                    >
                      <p className="text-[7px] tracking-[0.3em] text-gray-500 mb-1 uppercase">RESULTADO EN {activePlanet.name}</p>
                      <p className="text-3xl font-thin tracking-widest" style={{ color: activePlanet.color }}>
                        {weightOnPlanet} <span className="text-[10px] text-gray-400">KG</span>
                      </p>
                    </motion.div>
                  )}
                </motion.div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alerta del Agujero Negro */}
      <AnimatePresence>
        {blackHoleWarningTimer !== null && !isSwallowed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none w-full max-w-lg"
          >
            <div className="text-red-500 font-mono text-2xl md:text-3xl tracking-[0.3em] text-center animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] px-4">
              ? ALERTA CRÍTICA ?
            </div>
            <div className="mt-4 bg-red-950/40 border border-red-500/50 backdrop-blur-md px-8 py-4 rounded-lg text-red-200 text-center uppercase tracking-widest text-[9px] md:text-[10px] mx-4">
              Aproximación al horizonte de sucesos
              <br />
              <span className="opacity-70 mt-3 block">Punto de no retorno en:</span>
              <span className="text-white text-3xl font-mono block mt-2 animate-pulse">{blackHoleWarningTimer}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pantalla y animación cuando somos tragados */}
      <AnimatePresence>
        {isSwallowed && (
          <motion.div
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center pointer-events-auto overflow-hidden bg-transparent"
          >
            {/* Círculo expansivo negro puro (el tragado) */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 200 }}
              transition={{ duration: 2, ease: "easeIn" }}
              className="absolute bg-black rounded-full w-20 h-20 z-0 origin-center"
            />

            {/* Background container para asegurar el 100% de oscuridad una vez cubrimos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.2 }}
              className="absolute inset-0 bg-black z-[-1]"
            />

            {/* Modal de Game Over espacial */}
            <div className="relative z-10 max-w-3xl px-6 text-center flex flex-col items-center justify-center h-full gap-8">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="text-2xl md:text-6xl text-red-600 font-light tracking-[0.2em] md:tracking-[0.4em] w-full break-words px-2"
              >
                ESPAGUETIZACIÓN
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 1 }}
                className="text-gray-400 tracking-[0.2em] leading-[2.5] text-[9px] md:text-xs px-4 md:px-12 uppercase border-l border-r border-[#e89c51]/30 py-4"
              >
                La inmensa gravedad de Sagitario A* ha superado los motores de tu nave.
                Has cruzado el Horizonte de Sucesos.
                <br /><br />
                Toda la materia a bordo ha sido desgarrada por la singularidad cuántica en un proceso de espaguetización irreversible.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 6.5, duration: 2 }}
                className="text-gray-500 font-serif italic tracking-[0.1em] leading-loose text-xs md:text-sm px-6 max-w-2xl mt-2"
              >
                "En el vasto silencio estelar, cada día se estima que incontables soles y mundos enteros son finalmente engullidos y borrados de la existencia por la incomprensible danza de la gravedad pura.<br />Hoy, formas parte del infinito enigma."
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 8.5, duration: 1 }}
                onClick={() => {
                  setIsSwallowed(false);
                  setBlackHoleWarningTimer(null);
                  playReturnTransition();
                  setActiveIndex(PLANETS_ALL.length - 1);
                  setShowIntro(true);
                }}
                className="mt-8 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all duration-500 px-10 py-5 tracking-[0.3em] text-white uppercase text-[10px] w-auto shadow-lg hover:shadow-white/20"
              >
                VOLVER A INICIO
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

