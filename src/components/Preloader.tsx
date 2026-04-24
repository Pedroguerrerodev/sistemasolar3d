import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';

interface PreloaderProps {
    onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Simulamos la carga de texturas o esperamos a THREE.DefaultLoadingManager
        let currentProgress = 0;

        // Conectar con el DefaultLoadingManager de Three.js
        THREE.DefaultLoadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
            const actualProgress = (itemsLoaded / itemsTotal) * 100;
            // Suavizamos el progreso para que no sea abrupto
            setProgress(actualProgress);
        };

        THREE.DefaultLoadingManager.onLoad = () => {
            setProgress(100);
            setIsLoaded(true);
        };

        // Fallback por si las texturas ya están en caché o fallan y no desencadenan onload
        const fallbackTimer = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress > 95 && !isLoaded) {
                currentProgress = 95; // Se detiene hasta que el evento load de Three.js dispare o empujamos a 100
            }
            setProgress(Math.min(currentProgress, 99.9));
        }, 200);

        // Auto-completar a los 5 segundos máximo a menos que se hayan cargado antes
        const emergencyFinish = setTimeout(() => {
            setProgress(100);
            setIsLoaded(true);
            clearInterval(fallbackTimer);
        }, 5000);

        return () => {
            clearInterval(fallbackTimer);
            clearTimeout(emergencyFinish);
        };
    }, [isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            const exitTimer = setTimeout(() => {
                onComplete();
            }, 1500); // Darle tiempo a la animación "100%" de asentarse
            return () => clearTimeout(exitTimer);
        }
    }, [isLoaded, onComplete]);

    return (
        <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black text-white"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black opacity-30" />

            <div className="z-10 flex flex-col items-center">
                <motion.div
                    className="text-6xl md:text-8xl font-light tracking-tighter"
                    animate={{ opacity: isLoaded ? 0 : 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {Math.floor(progress)}<span className="text-3xl text-gray-500">%</span>
                </motion.div>

                <div className="mt-8 w-48 md:w-64 h-[1px] bg-gray-800 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: progress + "%" }}
                        transition={{ ease: "linear" }}
                    />
                </div>

                <motion.div
                    className="mt-8 text-xs tracking-[0.4em] text-gray-400 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                    {isLoaded ? 'INICIANDO SECUENCIA' : 'CALIBRANDO SISTEMA'}
                </motion.div>
            </div>
        </motion.div>
    );
}
