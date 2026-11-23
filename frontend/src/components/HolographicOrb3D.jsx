import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * 3D Holographic Quantum Plasma Orb
 * Hardware-accelerated CSS 3D spherical rendering with rotating multi-axis rings,
 * dynamic plasma core gradient, and orbiting cyber-particles.
 */
const HolographicOrb3D = ({ 
  size = 'md', // 'sm' (48px), 'md' (72px), 'lg' (120px)
  isActive = true,
  isThinking = false,
  className = ''
}) => {
  const containerRef = useRef(null);

  // Dimension mapping
  const sizeMap = {
    sm: { container: 'w-12 h-12', core: 'w-8 h-8', ring1: 'w-11 h-11', ring2: 'w-12 h-12' },
    md: { container: 'w-16 h-16 sm:w-20 sm:h-20', core: 'w-12 h-12 sm:w-14 sm:h-14', ring1: 'w-15 h-15 sm:w-18 sm:h-18', ring2: 'w-16 h-16 sm:w-20 sm:h-20' },
    lg: { container: 'w-28 h-28 sm:w-32 sm:h-32', core: 'w-20 h-20 sm:w-24 sm:h-24', ring1: 'w-26 h-26 sm:w-30 sm:h-30', ring2: 'w-28 h-28 sm:w-32 sm:h-32' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Mouse 3D tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotX = useTransform(smoothY, [-0.5, 0.5], [18, -18]);
  const rotY = useTransform(smoothX, [-0.5, 0.5], [-18, 18]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative flex items-center justify-center perspective-1000 select-none ${currentSize.container} ${className}`}
    >
      {/* Outer Hologram Radiant Glow Aura */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.25, 1] : [1, 1.12, 1],
          opacity: isThinking ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: isThinking ? 1.4 : 3,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 blur-xl pointer-events-none"
      />

      {/* Primary Gyroscopic Quantum Ring (Tilted X 65deg) */}
      <motion.div
        animate={{
          rotateZ: 360,
          rotateX: [65, 55, 65],
        }}
        transition={{
          rotateZ: { repeat: Infinity, duration: isThinking ? 2.5 : 7, ease: 'linear' },
          rotateX: { repeat: Infinity, duration: 4, ease: 'easeInOut' }
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`absolute rounded-full border border-cyan-400/60 dark:border-cyan-300/80 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none ${currentSize.ring1}`}
      >
        {/* Orbiting Photon Node on Ring 1 */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
      </motion.div>

      {/* Secondary Counter-Rotating Quantum Ring (Tilted Y 60deg) */}
      <motion.div
        animate={{
          rotateZ: -360,
          rotateY: [60, 45, 60],
        }}
        transition={{
          rotateZ: { repeat: Infinity, duration: isThinking ? 3 : 9, ease: 'linear' },
          rotateY: { repeat: Infinity, duration: 5, ease: 'easeInOut' }
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`absolute rounded-full border border-fuchsia-400/60 dark:border-fuchsia-300/80 shadow-[0_0_12px_rgba(217,70,239,0.8)] pointer-events-none ${currentSize.ring2}`}
      >
        {/* Orbiting Photon Node on Ring 2 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-fuchsia-300 shadow-[0_0_8px_#e879f9]" />
      </motion.div>

      {/* Core 3D Holographic Plasma Sphere */}
      <motion.div
        animate={{
          scale: isThinking ? [0.95, 1.08, 0.95] : [0.98, 1.02, 0.98],
          rotate: [0, 180, 360]
        }}
        transition={{
          scale: { repeat: Infinity, duration: isThinking ? 1 : 2.5, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 15, ease: 'linear' }
        }}
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateZ(12px)',
        }}
        className={`relative rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_0_25px_rgba(99,102,241,0.7)] ${currentSize.core}`}
      >
        {/* Deep Plasma Gradient Layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 via-purple-600 to-cyan-400 opacity-90 animate-pulse" />

        {/* Dynamic Swirling Shimmer */}
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_60%)] mix-blend-overlay"
        />

        {/* Specular Front Curved Glass Reflection */}
        <div className="absolute top-1 left-2 right-2 h-1/3 rounded-full bg-gradient-to-b from-white/80 to-transparent blur-[0.5px]" />

        {/* Center Quantum Spark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: isThinking ? [0.6, 1.3, 0.6] : [0.8, 1.1, 0.8],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ repeat: Infinity, duration: isThinking ? 0.8 : 2 }}
            className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_#ffffff]"
          />
        </div>
      </motion.div>

      {/* Audio Reactive Waves when Thinking/Active */}
      {isThinking && (
        <div className="absolute -bottom-2 flex items-center gap-0.5 z-20">
          {[0.1, 0.3, 0.5, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ height: ['4px', '14px', '4px'] }}
              transition={{ repeat: Infinity, duration: 0.6, delay, ease: 'easeInOut' }}
              className="w-1 bg-gradient-to-t from-cyan-400 to-indigo-400 rounded-full shadow-[0_0_6px_#22d3ee]"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HolographicOrb3D;
