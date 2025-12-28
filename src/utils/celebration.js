import confetti from 'canvas-confetti';

/**
 * Triggers a celebration confetti animation
 * @param {Object} options - Configuration options for the confetti
 */
export function triggerCelebration(options = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  };

  const config = { ...defaults, ...options };
  confetti(config);
}

/**
 * Triggers a more elaborate celebration with multiple bursts
 */
export function triggerBigCelebration() {
  const duration = 2500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Create confetti from two different origins
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

/**
 * Triggers a simple, subtle celebration suitable for save actions
 */
export function triggerSubtleCelebration() {
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ['#4ade80', '#22c55e', '#16a34a']
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ['#4ade80', '#22c55e', '#16a34a']
  });
}


