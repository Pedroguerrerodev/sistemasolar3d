import { useRef, useCallback, useState, useEffect } from 'react';

export function useSpaceAudio() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const [muted, setMuted] = useState(false);
    const [started, setStarted] = useState(false);

    // Inicializamos el elemento de audio que cargará el MP3 en Streaming (no satura RAM)
    useEffect(() => {
        // Asumimos que el usuario pondrá su archivo MP3 en la carpeta 'public/' 
        // con el nombre 'space-ambient.mp3'
        const audio = new Audio('/space-ambient.mp3');
        audio.loop = true;
        audio.preload = 'auto'; // Pre-cargamos para que arranque inmediato
        audio.volume = 0; // Arrancamos en volumen 0 para hacer un fade-in profesional

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    const startAmbient = useCallback(() => {
        if (started || !audioRef.current) return;

        // Reproducimos el MP3
        audioRef.current.play().then(() => {
            // Fade-in suave de volumen usando un interval (estilo cinemático de 3 segundos)
            let vol = 0;
            const maxVol = 0.6; // Volumen máximo deseable para que no atruene y nos deje escuchar efectos si ponemos
            const fadeInterval = setInterval(() => {
                vol += 0.05;
                if (vol >= maxVol) {
                    vol = maxVol;
                    clearInterval(fadeInterval);
                }
                if (audioRef.current && !muted) {
                    audioRef.current.volume = vol;
                }
            }, 250);

            setStarted(true);
        }).catch(err => console.log('El navegador bloqueó el autoplay. Ocurrirá interacción requerida:', err));

    }, [started, muted]);

    const playHyperspaceTransition = useCallback(() => {
        if (muted) return;

        // 1. Apagamos suavemente la música actual
        if (audioRef.current) {
            let vol = audioRef.current.volume;
            const fadeOut = setInterval(() => {
                vol -= 0.05;
                if (vol <= 0) {
                    vol = 0;
                    clearInterval(fadeOut);
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.src = '/dead-ambient.mp3';
                        audioRef.current.load();
                    }
                }
                if (audioRef.current) {
                    audioRef.current.volume = Math.max(0, vol);
                }
            }, 100);
        }

        // 2. Efecto de "Viaje Espacial" de 3 segundos usando API de Audio
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            // Oscilador de graves para el "Rumble" del motor
            const osc = ctx.createOscillator();
            const rumbleGain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            // Ruido blanco (whoosh)
            const bufferSize = ctx.sampleRate * 3; // 3 segundos
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.5;
            }
            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            const noiseGain = ctx.createGain();

            // Configurar graves
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(40, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 3);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(50, ctx.currentTime + 3);

            // Configurar ruido blanco (whoosh effect)
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(400, ctx.currentTime);
            noiseFilter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 1.5);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 3);
            noiseFilter.Q.value = 0.5;

            // Envolventes de volumen
            rumbleGain.gain.setValueAtTime(0, ctx.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1);
            rumbleGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

            noiseGain.gain.setValueAtTime(0, ctx.currentTime);
            noiseGain.gain.linearRampToValueAtTime(1.5, ctx.currentTime + 1.5);
            noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

            // Conexiones
            osc.connect(filter);
            filter.connect(rumbleGain);
            rumbleGain.connect(ctx.destination);

            whiteNoise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            // Iniciar
            osc.start(ctx.currentTime);
            whiteNoise.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 3);

            // 3. Reproducir la nueva música cuando termine (despues de 3s)
            setTimeout(() => {
                if (audioRef.current && !muted) {
                    audioRef.current.play().then(() => {
                        let vol = 0;
                        const maxVol = 0.6;
                        const fadeIn = setInterval(() => {
                            vol += 0.05;
                            if (vol >= maxVol) {
                                vol = maxVol;
                                clearInterval(fadeIn);
                            }
                            if (audioRef.current && !muted) {
                                audioRef.current.volume = vol;
                            }
                        }, 100);
                    }).catch(err => console.log('Audio error:', err));
                }
            }, 3000);

        } catch (e) {
            console.warn('Fallback: Sfx Error', e);
        }

    }, [muted]);

    const playReturnTransition = useCallback(() => {
        if (!audioRef.current || audioRef.current.src.includes('space-ambient.mp3')) return;

        // Apagamos suavemente la música 'dead-ambient.mp3' y ponemos la normal
        let vol = audioRef.current.volume;
        const fadeOut = setInterval(() => {
            vol -= 0.05;
            if (vol <= 0) {
                vol = 0;
                clearInterval(fadeOut);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '/space-ambient.mp3';
                    audioRef.current.load();

                    if (!muted) {
                        audioRef.current.play().then(() => {
                            let inVol = 0;
                            const maxVol = 0.6;
                            const fadeIn = setInterval(() => {
                                inVol += 0.05;
                                if (inVol >= maxVol) {
                                    inVol = maxVol;
                                    clearInterval(fadeIn);
                                }
                                if (audioRef.current && !muted) {
                                    audioRef.current.volume = inVol;
                                }
                            }, 100);
                        }).catch(e => console.log(e));
                    }
                }
            }
            if (audioRef.current) {
                audioRef.current.volume = Math.max(0, vol);
            }
        }, 100);
    }, [muted]);

    // Mantenemos la función vacía por si en el futuro queremos añadir un 'ping' (SFX) al saltar de planeta.
    const playPlanetSound = useCallback((index: number) => {
        // Sonidos de transición desactivados a petición
    }, []);

    const toggleMute = useCallback(() => {
        if (!audioRef.current) return;

        const nextMuted = !muted;

        // Logica para hacer Fades en lugar de cortes abruptos de muteo (Premium Feel)
        let vol = audioRef.current.volume;
        const targetVol = nextMuted ? 0 : 0.6;
        const step = nextMuted ? -0.05 : 0.05;

        const fadeInterval = setInterval(() => {
            vol += step;
            if ((nextMuted && vol <= 0) || (!nextMuted && vol >= 0.6)) {
                vol = targetVol;
                clearInterval(fadeInterval);
            }
            if (audioRef.current) {
                audioRef.current.volume = Math.max(0, Math.min(1, vol));
            }
        }, 50);

        setMuted(nextMuted);
    }, [muted]);

    // SFX para el Agujero Negro
    const playWarningBeep = useCallback(() => {
        if (muted || !audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (!ctx || muted) return;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }, [muted]);

    const playSwallowBoom = useCallback(() => {
        if (muted) return;
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        // Massive deep explosion using oscillator + noise
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 2);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 3);

        // Stop the ambient music completely after swallowed 
        if (audioRef.current) {
            let vol = audioRef.current.volume;
            const fadeOut = setInterval(() => {
                vol -= 0.1;
                if (vol <= 0) {
                    vol = 0;
                    clearInterval(fadeOut);
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.src = '';
                    }
                }
                if (audioRef.current && !muted) {
                    audioRef.current.volume = Math.max(0, vol);
                }
            }, 50);
        }
    }, [muted]);

    return { startAmbient, playPlanetSound, playHyperspaceTransition, playReturnTransition, toggleMute, muted, started, playWarningBeep, playSwallowBoom };
}
