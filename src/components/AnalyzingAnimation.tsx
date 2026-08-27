import React from 'react';
import { motion } from 'motion/react';

export function AnalyzingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Infinity,
        }}
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-4"
      />
      <p className="text-primary font-medium animate-pulse">Analyzing market trends...</p>
    </div>
  );
}
