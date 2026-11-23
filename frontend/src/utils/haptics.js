/**
 * Premium Haptic Feedback Utility for Mobile & Touch Devices
 * Falls back gracefully on desktop and unsupported browsers
 */
export const triggerHaptic = (type = 'light') => {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
      case 'light':
        // Subtle tick (10ms)
        navigator.vibrate(10);
        break;
      case 'medium':
        // Standard interactive bump (25ms)
        navigator.vibrate(25);
        break;
      case 'heavy':
        // Noticeable impact (45ms)
        navigator.vibrate(45);
        break;
      case 'dragPick':
        // Double micro-tick on pick up
        navigator.vibrate([8, 15, 12]);
        break;
      case 'dragDrop':
        // Elastic rebound sensation
        navigator.vibrate([15, 20, 30]);
        break;
      case 'success':
        // Satisfying completion double-bump
        navigator.vibrate([15, 40, 35]);
        break;
      case 'levelUp':
        // Epic victory pattern
        navigator.vibrate([30, 40, 20, 50, 40, 100]);
        break;
      case 'error':
        // Double sharp buzz
        navigator.vibrate([40, 50, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (err) {
    // Silently ignore if browser security blocks vibration
  }
};
