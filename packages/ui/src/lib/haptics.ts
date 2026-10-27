/**
 * Tactile Haptic Feedback Utility for iOS and Android web apps.
 * Triggers light vibration pulses for toggles, sheet detent snaps, and primary actions.
 */
export const haptics = {
  /** Light 10ms tap for switches, buttons, and segmented controls */
  tap: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // no-op
      }
    }
  },

  /** Medium 15ms pulse for sheet detent snapping and drawer latching */
  snap: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(15);
      } catch {
        // no-op
      }
    }
  },

  /** Double tap pattern for success events (publish, lead created) */
  success: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([10, 30, 15]);
      } catch {
        // no-op
      }
    }
  },

  /** Warning double pulse for destructive actions (delete, disconnect) */
  warning: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([20, 40, 20]);
      } catch {
        // no-op
      }
    }
  },
};
