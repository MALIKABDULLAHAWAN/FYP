/**
 * VisualEffects Service
 * 
 * Provides visual feedback and animations:
 * - Particle effects for success
 * - Shake animations for errors
 * - Pulse/highlight effects
 * - Smooth transitions
 * - Celebration effects
 */

class VisualEffects {
  constructor() {
    this.enabled = true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Create floating particles for celebration
   */
  createParticles(element, options = {}) {
    if (!this.enabled || this.reducedMotion) return;
    
    const {
      count = 20,
      colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      duration = 1000,
      spread = 100,
    } = options;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
      `;
      
      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / count;
      const velocity = Math.random() * spread + 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 100;

      particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ], {
        duration: duration + Math.random() * 500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }).onfinish = () => particle.remove();
    }
  }

  /**
   * Shake element to indicate error
   */
  shake(element, options = {}) {
    if (!this.enabled || this.reducedMotion) return;
    
    const { intensity = 10, duration = 500 } = options;
    
    element.animate([
      { transform: 'translateX(0)' },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: 'translateX(0)' }
    ], {
      duration,
      easing: 'ease-in-out',
    });
  }

  /**
   * Pulse element to draw attention
   */
  pulse(element, options = {}) {
    if (!this.enabled || this.reducedMotion) return;
    
    const { scale = 1.1, duration = 600, iterations = 3 } = options;
    
    element.animate([
      { transform: 'scale(1)' },
      { transform: `scale(${scale})` },
      { transform: 'scale(1)' }
    ], {
      duration,
      iterations,
      easing: 'ease-in-out',
    });
  }

  /**
   * Highlight element with glow effect
   */
  glow(element, options = {}) {
    if (!this.enabled) return;
    
    const { 
      color = '#FFD700', 
      duration = 1000,
      intensity = '0 0 20px' 
    } = options;
    
    const originalBoxShadow = element.style.boxShadow;
    
    element.style.transition = `box-shadow ${duration}ms ease`;
    element.style.boxShadow = `${intensity} ${color}`;
    
    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  }

  /**
   * Flip animation for cards
   */
  flip(element, options = {}) {
    if (!this.enabled || this.reducedMotion) return;
    
    const { duration = 600, direction = 'horizontal' } = options;
    
    const rotate = direction === 'horizontal' ? 'rotateY' : 'rotateX';
    
    return element.animate([
      { transform: `${rotate}(0deg)` },
      { transform: `${rotate}(90deg)` },
      { transform: `${rotate}(0deg)` }
    ], {
      duration,
      easing: 'ease-in-out',
    });
  }

  /**
   * Bounce animation
   */
  bounce(element, options = {}) {
    if (!this.enabled || this.reducedMotion) return;
    
    const { height = 20, duration = 600 } = options;
    
    element.animate([
      { transform: 'translateY(0)' },
      { transform: `translateY(-${height}px)` },
      { transform: 'translateY(0)' },
      { transform: `translateY(-${height * 0.5}px)` },
      { transform: 'translateY(0)' }
    ], {
      duration,
      easing: 'ease-out',
    });
  }

  /**
   * Fade in animation
   */
  fadeIn(element, options = {}) {
    const { duration = 300, delay = 0 } = options;
    
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    
    setTimeout(() => {
      element.style.opacity = '1';
    }, delay);
  }

  /**
   * Scale in animation
   */
  scaleIn(element, options = {}) {
    if (!this.enabled || this.reducedMotion) {
      this.fadeIn(element, options);
      return;
    }
    
    const { duration = 300, delay = 0 } = options;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = `all ${duration}ms ease`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay);
  }

  /**
   * Slide in from direction
   */
  slideIn(element, options = {}) {
    if (!this.enabled || this.reducedMotion) {
      this.fadeIn(element, options);
      return;
    }
    
    const { direction = 'bottom', duration = 300, distance = 50 } = options;
    
    const transforms = {
      top: `translateY(-${distance}px)`,
      bottom: `translateY(${distance}px)`,
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`,
    };
    
    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.transition = `all ${duration}ms ease`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0)';
    });
  }

  /**
   * Create ripple effect on click
   */
  ripple(event, options = {}) {
    if (!this.enabled) return;
    
    const { color = 'rgba(255, 255, 255, 0.3)', duration = 600 } = options;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    ripple.animate([
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(2)', opacity: 0 }
    ], {
      duration,
      easing: 'ease-out',
    }).onfinish = () => ripple.remove();
  }

  /**
   * Celebrate with confetti-like effect
   */
  celebrate(element, options = {}) {
    this.createParticles(element, {
      count: 50,
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      duration: 1500,
      spread: 150,
      ...options,
    });
    
    if (element) {
      this.bounce(element, { height: 15, duration: 400 });
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setReducedMotion(reduced) {
    this.reducedMotion = reduced;
  }
}

// Export singleton
const visualEffects = new VisualEffects();

export default visualEffects;
