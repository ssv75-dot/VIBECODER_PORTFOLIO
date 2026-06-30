/* Vibe Motion — animation package */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── 1. Hero BlurText title ── */
  function initHeroBlurText() {
    const title = document.getElementById('hero-title');
    if (!title || !window.BlurText) return;

    BlurText.init(title, {
      animateBy: 'words',
      direction: 'bottom',
      delay: 200,
      stepDuration: 0.35,
      startImmediately: true,
      onAnimationComplete: () => {
        title.classList.add('blur-text--done');
      },
    });
  }

  /* ── 2. Hero entrance (non-title elements) ── */
  function initHeroReveal() {
    if (prefersReduced) {
      document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('is-visible'));
    });
  }

  /* ── 3. Scroll reveal ── */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal:not(.hero .reveal)');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => {
      if (prefersReduced) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
  }

  /* ── 4. Stagger cards ── */
  function initStagger() {
    const groups = document.querySelectorAll('.stagger-group');
    if (!groups.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    groups.forEach((group) => {
      if (prefersReduced) {
        group.classList.add('is-visible');
      } else {
        observer.observe(group);
      }
    });
  }

  /* ── 5. Scroll progress bar ── */
  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress__bar');
    if (!bar) return;

    let ticking = false;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ── 6. Hero photo parallax ── */
  function initParallax() {
    const frame = document.getElementById('hero-photo-frame');
    const layer = document.getElementById('hero-photo-parallax');
    if (!frame || !layer || prefersReduced || isTouch) return;

    frame.addEventListener('mousemove', (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      layer.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
    });

    frame.addEventListener('mouseleave', () => {
      layer.style.transform = '';
    });
  }

  /* ── 7. Steps timeline fill ── */
  function initStepsTimeline() {
    const fill = document.getElementById('steps-rail-fill');
    const steps = document.querySelectorAll('.step[data-step]');
    if (!fill || !steps.length) return;

    const updateFill = () => {
      let maxStep = 0;
      steps.forEach((step) => {
        if (step.classList.contains('is-visible')) {
          maxStep = Math.max(maxStep, parseInt(step.dataset.step, 10));
        }
      });
      fill.style.width = `${(maxStep / steps.length) * 100}%`;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
        updateFill();
      },
      { threshold: 0.4, rootMargin: '0px 0px -80px 0px' }
    );

    steps.forEach((step) => {
      if (prefersReduced) {
        step.classList.add('is-visible');
      } else {
        observer.observe(step);
      }
    });

    updateFill();
  }

  /* ── Header scroll state ── */
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Target cursor ── */
  function initTargetCursor() {
    if (!window.TargetCursor) return;
    TargetCursor.init({
      spinDuration: 2,
      hideDefaultCursor: true,
      parallaxOn: true,
      hoverDuration: 0.2,
      cursorColor: '#ffffff',
      cursorColorOnTarget: '#d8ff4a',
    });
  }

  /* Init */
  initHeroBlurText();
  initHeroReveal();
  initScrollReveal();
  initStagger();
  initScrollProgress();
  initParallax();
  initStepsTimeline();
  initHeader();
  initTargetCursor();
})();
