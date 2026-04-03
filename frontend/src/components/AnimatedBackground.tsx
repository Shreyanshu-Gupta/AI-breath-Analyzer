import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
      {/* Subtle animated blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-1/4 -left-1/4 w-[100vw] h-[100vw] sm:w-[50vw] sm:h-[50vw] bg-teal-200/50 mix-blend-multiply filter blur-3xl rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/4 -right-1/4 w-[80vw] h-[80vw] sm:w-[40vw] sm:h-[40vw] bg-blue-200/50 mix-blend-multiply filter blur-3xl rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -bottom-1/4 left-1/4 w-[90vw] h-[90vw] sm:w-[45vw] sm:h-[45vw] bg-green-200/50 mix-blend-multiply filter blur-3xl rounded-full"
      />
    </div>
  );
}
