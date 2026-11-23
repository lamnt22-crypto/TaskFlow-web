import React, { createContext, useState, useContext, useCallback } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api from '../services/api';
import CelebrationModal3D from '../components/CelebrationModal3D';
import { sounds } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const GamificationContext = createContext();

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider = ({ children }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiConfig, setConfettiConfig] = useState({ type: 'small' }); // 'small' or 'massive'
  const { width, height } = useWindowSize();
  const [streaks, setStreaks] = useState({ current_streak: 0, highest_streak: 0 });

  // 3D Level-up & Celebration Modal State
  const [celebrationState, setCelebrationState] = useState({
    isOpen: false,
    type: 'task_completed',
    taskTitle: '',
    xpEarned: 100,
    streakCount: 3,
    level: 3,
    levelTitle: 'Bậc Thầy Tập Trung'
  });

  const triggerConfetti = useCallback((type = 'small') => {
    setConfettiConfig({ type });
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, type === 'massive' ? 5000 : 3000);
  }, []);

  const playTingSound = useCallback(() => {
    sounds.playTing();
  }, []);

  const triggerCelebration = useCallback((params = {}) => {
    triggerHaptic('levelUp');
    triggerConfetti(params.type === 'all_completed' ? 'massive' : 'small');
    setCelebrationState({
      isOpen: true,
      type: params.type || 'task_completed',
      taskTitle: params.taskTitle || '',
      xpEarned: params.xpEarned || 100,
      streakCount: params.streakCount || streaks.current_streak || 3,
      level: params.level || 4,
      levelTitle: params.levelTitle || 'Bậc Thầy Năng Suất'
    });
  }, [streaks.current_streak, triggerConfetti]);

  const closeCelebration = useCallback(() => {
    setCelebrationState(prev => ({ ...prev, isOpen: false }));
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
    <GamificationContext.Provider value={{ 
      triggerConfetti, 
      playTingSound, 
      triggerCelebration,
      closeCelebration,
      fetchStreaks, 
      streaks 
    }}>
      {children}

      {/* Global 3D Celebration Modal */}
      <CelebrationModal3D 
        isOpen={celebrationState.isOpen}
        onClose={closeCelebration}
        type={celebrationState.type}
        taskTitle={celebrationState.taskTitle}
        xpEarned={celebrationState.xpEarned}
        streakCount={celebrationState.streakCount}
        level={celebrationState.level}
        levelTitle={celebrationState.levelTitle}
      />

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 z-[115] pointer-events-none">
          <Confetti
            width={width}
            height={height}
            numberOfPieces={confettiConfig.type === 'massive' ? 700 : 180}
            gravity={confettiConfig.type === 'massive' ? 0.25 : 0.18}
            recycle={false}
            colors={['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#eab308']}
          />
        </div>
      )}
    </GamificationContext.Provider>
  );
};
