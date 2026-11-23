import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * SpotlightCard - Luxury interactive 3D Tilt & Mouse-following Spotlight
 * Inspired by Linear.app, Raycast, and Apple UI.
 */
const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.18)',
  borderColor = 'rgba(129, 140, 248, 0.4)',
  enableTilt = true,
  onClick,
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasHoverSupport, setHasHoverSupport] = useState(true);

  // Motion values for smooth 3D tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], enableTilt ? [6, -6] : [0, 0]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], enableTilt ? [-6, 6] : [0, 0]), springConfig);

  // Position in pixels for the radial glow
  const [pixelPos, setPixelPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Detect if device supports real hover (desktop vs mobile touch)
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
      className={`relative rounded-[2rem] p-[1px] overflow-hidden transition-shadow duration-500 perspective-1000 ${
        isHovered
          ? 'shadow-[0_25px_50px_-12px_rgba(79,70,229,0.25)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)]'
          : 'shadow-lg dark:shadow-none'
      } ${className}`}
    >
      {/* 1. Dynamic Glowing Border Beam (Follows cursor) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 -z-10"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background: isHovered
            ? `radial-gradient(400px circle at ${pixelPos.x}px ${pixelPos.y}px, ${borderColor}, transparent 65%)`
            : undefined,
        }}
      />

      {/* 2. Static subtle border container */}
      <div className="absolute inset-0 rounded-[2rem] border border-zinc-200/80 dark:border-white/10 pointer-events-none -z-10" />

      {/* 3. Card Inner Canvas with Spotlight sheen */}
      <div className="relative h-full w-full rounded-[calc(2rem-1px)] bg-white/90 dark:bg-[#0c0d12]/90 backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Mouse follow radial glow */}
        {hasHoverSupport && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 -z-0"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(550px circle at ${pixelPos.x}px ${pixelPos.y}px, ${spotlightColor}, transparent 75%)`,
            }}
          />
        )}

        {/* Ambient Top Glow for high-end glass edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none z-10" />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default SpotlightCard;
