/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATIONS.JS — Scroll reveal, ripple, skeleton, scroll-to-top, loading bar
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── LOADING BAR ──────────────────────────────────────────────────────────────
const LoadingBar = {
  el: null,
  init() {
    this.el = document.createElement('div');
    this.el.id = 'loading-bar';
    document.body.prepend(this.el);
  },
  start() {
    if (!this.el) this.init();
    this.el.style.width = '0%';
    this.el.style.opacity = '1';
    let w = 0;
    this._interval = setInterval(() => {
      w += Math.random() * 15;
      if (w > 85) w = 85;
      this.el.style.width = w + '%';
    }, 200);
  },
  done() {
    clearInterval(this._interval);
    if (!this.el) return;
    this.el.style.width = '100%';
    setTimeout(() => { this.el.style.opacity = '0'; this.el.style.width = '0%'; }, 400);
  }
};

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────
const ScrollReveal = {
  observer: null,
  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      this.observer.observe(el);
    });
  },
  // Auto-add reveal classes to common elements
  autoTag() {
    const selectors = [
      { sel: '.section-title',    cls: 'reveal' },
      { sel: '.section-subtitle', cls: 'reveal reveal-delay-1' },
      { sel: '.category-card',    cls: 'reveal' },
      { sel: '.product-card',     cls: 'reveal' },
      { sel: '.stat-card',        cls: 'reveal' },
      { sel: '.feature-card',     cls: 'reveal' },
      { sel: '.order-card',       cls: 'reveal' },
      { sel: '.review-card',      cls: 'reveal' },
      { sel: '.checkout-card',    cls: 'reveal' },
    ];
    selectors.forEach(({ sel, cls }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        cls.split(' ').forEach(c => el.classList.add(c));
        // Stagger delay for grids
        const delay = Math.min(i * 0.08, 0.4);
        el.style.transitionDelay = delay + 's';
      });
    });
  }
};

// ─── RIPPLE EFFECT ────────────────────────────────────────────────────────────
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

function initRipples() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.removeEventListener('click', addRipple);
    btn.addEventListener('click', addRipple);
  });
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
function skeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>`;
}

function showSkeletons(containerId, count = 8) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = Array(count).fill(skeletonCard()).join('');
}

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top';
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.title = 'Yuqoriga';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── HEADER SCROLL EFFECT ─────────────────────────────────────────────────────
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────────
function animateCounter(el, target, duration = 1500) {
  const start = performance.now();
  const isFloat = target % 1 !== 0;
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;
    el.textContent = isFloat
      ? current.toFixed(1)
      : Math.floor(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const stats = document.querySelectorAll('.hero-stat strong');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) animateCounter(el, num);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  stats.forEach(s => observer.observe(s));
}

// ─── SMOOTH IMAGE LOAD ────────────────────────────────────────────────────────
function initLazyImages() {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity .4s ease';
    img.addEventListener('load', () => { img.style.opacity = '1'; });
    if (img.complete) img.style.opacity = '1';
  });
}

// ─── TYPEWRITER EFFECT FOR HERO ───────────────────────────────────────────────
function initTypewriter() {
  const el = document.querySelector('.hero-typewriter');
  if (!el) return;
  const words = el.dataset.words?.split(',') || [];
  if (!words.length) return;
  let wi = 0, ci = 0, deleting = false;
  const type = () => {
    const word = words[wi % words.length];
    el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
    if (!deleting && ci > word.length) { deleting = true; setTimeout(type, 1200); return; }
    if (deleting && ci < 0) { deleting = false; wi++; ci = 0; }
    setTimeout(type, deleting ? 60 : 100);
  };
  type();
}

// ─── PRODUCT CARD HOVER 3D TILT ───────────────────────────────────────────────
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .4s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform .1s ease';
    });
  });
}

// ─── INIT ALL ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  LoadingBar.init();
  initHeaderScroll();
  initScrollTop();
  initCounters();
  initLazyImages();
  initTypewriter();

  // Small delay so DOM is fully rendered
  setTimeout(() => {
    ScrollReveal.autoTag();
    ScrollReveal.init();
    initRipples();
    initCardTilt();
  }, 100);

  // Re-init ripples after dynamic content loads
  const observer = new MutationObserver(() => {
    initRipples();
    ScrollReveal.autoTag();
    ScrollReveal.init();
    initCardTilt();
  });
  const grids = document.querySelectorAll('#featured-grid, #products-grid, #categories-grid, #new-grid');
  grids.forEach(g => { if (g) observer.observe(g, { childList: true }); });
});

// Export for use in other scripts
window.LoadingBar = LoadingBar;
window.showSkeletons = showSkeletons;
