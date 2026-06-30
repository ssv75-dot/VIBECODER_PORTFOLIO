/**
 * Reviews stack — поочерёдное перелистывание карточек при скролле
 */
(function (global) {
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  function init() {
    const section = document.getElementById('reviews');
    const container = document.getElementById('reviews-scroll');
    const cardsContainer = document.getElementById('reviews-cards');
    if (!section || !container || !cardsContainer) return;

    const cards = Array.from(cardsContainer.querySelectorAll('.review-card'));
    const total = cards.length;
    if (!total) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useStatic = prefersReduced || isTouchDevice() || window.innerWidth < 640;

    if (useStatic) {
      section.classList.add('reviews--static');
      container.classList.add('reviews-scroll--static');
      return;
    }

    if (!global.gsap || !global.ScrollTrigger) {
      section.classList.add('reviews--static');
      container.classList.add('reviews-scroll--static');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const STACK_GAP = 16;
    const FLY_DISTANCE = 560;
    let scrollTriggerInstance = null;

    function updateCards(progress) {
      const floatIndex = progress * total;
      const peeledCount = Math.min(total, Math.floor(floatIndex));
      const frac = floatIndex - peeledCount;
      const waiting = total - peeledCount;

      cards.forEach((card, i) => {
        if (i < peeledCount) {
          card.style.transform = `translate3d(0, -${FLY_DISTANCE}px, 0) rotate(8deg) scale(0.86)`;
          card.style.opacity = '0';
          card.style.zIndex = String(i);
          card.style.filter = 'none';
          return;
        }

        const stackPos = i - peeledCount;

        if (i === peeledCount) {
          const y = lerp(stackPos * STACK_GAP, -FLY_DISTANCE, frac);
          const rotate = lerp((stackPos - (waiting - 1) / 2) * 5, 12, frac);
          const scale = lerp(1 - stackPos * 0.03, 0.88, frac);
          const opacity = frac > 0.88 ? 1 - (frac - 0.88) / 0.12 : 1;

          card.style.transform = `translate3d(0, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
          card.style.opacity = String(Math.max(0, opacity));
          card.style.zIndex = String(total + 5);
          card.style.filter = `drop-shadow(0 ${lerp(8, 20, frac)}px ${lerp(12, 28, frac)}px rgba(0,0,0,${lerp(0.25, 0.4, frac)}))`;
          return;
        }

        const y = stackPos * STACK_GAP;
        const rotate = (stackPos - (waiting - 1) / 2) * 5;
        const scale = 1 - stackPos * 0.03;

        card.style.transform = `translate3d(0, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.opacity = '1';
        card.style.zIndex = String(total - stackPos);
        card.style.filter = `drop-shadow(0 ${4 + stackPos * 2}px ${16 + stackPos * 4}px rgba(0,0,0,0.22))`;
      });
    }

    function setupScroll() {
      scrollTriggerInstance?.kill();

      const scrollLength = total * window.innerHeight * 0.75;
      container.style.minHeight = `${scrollLength + window.innerHeight * 0.5}px`;

      updateCards(0);

      scrollTriggerInstance = ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: `+=${scrollLength}`,
        pin: '.reviews-sticky',
        pinSpacing: true,
        scrub: 0.45,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => updateCards(self.progress),
      });
    }

    setupScroll();
    window.addEventListener('resize', () => {
      setupScroll();
      ScrollTrigger.refresh();
    }, { passive: true });

    global.ReviewsStack = {
      refresh: () => ScrollTrigger.refresh(),
      destroy: () => scrollTriggerInstance?.kill(),
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
