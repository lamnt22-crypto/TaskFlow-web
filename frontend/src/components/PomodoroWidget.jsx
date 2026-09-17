import React, { useContext, useState } from 'react';
import { PomodoroContext } from '../context/PomodoroContext';
import { motion, AnimatePresence } from 'framer-motion';

const PomodoroWidget = () => {
  const { 
    activeTask, 
    timeLeft, 
    initialTime, 
    isActive, 
    isPaused, 
    togglePause, 
    stopFocus, 
    updateTime,
    startTimer
  } = useContext(PomodoroContext);

  const [isExpanded, setIsExpanded] = useState(true);

  // If no task is active and timer is at 0, don't show the widget
  if (!activeTask) return null;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  const currentH = Math.floor(initialTime / 3600);
  const currentM = Math.floor((initialTime % 3600) / 60);
  const currentS = initialTime % 60;

  const handleTimeChange = (type, e) => {
    let val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    
    let newH = currentH;
    let newM = currentM;
    let newS = currentS;

    if (type === 'h') newH = Math.max(0, Math.min(99, val));
    if (type === 'm') newM = Math.max(0, Math.min(59, val));
    if (type === 's') newS = Math.max(0, Math.min(59, val));
    
    const totalSecs = (newH * 3600) + (newM * 60) + newS;
    if (totalSecs >= 0) {
      updateTime(totalSecs); // updateTime now accepts total seconds
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden w-72 backdrop-blur-xl">
          
          {/* Header (collapsible toggle) */}
          <div 
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-700/50"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🍅</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Focus Timer</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              {isExpanded ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              )}
            </button>
          </div>

          {/* Body */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 flex flex-col items-center">
                  
                  {/* Task Name */}
                  <div className="w-full text-center mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Focusing on</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate px-2">
                      {activeTask.title}
                    </p>
                  </div>

                  {/* Circular Timer & Time display */}
                  <div className="relative w-32 h-32 flex items-center justify-center mb-5">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${timeLeft === 0 ? 'text-emerald-500' : (isPaused ? 'text-amber-500' : 'text-indigo-500')}`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-bold tabular-nums tracking-tight ${timeLeft === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 w-full justify-center">
                    {/* Time Selector (only show if not active/paused) */}
                    {(!isActive && timeLeft === initialTime) ? (
                      <div className="flex items-center gap-1.5 justify-center w-full">
                        <div className="flex flex-col items-center">
                          <input 
                            type="number" 
                            min="0" 
                            max="99"
                            value={currentH} 
                            onChange={(e) => handleTimeChange('h', e)}
                            className="w-12 px-1 py-1.5 text-center text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">hrs</span>
                        </div>
                        <span className="text-slate-400 font-bold -mt-3">:</span>
                        <div className="flex flex-col items-center">
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={currentM} 
                            onChange={(e) => handleTimeChange('m', e)}
                            className="w-12 px-1 py-1.5 text-center text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">min</span>
                        </div>
                        <span className="text-slate-400 font-bold -mt-3">:</span>
                        <div className="flex flex-col items-center">
                          <input 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={currentS} 
                            onChange={(e) => handleTimeChange('s', e)}
                            className="w-12 px-1 py-1.5 text-center text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">sec</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={togglePause}
                          disabled={timeLeft === 0}
                          className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md transition-all ${
                            timeLeft === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' :
                            isPaused 
                              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isPaused || !isActive ? (
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          )}
                        </button>
                        
                        <button
                          onClick={stopFocus}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {(!isActive && timeLeft === initialTime) && (
                     <button
                       onClick={startTimer}
                       className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                     >
                       Start Focus
                     </button>
                  )}

                  {(timeLeft === 0) && (
                    <button
                      onClick={stopFocus}
                      className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PomodoroWidget;
