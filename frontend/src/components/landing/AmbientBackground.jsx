import React from 'react';
import { motion } from 'framer-motion';

/**
 * AmbientBackground - High-end Spatial Lighting & 3D Perspective Grid
 * Optimized with GPU compositing, zero layout shift, low opacity blur.
 */
const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none">
      {/* 1. Dynamic Aurora Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -left-32 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-600/15 to-transparent blur-[140px] dark:from-indigo-600/25 dark:via-purple-600/20 mix-blend-normal"
      />

      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[20%] -right-40 w-[550px] sm:w-[850px] h-[550px] sm:h-[850px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-transparent blur-[150px] dark:from-cyan-500/20 dark:via-blue-600/20 mix-blend-normal"
      />

      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[-10%] left-[25%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-gradient-to-tr from-fuchsia-500/10 via-pink-600/10 to-transparent blur-[160px] dark:from-fuchsia-600/15 dark:via-pink-700/15"
      />

      {/* 2. 3D Perspective Grid Floor (Apple / Linear aesthetic) */}
      <div 
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
        }}
      />

      {/* 3. Subtle Luxury Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.045]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

export default AmbientBackground;
