import React, { createContext, useState, useContext, useCallback } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api from '../services/api';

export const GamificationContext = createContext();

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider = ({ children }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiConfig, setConfettiConfig] = useState({ type: 'small' }); // 'small' or 'massive'
  const { width, height } = useWindowSize();
  const [streaks, setStreaks] = useState({ current_streak: 0, highest_streak: 0 });

  const triggerConfetti = useCallback((type = 'small') => {
    setConfettiConfig({ type });
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, type === 'massive' ? 5000 : 3000);
  }, []);

  const playTingSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio UI play failed', e);
    }
  }, []);

  const fetchStreaks = useCallback(async () => {
    try {
      const response = await api.get('/gamification');
      if (response.data.success) {
        setStreaks(response.data.data.streaks);
      }
    } catch (error) {
      console.error('Failed to fetch streaks', error);
    }
  }, []);

  return (
    <GamificationContext.Provider value={{ triggerConfetti, playTingSound, fetchStreaks, streaks }}>
      {children}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <Confetti
            width={width}
            height={height}
            numberOfPieces={confettiConfig.type === 'massive' ? 800 : 150}
            gravity={confettiConfig.type === 'massive' ? 0.2 : 0.15}
            recycle={false}
            colors={['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']}
          />
        </div>
      )}
    </GamificationContext.Provider>
  );
};
