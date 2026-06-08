/* ═══════════════════════════════════════════════════════════════════════════════
   THEME.JS — Dark / Light mode toggle
   ═══════════════════════════════════════════════════════════════════════════════ */

const Theme = {
  STORAGE_KEY: 'techstore_theme',

  get() {
    return localStorage.getItem(this.STORAGE_KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  },

  set(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this._updateIcons(theme);
    this._updateMetaTheme(theme);
  },

  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark';
    this.set(next);
    // Small bounce animation on toggle
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.style.transform = 'scale(.9)';
      setTimeout(() => btn.style.transform = '', 200);
    }
  },

  init() {
    // Apply saved theme immediately (before paint) to avoid flash
    const theme = this.get();
    document.documentElement.setAttribute('data-theme', theme);
    this._updateMetaTheme(theme);

    // Build toggle button HTML
    document.addEventListener('DOMContentLoaded', () => {
      this._injectToggle();
      this._updateIcons(theme);

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.set(e.matches ? 'dark' : 'light');
        }
      });
    });
  },

  _injectToggle() {
    // Find nav-actions in all pages and inject toggle
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const wrap = document.createElement('div');
    wrap.className = 'theme-toggle-wrap';
    wrap.innerHTML = `
      <i class="fas fa-sun sun-icon"></i>
      <button class="theme-toggle" id="theme-toggle" title="Tungi/Kunduzgi rejim" aria-label="Toggle dark mode"></button>
      <i class="fas fa-moon moon-icon"></i>`;

    // Insert before login button
    const loginBtn = navActions.querySelector('#login-btn');
    if (loginBtn) {
      navActions.insertBefore(wrap, loginBtn);
    } else {
      navActions.prepend(wrap);
    }

    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggle());
  },

  _updateIcons(theme) {
    const sun  = document.querySelector('.sun-icon');
    const moon = document.querySelector('.moon-icon');
    if (!sun || !moon) return;
    if (theme === 'dark') {
      sun.style.opacity  = '.4';
      moon.style.opacity = '1';
    } else {
      sun.style.opacity  = '1';
      moon.style.opacity = '.4';
    }
  },

  _updateMetaTheme(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? '#0f172a' : '#ffffff';
  }
};

// Init immediately so theme applies before DOM paint (no flash)
Theme.init();
