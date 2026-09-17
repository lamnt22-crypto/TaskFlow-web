import React, { createContext, useState, useEffect, useCallback } from 'react';
import { incrementPomodoro } from '../services/taskService';

export const PomodoroContext = createContext();

export const PomodoroProvider = ({ children }) => {
  const [activeTask, setActiveTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Play a beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  }, []);

  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsPaused(false);
      playBeep();
      
      // Fire browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Hết giờ! ⏰", {
          body: activeTask ? `Bạn đã hoàn thành phiên tập trung cho: ${activeTask.title}` : "Thời gian tập trung đã kết thúc!",
        });
      }
      
      // Increment Pomodoro in Backend
      if (activeTask && activeTask.id) {
        incrementPomodoro(activeTask.id).catch(err => {
          console.error("Failed to increment pomodoro count", err);
        });
      }
      
      // We don't mark as completed automatically based on user choice
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft, playBeep, activeTask]);

  const startFocus = (task, customMinutes = 25) => {
    setActiveTask(task);
    const seconds = customMinutes * 60;
    setTimeLeft(seconds);
    setInitialTime(seconds);
    setIsActive(false);
    setIsPaused(false);
  };

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
    
    // Request notification permission if not granted yet
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  const togglePause = () => {
    if (isActive) {
      setIsPaused(!isPaused);
    }
  };

  const stopFocus = () => {
    setIsActive(false);
    setIsPaused(false);
    setActiveTask(null);
  };

  const updateTime = (totalSeconds) => {
    if (!isActive || isPaused) {
      setTimeLeft(totalSeconds);
      setInitialTime(totalSeconds);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        activeTask,
        timeLeft,
        initialTime,
        isActive,
        isPaused,
        startFocus,
        togglePause,
        stopFocus,
        updateTime,
        startTimer
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};
