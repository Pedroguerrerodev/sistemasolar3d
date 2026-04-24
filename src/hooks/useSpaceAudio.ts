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
                if (audioRef.current) {
                    audioRef.current.volume = vol;
                }
            }, 250);

            setStarted(true);
        }).catch(err => console.log('El navegador bloqueó el autoplay. Ocurrirá interacción requerida:', err));

    }, [started]);

    // Mantenemos la función vacía temporalmente por compatibilidad con App.tsx 
    // y por si en el futuro queremos añadir un 'ping' (SFX) al saltar de planeta encima del colchón del mp3.
    const playPlanetSound = useCallback((index: number) => {
        // En una app de Awwwards, el track envolvente de alta calidad es suficiente, 
        // pero aquí podríamos disparar sonidos pequeños de interfaz (SFX).
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

    return { startAmbient, playPlanetSound, toggleMute, muted, started };
}
