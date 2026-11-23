import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

/**
 * SpatialHeroCanvas - Multi-Million Dollar 3D Spatial Workspace
 * Multi-layer depth with translateZ, real-time mouse/touch spring physics,
 * specular reflection, and interactive view switching.
 */
const SpatialHeroCanvas = () => {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('spatial_ui'); // 'spatial_ui' | 'kanban' | 'ai' | 'pomodoro'
  const [isHovered, setIsHovered] = useState(false);
  const [hasHoverSupport, setHasHoverSupport] = useState(true);

  // Mouse coordinate values normalized between -0.5 and 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics configuration for luxurious smooth damping
  const springConfig = { damping: 26, stiffness: 180, mass: 0.8 };

  // 3D Rotations
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), springConfig);

  // Specular sheen coordinates
  const sheenX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['20%', '80%']), springConfig);
  const sheenY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['20%', '80%']), springConfig);

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
    if (!hasHoverSupport || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (hasHoverSupport) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Touch drag support for mobile
  const handleTouchMove = (e) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width - 0.5;
    const y = (touch.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(Math.max(-0.4, Math.min(0.4, x)));
    mouseY.set(Math.max(-0.4, Math.min(0.4, y)));
  };

  const handleTouchEnd = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-6xl mx-auto perspective-2000 relative select-none cursor-grab active:cursor-grabbing px-4 sm:px-6"
    >
      {/* Dynamic Ambient Backlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-gradient-to-tr from-indigo-500/25 via-purple-500/25 to-cyan-500/25 dark:from-indigo-600/40 dark:via-purple-600/35 dark:to-cyan-500/35 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main 3D Perspective Stage */}
      <motion.div
        style={{
          rotateX: hasHoverSupport ? rotateX : undefined,
          rotateY: hasHoverSupport ? rotateY : undefined,
          transformStyle: 'preserve-3d',
        }}
        animate={
          !hasHoverSupport
            ? {
                y: [0, -8, 0],
                rotateX: [3, -2, 3],
                rotateY: [-4, 4, -4],
              }
            : undefined
        }
        transition={
          !hasHoverSupport
            ? {
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
        className="relative rounded-3xl md:rounded-[2.5rem] bg-slate-900/90 dark:bg-black/85 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.85)] p-4 sm:p-7 overflow-visible transform-gpu"
      >
        {/* Layer 0: Specular Sheen (Physical Glass Reflection) */}
        {hasHoverSupport && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-3xl md:rounded-[2.5rem] -z-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.35 : 0.15,
              background: `radial-gradient(800px circle at ${sheenX.get()} ${sheenY.get()}, rgba(255,255,255,0.4), transparent 60%)`,
            }}
          />
        )}

        {/* --- Top Window Bar --- */}
        <div 
          style={{ transform: 'translateZ(20px)' }}
          className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-20"
        >
          {/* Mac window controls */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500/90 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="ml-3 hidden sm:inline-block text-xs font-semibold tracking-wider uppercase text-zinc-400">
              TaskFlow OS 3D
            </span>
          </div>

          {/* Interactive Mode Tabs */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {[
              { id: 'spatial_ui', label: '3D Spatial OS', icon: '🌌' },
              { id: 'kanban', label: 'Kanban Flow', icon: '📋' },
              { id: 'ai', label: 'AI Planner', icon: '✨' },
              { id: 'pomodoro', label: 'Deep Focus', icon: '🍅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="heroTabIndicator"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search shortcut badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 font-mono">
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-zinc-300">⌘K</kbd>
          </div>
        </div>

        {/* --- Main 3D Canvas Content Stage --- */}
        <div 
          style={{ transformStyle: 'preserve-3d' }}
          className="relative min-h-[380px] sm:min-h-[460px] pt-6 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'spatial_ui' && (
              <motion.div
                key="spatial_ui"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/15 group shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                  <img
                    src="/images/hero_spatial_3d.jpg"
                    alt="TaskFlow 3D Spatial OS Interface"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Floating Holographic Callout 1 (Top Left) */}
                  <motion.div
                    style={{ transform: 'translateZ(60px)' }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-5 left-5 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/40 text-xs text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-bold">Spatial Kanban & Timelines</span>
                  </motion.div>

                  {/* Floating Holographic Callout 2 (Bottom Right) */}
                  <motion.div
                    style={{ transform: 'translateZ(65px)' }}
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute bottom-5 right-5 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-purple-500/40 text-xs text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                  >
                    <span className="text-purple-400">✨</span>
                    <span className="font-bold">Real-time Burndown & AI Velocity</span>
                  </motion.div>

                  {/* Center Badge on Mobile */}
                  <div className="absolute bottom-4 left-4 sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[11px] text-white">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>3D Spatial Workspace</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kanban' && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {/* Column 1: In Progress (Features Primary 3D Card) */}
                <div 
                  style={{ transform: 'translateZ(30px)' }}
                  className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">In Progress</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">3</span>
                  </div>

                  {/* Primary 3D Hero Task Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{ transform: 'translateZ(45px)' }}
                    className="rounded-xl p-4 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 shadow-[0_15px_30px_rgba(99,102,241,0.25)] relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ✨ Gemini AI Core
                      </span>
                      <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> High
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">
                      Deploy Autonomous Voice-to-Task Agent
                    </h4>

                    <p className="text-xs text-zinc-300 mb-4 line-clamp-2">
                      Parse voice memos into structured subtasks with auto-assigned priority and due dates.
                    </p>

                    {/* Subtasks Progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px] text-zinc-300 font-medium">
                        <span>Checklist</span>
                        <span className="text-indigo-300 font-mono">3/4 Done</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1.2, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                        />
                      </div>
                    </div>

                    {/* Footer with Avatars & Due Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-zinc-400">
                      <div className="flex -space-x-2">
                        <img className="w-6 h-6 rounded-full ring-2 ring-indigo-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop" alt="avatar" />
                        <img className="w-6 h-6 rounded-full ring-2 ring-indigo-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop" alt="avatar" />
                        <div className="w-6 h-6 rounded-full bg-indigo-600 ring-2 ring-indigo-900 flex items-center justify-center text-[10px] text-white font-bold">+2</div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                        ⏱️ Today, 4:00 PM
                      </span>
                    </div>
                  </motion.div>

                  {/* Secondary Card */}
                  <div 
                    style={{ transform: 'translateZ(25px)' }}
                    className="rounded-xl p-3.5 bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300">Design System</span>
                      <span className="text-[10px] text-zinc-400">Med</span>
                    </div>
                    <p className="text-sm font-semibold text-white/90">Spatial Glass Components & Micro-interactions</p>
                  </div>
                </div>

                {/* Column 2: In Review */}
                <div 
                  style={{ transform: 'translateZ(20px)' }}
                  className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 hidden md:flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">In Review</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">2</span>
                  </div>

                  <div className="rounded-xl p-3.5 bg-white/[0.04] border border-white/10">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300">Database</span>
                    <p className="text-sm font-semibold text-white/90 mt-1.5">SQL Server 2024 Indexing & Partitioning</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-zinc-400">
                      <span>✓ 8 checks pass</span>
                      <span className="text-emerald-400 text-[11px]">Ready</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-3.5 bg-white/[0.04] border border-white/10">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300">Security</span>
                    <p className="text-sm font-semibold text-white/90 mt-1.5">OAuth 2.0 PKCE Flow Security Audit</p>
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div 
                  style={{ transform: 'translateZ(20px)' }}
                  className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 hidden md:flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Completed</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">14</span>
                  </div>

                  <div className="rounded-xl p-3.5 bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                      <span>🎉 +150 XP</span>
                      <span className="text-zinc-400">• Completed</span>
                    </div>
                    <p className="text-sm font-semibold text-white line-through opacity-75">Daily 8:00 AM Smart Notification Cron</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ transform: 'translateZ(40px)' }}
                className="w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-indigo-950/80 via-black to-purple-950/70 border border-indigo-500/30 p-6 sm:p-8 shadow-[0_20px_50px_rgba(99,102,241,0.3)] text-left"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                    🧠
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Gemini 3.6 Flash Planner
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Active</span>
                    </h3>
                    <p className="text-xs text-zinc-400">Natural Language & Voice Document Decomposition</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 mb-5 font-mono text-sm text-indigo-200">
                  <span className="text-purple-400">Prompt:</span> "Chuẩn bị kế hoạch ra mắt phiên bản 3D vào tuần tới, phân chia công việc cho team UI và Backend"
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">AI Generated Breakdown (4 Subtasks):</p>
                  {[
                    { title: "Optimize WebGL shaders for mobile GPU", priority: "Urgent", team: "Frontend" },
                    { title: "Configure Redis caching for real-time Kanban sync", priority: "High", team: "Backend" },
                    { title: "A/B Test Gamification XP rewards", priority: "Medium", team: "Product" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 text-sm">
                      <span className="text-zinc-200 font-medium">{item.title}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{item.team}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">{item.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'pomodoro' && (
              <motion.div
                key="pomodoro"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ transform: 'translateZ(40px)' }}
                className="w-full max-w-lg mx-auto rounded-2xl bg-gradient-to-b from-rose-950/40 via-black to-slate-900 border border-rose-500/30 p-8 text-center"
              >
                <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <circle
                      cx="88"
                      cy="88"
                      r="76"
                      stroke="url(#pomoGradient)"
                      strokeWidth="8"
                      strokeDasharray="477"
                      strokeDashoffset="80"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="pomoGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white font-mono tracking-tight">24:18</span>
                    <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold mt-1">Focus Flow</span>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-white mb-1">Target: Complete Spatial Landing Page</h4>
                <p className="text-xs text-zinc-400 mb-6">Pomodoro #3 of 4 • Ambient Brown Noise Active 🎧</p>

                <div className="flex justify-center gap-3">
                  <button className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">
                    Take Short Break
                  </button>
                  <button className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors">
                    End Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Layer 2: Floating 3D Depth Badges (Spatial Parallax) --- */}
        {/* Floating Pomodoro Badge (Top-Right) */}
        <motion.div
          style={{ transform: 'translateZ(85px)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 -right-3 sm:-right-8 px-4 py-3 rounded-2xl bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl border border-rose-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 z-30"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-lg shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            🍅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Deep Work State</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">24:18 left • 98% focus rate</p>
          </div>
        </motion.div>

        {/* Floating AI Intelligence Pill (Bottom-Left) */}
        <motion.div
          style={{ transform: 'translateZ(95px)' }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-7 -left-3 sm:-left-8 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-black/95 backdrop-blur-xl border border-indigo-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 z-30"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            ✨
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>AI Auto-Planner</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-[9px] text-indigo-300 font-mono">Gemini 3.6</span>
            </div>
            <p className="text-[11px] text-zinc-300">Parsed 4 tasks from voice memo in 0.8s</p>
          </div>
        </motion.div>

        {/* Floating Gamification Streak Badge (Bottom-Right) */}
        <motion.div
          style={{ transform: 'translateZ(105px)' }}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-8 right-8 sm:right-16 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl border border-amber-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-30"
        >
          <span className="text-2xl animate-bounce">🔥</span>
          <div>
            <p className="text-xs font-bold text-amber-300">14-Day Streak</p>
            <p className="text-[10px] text-zinc-400 font-mono">+250 XP • Level 8 Master</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default SpatialHeroCanvas;
