import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * SpotlightCard - Interactive 3D Tilt & Mouse-following Spotlight
 * Outer shell reserves strict 1px padding for the glowing border beam;
 * internal spacing belongs on `contentClassName` so content never clips.
 */
const SpotlightCard = ({
  children,
  className = '',
  contentClassName = '',
  spotlightColor = 'rgba(99, 102, 241, 0.18)',
  borderColor = 'rgba(129, 140, 248, 0.45)',
  enableTilt = true,
  onClick,
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasHoverSupport, setHasHoverSupport] = useState(true);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], enableTilt ? [5, -5] : [0, 0]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], enableTilt ? [-5, 5] : [0, 0]), springConfig);

  const [pixelPos, setPixelPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.matchMedia('(hover: hover) and (pointer: fine)');
      setHasHoverSupport(match.matches);

      const listener = (e) => setHasHoverSupport(e.matches);
      match.addEventListener('change', listener);
      return () => match.removeEventListener('change', listener);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!hasHoverSupport || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPixelPos({ x, y });
    mouseX.set(x / rect.width);
    mouseY.set(y / rect.height);
  };

  const handleMouseEnter = () => {
    if (hasHoverSupport) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: hasHoverSupport ? rotateX : 0,
        rotateY: hasHoverSupport ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-3xl overflow-hidden transition-shadow duration-500 perspective-1000 ${
        isHovered
          ? 'shadow-[0_24px_48px_-12px_rgba(79,70,229,0.2)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)]'
          : 'shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)] dark:shadow-none'
      } ${className} !p-[1px]`}
    >
      {/* 1. Dynamic Glowing Border Beam (Follows cursor) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 -z-10"
        style={{
          opacity: isHovered ? 1 : 0.35,
          background: isHovered
            ? `radial-gradient(400px circle at ${pixelPos.x}px ${pixelPos.y}px, ${borderColor}, transparent 65%)`
            : undefined,
        }}
      />

      {/* 2. Static subtle border container */}
      <div className="absolute inset-0 rounded-3xl border border-zinc-200/90 dark:border-white/10 pointer-events-none -z-10" />

      {/* 3. Card Inner Surface */}
      <div className="relative h-full w-full rounded-[23px] bg-white dark:bg-[#0c0d12]/95 backdrop-blur-xl overflow-hidden flex flex-col">
        {hasHoverSupport && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 -z-0"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(550px circle at ${pixelPos.x}px ${pixelPos.y}px, ${spotlightColor}, transparent 75%)`,
            }}
          />
        )}

        {/* Ambient Top Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent pointer-events-none z-10" />

        {/* Content Container */}
        <div className={`relative z-10 flex-1 flex flex-col ${contentClassName}`}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default SpotlightCard;
