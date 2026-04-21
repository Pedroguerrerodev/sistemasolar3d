import { AnimatePresence, motion } from 'motion/react';

export interface TourStep {
  planetIndex: number;
  eyebrow: string;
  title: string;
  description: string;
}

interface Props {
  open: boolean;
  stepIndex: number;
  steps: TourStep[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function GuidedTour({ open, stepIndex, steps, onClose, onPrev, onNext }: Props) {
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <AnimatePresence>
      {open && step && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-10 md:justify-end md:px-10"
        >
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="pointer-events-auto w-full max-w-md rounded-[28px] border border-white/10 bg-black/55 p-5 backdrop-blur-xl shadow-[0_24px_120px_rgba(0,0,0,0.45)] md:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 font-display text-[10px] tracking-[0.45em] text-[#f2b26c]">{step.eyebrow}</p>
                <h3 className="font-display text-2xl uppercase tracking-[0.12em] text-white md:text-[2rem]">{step.title}</h3>
              </div>
              <button onClick={onClose} className="text-xs tracking-[0.35em] text-white/45 transition hover:text-white">
                SALTAR
              </button>
            </div>

            <p className="mb-6 max-w-[36ch] text-sm leading-7 text-white/72 md:text-[15px]">{step.description}</p>

            <div className="mb-5 flex items-center gap-2">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-[3px] rounded-full transition-all duration-300 ${index === stepIndex ? 'w-10 bg-[#f2b26c]' : 'w-4 bg-white/18'}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onPrev}
                disabled={stepIndex === 0}
                className="rounded-full border border-white/10 px-4 py-2 text-[10px] tracking-[0.35em] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-30"
              >
                ANTERIOR
              </button>
              <button
                onClick={onNext}
                className="rounded-full border border-[#f2b26c]/45 bg-[#f2b26c]/10 px-5 py-2 text-[10px] tracking-[0.35em] text-[#f2b26c] transition hover:bg-[#f2b26c] hover:text-black"
              >
                {isLast ? 'FINALIZAR' : 'SIGUIENTE'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
