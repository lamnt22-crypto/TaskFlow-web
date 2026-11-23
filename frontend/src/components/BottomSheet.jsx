import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

/**
 * Native iOS/Android style Bottom Sheet component
 * Features:
 * - Spring slide-up physics
 * - Interactive swipe-down-to-dismiss gesture with elastic resistance
 * - Haptic feedback ticks
 * - Drag handle bar
 * - Responsive: Functions as a smooth Bottom Sheet on mobile & clean centered modal on desktop
 */
const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  headerAction,
  maxHeight = 'max-h-[92vh]'
}) => {
  useEffect(() => {
    if (isOpen) {
      triggerHaptic('selection');
      // Lock body scroll on mobile
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragEnd = (_, info) => {
    // If pulled down far enough or flicked with speed
    if (info.offset.y > 100 || info.velocity.y > 500) {
      triggerHaptic('medium');
      sounds.playPop();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center items-end justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Sheet / Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
          className={`relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 
            rounded-t-[32px] sm:rounded-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.3)] sm:shadow-2xl 
            border-t sm:border border-slate-200/80 dark:border-white/10 
            flex flex-col ${maxHeight} overflow-hidden`}
        >
          {/* Mobile Drag Handle Bar */}
          <div className="pt-3 pb-1 flex justify-center sm:hidden cursor-grab active:cursor-grabbing w-full">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <div>
              {title && (
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {title}
                </h2>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {headerAction}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BottomSheet;
