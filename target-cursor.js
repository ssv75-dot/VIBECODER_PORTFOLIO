/**
 * TargetCursor — vanilla port for Vibe Coder portfolio
 * Requires GSAP (loaded via CDN)
 */
(function (global) {
  const getContainingBlock = (element) => {
    let node = element?.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        style.willChange.includes('transform') ||
        style.willChange.includes('perspective') ||
        style.willChange.includes('filter') ||
        /paint|layout|strict|content/.test(style.contain)
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  const getContainingBlockOffset = (block) => {
    if (!block) return { x: 0, y: 0 };
    const rect = block.getBoundingClientRect();
    return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
  };

  const isMobileDevice = () => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmall = window.innerWidth <= 768;
    const ua = navigator.userAgent || navigator.vendor || global.opera || '';
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouch && isSmall) || mobileRegex.test(ua.toLowerCase());
  };

  function TargetCursor(options = {}) {
    const config = {
      targetSelector: '.cursor-target',
      spinDuration: 2,
      hideDefaultCursor: true,
      hoverDuration: 0.2,
      parallaxOn: true,
      cursorColor: '#ffffff',
      cursorColorOnTarget: '#d8ff4a',
      ...options,
    };

    const constants = { borderWidth: 3, cornerSize: 12 };

    let cursor = null;
    let dot = null;
    let corners = null;
    let spinTl = null;
    let containingBlock = null;

    let activeTarget = null;
    let currentLeaveHandler = null;
    let resumeTimeout = null;
    let targetCornerPositions = null;
    let tickerFn = null;
    const activeStrength = { current: 0 };

    let originalCursor = '';
    let destroyed = false;

    const moveCursor = (x, y) => {
      if (!cursor) return;
      const { x: offsetX, y: offsetY } = getContainingBlockOffset(containingBlock);
      gsap.to(cursor, {
        x: x - offsetX,
        y: y - offsetY,
        duration: 0.1,
        ease: 'power3.out',
      });
    };

    const getOffset = () => getContainingBlockOffset(containingBlock);

    const cleanupTarget = (target) => {
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    const createSpinTimeline = () => {
      if (spinTl) spinTl.kill();
      spinTl = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: config.spinDuration, ease: 'none' });
    };

    const buildLeaveHandler = (target) => () => {
      gsap.ticker.remove(tickerFn);

      targetCornerPositions = null;
      gsap.set(activeStrength, { current: 0, overwrite: true });
      activeTarget = null;

      if (config.cursorColorOnTarget && corners) {
        gsap.to(corners, {
          borderColor: config.cursorColor,
          duration: 0.15,
          ease: 'power2.out',
        });
        if (dot) {
          gsap.to(dot, {
            backgroundColor: config.cursorColor,
            duration: 0.15,
            ease: 'power2.out',
          });
        }
      }

      if (corners) {
        gsap.killTweensOf(corners, 'x,y');
        const { cornerSize } = constants;
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
        ];
        const tl = gsap.timeline();
        corners.forEach((corner, index) => {
          tl.to(
            corner,
            { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' },
            0
          );
        });
      }

      resumeTimeout = setTimeout(() => {
        if (!activeTarget && cursor && spinTl) {
          const currentRotation = gsap.getProperty(cursor, 'rotation');
          const normalizedRotation = currentRotation % 360;
          spinTl.kill();
          spinTl = gsap
            .timeline({ repeat: -1 })
            .to(cursor, { rotation: '+=360', duration: config.spinDuration, ease: 'none' });
          gsap.to(cursor, {
            rotation: normalizedRotation + 360,
            duration: config.spinDuration * (1 - normalizedRotation / 360),
            ease: 'none',
            onComplete: () => spinTl?.restart(),
          });
        }
        resumeTimeout = null;
      }, 50);

      cleanupTarget(target);
    };

    const enterHandler = (e) => {
      const allTargets = [];
      let current = e.target;
      while (current && current !== document.body) {
        if (current.matches(config.targetSelector)) allTargets.push(current);
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (!target || !cursor || !corners) return;
      if (activeTarget === target) return;

      if (activeTarget) cleanupTarget(activeTarget);
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      gsap.killTweensOf(corners, 'x,y');
      gsap.killTweensOf(cursor, 'rotation');
      spinTl?.pause();
      gsap.set(cursor, { rotation: 0 });

      if (config.cursorColorOnTarget) {
        gsap.to(corners, {
          borderColor: config.cursorColorOnTarget,
          duration: 0.15,
          ease: 'power2.out',
        });
        if (dot) {
          gsap.to(dot, {
            backgroundColor: config.cursorColorOnTarget,
            duration: 0.15,
            ease: 'power2.out',
          });
        }
      }

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = constants;
      const { x: offsetX, y: offsetY } = getOffset();
      const cursorX = gsap.getProperty(cursor, 'x');
      const cursorY = gsap.getProperty(cursor, 'y');

      targetCornerPositions = [
        { x: rect.left - borderWidth - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.top - borderWidth - offsetY },
        {
          x: rect.right + borderWidth - cornerSize - offsetX,
          y: rect.bottom + borderWidth - cornerSize - offsetY,
        },
        { x: rect.left - borderWidth - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY },
      ];

      gsap.ticker.add(tickerFn);
      gsap.to(activeStrength, {
        current: 1,
        duration: config.hoverDuration,
        ease: 'power2.out',
      });

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositions[i].x - cursorX,
          y: targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out',
        });
      });

      const leaveHandler = buildLeaveHandler(target);
      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    };

    const createDOM = () => {
      cursor = document.createElement('div');
      cursor.className = 'target-cursor-wrapper';
      cursor.setAttribute('aria-hidden', 'true');

      dot = document.createElement('div');
      dot.className = 'target-cursor-dot';
      dot.style.backgroundColor = config.cursorColor;

      const cornerClasses = ['corner-tl', 'corner-tr', 'corner-br', 'corner-bl'];
      const cornerEls = cornerClasses.map((cls) => {
        const el = document.createElement('div');
        el.className = `target-cursor-corner ${cls}`;
        el.style.borderColor = config.cursorColor;
        return el;
      });

      cornerEls.forEach((el) => cursor.appendChild(el));
      cursor.insertBefore(dot, cursor.firstChild);
      document.body.appendChild(cursor);

      corners = cursor.querySelectorAll('.target-cursor-corner');
    };

    const bindEvents = () => {
      tickerFn = () => {
        if (!targetCornerPositions || !cursor || !corners) return;
        const strength = activeStrength.current;
        if (strength === 0) return;

        const cursorX = gsap.getProperty(cursor, 'x');
        const cursorY = gsap.getProperty(cursor, 'y');

        corners.forEach((corner, i) => {
          const currentX = gsap.getProperty(corner, 'x');
          const currentY = gsap.getProperty(corner, 'y');
          const targetX = targetCornerPositions[i].x - cursorX;
          const targetY = targetCornerPositions[i].y - cursorY;
          const finalX = currentX + (targetX - currentX) * strength;
          const finalY = currentY + (targetY - currentY) * strength;
          const duration = strength >= 0.99 ? (config.parallaxOn ? 0.2 : 0) : 0.05;

          gsap.to(corner, {
            x: finalX,
            y: finalY,
            duration,
            ease: duration === 0 ? 'none' : 'power1.out',
            overwrite: 'auto',
          });
        });
      };

      const moveHandler = (e) => moveCursor(e.clientX, e.clientY);
      const scrollHandler = () => {
        if (!activeTarget || !cursor) return;
        const { x: offsetX, y: offsetY } = getOffset();
        const mouseX = gsap.getProperty(cursor, 'x') + offsetX;
        const mouseY = gsap.getProperty(cursor, 'y') + offsetY;
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        const isStillOverTarget =
          elementUnderMouse &&
          (elementUnderMouse === activeTarget ||
            elementUnderMouse.closest(config.targetSelector) === activeTarget);
        if (!isStillOverTarget && currentLeaveHandler) currentLeaveHandler();
      };
      const mouseDownHandler = () => {
        if (!dot) return;
        gsap.to(dot, { scale: 0.7, duration: 0.3 });
        gsap.to(cursor, { scale: 0.9, duration: 0.2 });
      };
      const mouseUpHandler = () => {
        if (!dot) return;
        gsap.to(dot, { scale: 1, duration: 0.3 });
        gsap.to(cursor, { scale: 1, duration: 0.2 });
      };
      const resizeHandler = () => {
        containingBlock = getContainingBlock(cursor);
      };

      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseover', enterHandler, { passive: true });
      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('mousedown', mouseDownHandler);
      window.addEventListener('mouseup', mouseUpHandler);
      window.addEventListener('resize', resizeHandler);

      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseover', enterHandler);
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('mousedown', mouseDownHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
        window.removeEventListener('resize', resizeHandler);
      };
    };

    let unbindEvents = null;

    this.init = () => {
      if (destroyed) return;
      if (!global.gsap) {
        console.warn('TargetCursor: GSAP not found');
        return;
      }
      if (isMobileDevice()) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      createDOM();
      containingBlock = getContainingBlock(cursor);

      if (config.hideDefaultCursor) {
        originalCursor = document.body.style.cursor;
        document.body.classList.add('has-target-cursor');
      }

      const initialOffset = getOffset();
      gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
        x: window.innerWidth / 2 - initialOffset.x,
        y: window.innerHeight / 2 - initialOffset.y,
      });

      createSpinTimeline();
      unbindEvents = bindEvents();
    };

    this.destroy = () => {
      destroyed = true;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      if (unbindEvents) unbindEvents();
      if (activeTarget) cleanupTarget(activeTarget);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      spinTl?.kill();
      cursor?.remove();
      document.body.classList.remove('has-target-cursor');
      document.body.style.cursor = originalCursor;
    };
  }

  const TARGET_SELECTORS = [
    '.btn',
    '.nav a',
    '.logo',
    '.card',
    '.project',
    '.badge',
    '.footer__contacts a',
    '.audience-list li',
    '.hero__photo-frame',
    '.review-card',
  ].join(', ');

  function attachTargets() {
    document.querySelectorAll(TARGET_SELECTORS).forEach((el) => {
      el.classList.add('cursor-target');
    });
  }

  function init(options) {
    attachTargets();
    const instance = new TargetCursor(options);
    instance.init();
    return instance;
  }

  global.TargetCursor = { init, attachTargets };
})(window);
