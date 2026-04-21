import { useRef, useCallback, useState } from 'react';

// Frecuencias graves únicas por planeta (de Plutón a Mercurio)
const PLANET_NOTES = [65.41, 73.42, 82.41, 87.31, 98.0, 110.0, 130.81, 146.83, 164.81];

export function useSpaceAudio() {
    const ctxRef = useRef<AudioContext | null>(null);
    const masterRef = useRef<GainNode | null>(null);
    const ambientStartedRef = useRef(false);
    const [muted, setMuted] = useState(false);
    const [started, setStarted] = useState(false);

    const ensureCtx = useCallback(() => {
        if (!ctxRef.current) {
            const ctx = new AudioContext();
            const master = ctx.createGain();
            master.gain.value = 0.25;
            master.connect(ctx.destination);
            ctxRef.current = ctx;
            masterRef.current = master;
        }
        return { ctx: ctxRef.current, master: masterRef.current! };
    }, []);

    const startAmbient = useCallback(() => {
        if (ambientStartedRef.current) return;
        ambientStartedRef.current = true;

        const { ctx, master } = ensureCtx();

        // Red de delay para efecto reverb espacial
        const delay = ctx.createDelay(2);
        delay.delayTime.value = 0.9;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.38;
        const delayOut = ctx.createGain();
        delayOut.gain.value = 0.28;
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayOut);
        delayOut.connect(master);

        // Capas de drone graves
        const droneFreqs = [27.5, 55, 82.5, 110];
        droneFreqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 8;

            const gain = ctx.createGain();
            gain.gain.value = 0;

            // LFO lento para movimiento orgánico
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.04 + i * 0.015;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.015;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);

            osc.connect(gain);
            gain.connect(master);
            gain.connect(delay);

            osc.start();
            lfo.start();

            // Fade in suave
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06 / (i + 1), ctx.currentTime + 4);
        });

        // Centelleo agudo muy sutil
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 1320;
        const shimmerGain = ctx.createGain();
        shimmerGain.gain.value = 0;
        const shimmerLFO = ctx.createOscillator();
        shimmerLFO.frequency.value = 0.07;
        const shimmerLFOGain = ctx.createGain();
        shimmerLFOGain.gain.value = 0.005;
        shimmerLFO.connect(shimmerLFOGain);
        shimmerLFOGain.connect(shimmerGain.gain);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(master);
        shimmer.start();
        shimmerLFO.start();
        shimmerGain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 6);

        setStarted(true);
    }, [ensureCtx]);

    // Sonido al cambiar de planeta — tono suave con fade out largo
    const playPlanetSound = useCallback((index: number) => {
        if (!ctxRef.current || !masterRef.current) return;
        const ctx = ctxRef.current;
        const master = masterRef.current;

        const base = PLANET_NOTES[index];

        // Dos osciladores armónicos para enriquecer el sonido
        [[base * 2, 'sine'], [base * 3, 'sine'], [base * 4, 'triangle']].forEach(([freq, type]) => {
            const osc = ctx.createOscillator();
            osc.type = type as OscillatorType;
            osc.frequency.value = freq as number;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

            // Un poco de reverb
            const noteDelay = ctx.createDelay(1);
            noteDelay.delayTime.value = 0.3;
            const noteDelayGain = ctx.createGain();
            noteDelayGain.gain.value = 0.2;
            osc.connect(gain);
            gain.connect(master);
            gain.connect(noteDelay);
            noteDelay.connect(noteDelayGain);
            noteDelayGain.connect(master);

            osc.start();
            osc.stop(ctx.currentTime + 3);
        });
    }, []);

    const toggleMute = useCallback(() => {
        if (!masterRef.current) return;
        setMuted(prev => {
            const next = !prev;
            masterRef.current!.gain.setTargetAtTime(next ? 0 : 0.25, ctxRef.current!.currentTime, 0.3);
            return next;
        });
    }, []);

    return { startAmbient, playPlanetSound, toggleMute, muted, started };
}
