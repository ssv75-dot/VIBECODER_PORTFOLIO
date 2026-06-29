/* Scroll reveal + header state */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero entrance on load */
  if (!prefersReduced) {
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero .reveal').forEach((el) => {
        el.classList.add('is-visible');
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* Intersection observer for scroll reveals */
  const revealEls = document.querySelectorAll('.reveal:not(.hero .reveal)');
  if (revealEls.length) {
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

  /* Header scroll state */
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('header--scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
