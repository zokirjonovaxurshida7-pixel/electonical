let currentPage = 1;
let currentFilters = {};

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    search: p.get('search') || '',
    category: p.get('category') || '',
    brand: p.get('brand') || '',
    minPrice: p.get('minPrice') || '',
    maxPrice: p.get('maxPrice') || '',
    sort: p.get('sort') || 'newest',
    page: parseInt(p.get('page')) || 1
  };
}

async function fetchProducts(filters = {}) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  if (window.showSkeletons) showSkeletons('products-grid', 6);
  else grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Yuklanmoqda...</p></div>';

  const params = new URLSearchParams();  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

  try {
    const data = await api.get(`/products?${params.toString()}`);
    if (countEl) countEl.textContent = `${data.total} ta mahsulot topildi`;

    grid.innerHTML = data.products.length
      ? data.products.map(renderProductCard).join('')
      : `<div class="no-results"><i class="fas fa-search"></i><p>Mahsulot topilmadi</p></div>`;

    renderPagination(data.page, data.pages);
  } catch (err) {
    // Backend yo'q — mock data ko'rsatamiz
    const search = filters.search?.toLowerCase() || '';
    const filtered = MOCK_PRODUCTS.filter(p =>
      !search || p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search)
    );
    if (countEl) countEl.textContent = `${filtered.length} ta mahsulot topildi`;
    grid.innerHTML = filtered.length
      ? filtered.map(renderProductCard).join('')
      : `<div class="no-results"><i class="fas fa-search"></i><p>Mahsulot topilmadi</p></div>`;
  }
}

function renderPagination(page, pages) {
  const el = document.getElementById('pagination');
  if (!el || pages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = '';
  if (page > 1) html += `<button class="page-btn" onclick="goToPage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;

  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (page < pages) html += `<button class="page-btn" onclick="goToPage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  el.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  currentFilters.page = page;
  fetchProducts(currentFilters);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadSidebarCategories() {
  const container = document.getElementById('category-filters');
  if (!container) return;
  try {
    const { categories } = await api.get('/categories');
    const selected = currentFilters.category;
    container.innerHTML = categories.map(c => `
      <label class="filter-checkbox">
        <input type="radio" name="category" value="${c._id}" ${selected === c._id ? 'checked' : ''}>
        <span>${c.icon} ${c.name}</span>
      </label>`).join('');
  } catch (e) {
    // Mock categories
    const cats = typeof MOCK_CATEGORIES !== 'undefined' ? MOCK_CATEGORIES : [];
    container.innerHTML = cats.map(c => `
      <label class="filter-checkbox">
        <input type="radio" name="category" value="${c.slug}">
        <span>${c.icon} ${c.name}</span>
      </label>`).join('');
  }

  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      currentFilters.category = inp.value;
      currentFilters.page = 1;
      fetchProducts(currentFilters);
    });
  });
}

function initFilters() {
  const params = getUrlParams();
  currentFilters = { ...params };
  currentPage = params.page;

  // Fill search input
  const searchInput = document.getElementById('search-input');
  if (searchInput && params.search) searchInput.value = params.search;

  // Fill sort
  const sortEl = document.getElementById('sort-select');
  if (sortEl) {
    sortEl.value = params.sort;
    sortEl.addEventListener('change', () => {
      currentFilters.sort = sortEl.value;
      currentFilters.page = 1;
      fetchProducts(currentFilters);
    });
  }

  // Price range
  const minEl = document.getElementById('min-price');
  const maxEl = document.getElementById('max-price');
  if (minEl) {
    if (params.minPrice) minEl.value = params.minPrice;
    minEl.addEventListener('change', debounce(() => {
      currentFilters.minPrice = minEl.value;
      currentFilters.page = 1;
      fetchProducts(currentFilters);
    }, 500));
  }
  if (maxEl) {
    if (params.maxPrice) maxEl.value = params.maxPrice;
    maxEl.addEventListener('change', debounce(() => {
      currentFilters.maxPrice = maxEl.value;
      currentFilters.page = 1;
      fetchProducts(currentFilters);
    }, 500));
  }

  // Clear filters
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    currentFilters = { sort: 'newest', page: 1 };
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    if (sortEl) sortEl.value = 'newest';
    document.querySelectorAll('#category-filters input').forEach(i => i.checked = false);
    fetchProducts(currentFilters);
  });

  // Mobile filter toggle
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  Cart.updateBadge();
  initFilters();
  loadSidebarCategories();
  fetchProducts(currentFilters);

  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('login-btn')?.addEventListener('click', () => openLoginModal());
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => switchAuthTab(t.dataset.tab)));
  document.getElementById('auth-modal')?.addEventListener('click', e => { if (e.target.id === 'auth-modal') closeLoginModal(); });
  document.getElementById('cart-btn')?.addEventListener('click', openCart);
  document.getElementById('close-cart')?.addEventListener('click', closeCart);
  document.getElementById('overlay')?.addEventListener('click', closeCart);
  document.getElementById('menu-toggle')?.addEventListener('click', toggleMobileMenu);
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (q) { currentFilters.search = q; currentFilters.page = 1; fetchProducts(currentFilters); }
  });
});
