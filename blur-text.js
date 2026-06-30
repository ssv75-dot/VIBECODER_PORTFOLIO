/**
 * BlurText — vanilla port of motion/react BlurText
 * Animates text by words or chars with blur + slide keyframes.
 */
(function (global) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildKeyframes(direction, customFrom, customTo) {
    const from =
      customFrom ??
      (direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, transform: 'translateY(-50px)' }
        : { filter: 'blur(10px)', opacity: 0, transform: 'translateY(50px)' });

    const midY = direction === 'top' ? '5px' : '-5px';

    const steps = customTo ?? [
      { filter: 'blur(5px)', opacity: 0.5, transform: `translateY(${midY})` },
      { filter: 'blur(0px)', opacity: 1, transform: 'translateY(0)' },
    ];

    return [from, ...steps];
  }

  function splitElement(element, animateBy) {
    const segments = [];
    const accentClass = 'accent-text';

    function pushWord(text, isAccent) {
      if (!text.trim()) return;
      segments.push({ text: text.trim(), accent: isAccent });
    }

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.trim().split(/\s+/).filter(Boolean);
        words.forEach((w) => pushWord(w, false));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains(accentClass)) {
          pushWord(node.textContent, true);
        } else {
          const words = node.textContent.trim().split(/\s+/).filter(Boolean);
          words.forEach((w) => pushWord(w, false));
        }
      }
    });

    element.textContent = '';
    element.classList.add('blur-text');

    const spans = segments.map((seg, index) => {
      const span = document.createElement('span');
      span.className = 'blur-text__word' + (seg.accent ? ' accent-text' : '');
      span.textContent = seg.text;
      span.dataset.index = String(index);
      element.appendChild(span);

      if (animateBy === 'words' && index < segments.length - 1) {
        element.appendChild(document.createTextNode('\u00A0'));
      }

      return span;
    });

    return spans;
  }

  function playAnimation(spans, options) {
    const {
      direction = 'bottom',
      delay = 200,
      stepDuration = 0.35,
      animationFrom,
      animationTo,
      easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
      onAnimationComplete,
    } = options;

    const keyframes = buildKeyframes(direction, animationFrom, animationTo);
    const stepCount = keyframes.length;
    const totalDuration = stepDuration * (stepCount - 1) * 1000;

    spans.forEach((span, index) => {
      if (prefersReduced) {
        span.style.opacity = '1';
        span.style.filter = 'none';
        span.style.transform = 'none';
        return;
      }

      const animation = span.animate(keyframes, {
        duration: totalDuration,
        delay: index * delay,
        easing,
        fill: 'forwards',
      });

      if (index === spans.length - 1 && typeof onAnimationComplete === 'function') {
        animation.addEventListener('finish', onAnimationComplete);
      }
    });
  }

  function init(element, options = {}) {
    if (!element) return null;

    const {
      animateBy = 'words',
      direction = 'bottom',
      delay = 200,
      threshold = 0.1,
      rootMargin = '0px',
      startImmediately = false,
      stepDuration = 0.35,
      animationFrom,
      animationTo,
      easing,
      onAnimationComplete,
    } = options;

    const spans = splitElement(element, animateBy);

    const run = () => {
      playAnimation(spans, {
        direction,
        delay,
        stepDuration,
        animationFrom,
        animationTo,
        easing,
        onAnimationComplete,
      });
    };

    if (prefersReduced || startImmediately) {
      run();
      return { element, spans };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return { element, spans, observer };
  }

  global.BlurText = { init };
})(window);
