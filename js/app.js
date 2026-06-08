// ─── UTILITIES ───────────────────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += '<i class="fas fa-star"></i>';
    else if (i === full + 1 && half) html += '<i class="fas fa-star-half-alt"></i>';
    else html += '<i class="far fa-star"></i>';
  }
  return html;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
    <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function renderProductCard(product) {
  const discount = product.discount > 0
    ? `<span class="badge badge-danger">-${product.discount}%</span>` : '';
  const outOfStock = product.stock === 0
    ? `<span class="badge badge-gray">Tugagan</span>` : '';
  return `
    <div class="product-card">
      <a href="product.html?slug=${product.slug}" class="product-card-img-wrap">
        ${discount}${outOfStock}
        <img src="${product.images?.[0] || 'https://via.placeholder.com/300x220'}"
             alt="${product.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x220'">
      </a>
      <div class="product-card-body">
        <p class="product-brand">${product.brand || ''}</p>
        <a href="product.html?slug=${product.slug}" class="product-name">${product.name}</a>
        <div class="product-rating">
          <span class="stars">${renderStars(product.rating || 0)}</span>
          <span class="review-count">(${product.reviewCount || 0})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="product-original-price">${formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-block btn-add-cart"
          onclick="addToCartHandler(${JSON.stringify(product).replace(/"/g, '&quot;')})"
          ${product.stock === 0 ? 'disabled' : ''}>
          <i class="fas fa-cart-plus"></i>
          ${product.stock === 0 ? 'Tugagan' : "Savatga qo'shish"}
        </button>
      </div>
    </div>`;
}

function addToCartHandler(product) {
  Cart.add(product, 1);
  Cart.renderSidebar();
  showToast(`${product.name} savatga qo'shildi!`);
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function updateAuthUI() {
  const user = api.getUser();
  const loginBtn = document.getElementById('login-btn');
  const userMenu = document.getElementById('user-menu');
  const userNameEl = document.getElementById('user-name');
  const adminLink = document.getElementById('admin-link');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
  } else {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

function openLoginModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('active');
    switchAuthTab(tab);
  }
}

function closeLoginModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === `${tab}-form`));
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Demo admin: tezkor kirish
  const isAdminDemo = (email === 'admin' || email === 'admin@techstore.uz') && password === 'admin123';
  if (isAdminDemo) {
    const demoUser = { _id: 'demo-admin', name: 'Admin', email: 'admin@techstore.uz', role: 'admin', isActive: true };
    api.setAuth('demo-token-admin', demoUser);
    updateAuthUI();
    closeLoginModal();
    showToast('Xush kelibsiz, Admin!');
    setTimeout(() => { if (confirm('Admin panelga o\'tishni xohlaysizmi?')) window.location.href = 'admin/index.html'; }, 500);
    return;
  }

  try {
    btn.disabled = true; btn.textContent = 'Kirish...';

    let data;
    // Demo rejimda localStorage dan tekshirish
    const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const demoFound = demoUsers.find(u =>
      (u.email === email || u.name === email) && u.password === password
    );
    if (demoFound) {
      const { password: _, ...user } = demoFound;
      data = { token: 'demo-token-' + user._id, user };
    } else {
      data = await api.post('/auth/login', { email, password });
    }

    api.setAuth(data.token, data.user);
    updateAuthUI();
    closeLoginModal();
    showToast(`Xush kelibsiz, ${data.user.name}!`);
    if (data.user.role === 'admin') {
      setTimeout(() => { if (confirm('Admin panelga o\'tishni xohlaysizmi?')) window.location.href = 'admin/index.html'; }, 500);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Kirish';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const phone = document.getElementById('reg-phone').value;
  try {
    btn.disabled = true; btn.textContent = "Ro'yxatdan o'tilmoqda...";

    let data;
    try {
      // Avval real backendga urinib ko'ramiz
      data = await api.post('/auth/register', { name, email, password, phone });
    } catch (backendErr) {
      // Backend ishlamasa — demo rejimda saqlash
      const existing = JSON.parse(localStorage.getItem('demo_users') || '[]');
      if (existing.find(u => u.email === email))
        throw new Error('Bu email allaqachon ro\'yxatdan o\'tgan');
      const newUser = {
        _id: 'u-' + Date.now(),
        name, email, phone: phone || '',
        role: 'user', isActive: true,
        createdAt: new Date().toISOString()
      };
      existing.push({ ...newUser, password });
      localStorage.setItem('demo_users', JSON.stringify(existing));
      data = { token: 'demo-token-' + newUser._id, user: newUser };
    }

    api.setAuth(data.token, data.user);
    updateAuthUI();
    closeLoginModal();
    showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = "Ro'yxatdan o'tish";
  }
}

function handleLogout() {
  api.clearAuth();
  Cart.clear();
  updateAuthUI();
  showToast('Chiqildi');
  setTimeout(() => window.location.href = 'index.html', 500);
}

// ─── CART SIDEBAR ─────────────────────────────────────────────────────────────
function openCart() {
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
  Cart.renderSidebar();
}

function closeCart() {
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
let searchTimeout;
function handleSearch(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = e.target.value.trim();
    if (q.length > 1) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
  }, 400);
}

// ─── MOCK DATA (backend ishlamasa ishlatiladi) ────────────────────────────────
const MOCK_CATEGORIES = [
  { _id: 'cat1', name: 'Smartfonlar',    slug: 'smartphones',   icon: '📱' },
  { _id: 'cat2', name: 'Noutbuklar',     slug: 'laptops',       icon: '💻' },
  { _id: 'cat3', name: 'Planshetlar',    slug: 'tablets',       icon: '📟' },
  { _id: 'cat4', name: 'Quloqchinlar',   slug: 'headphones',    icon: '🎧' },
  { _id: 'cat5', name: 'Smart Soatlar',  slug: 'smart-watches', icon: '⌚' },
  { _id: 'cat6', name: 'Kameralar',      slug: 'cameras',       icon: '📷' },
  { _id: 'cat7', name: 'Gaming',         slug: 'gaming',        icon: '🎮' },
  { _id: 'cat8', name: 'Aksessuarlar',   slug: 'accessories',   icon: '🔌' },
];

const MOCK_PRODUCTS = [
  {
    _id: 'p1', slug: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max',
    brand: 'Apple', price: 14500000, originalPrice: 15000000, discount: 3,
    rating: 4.9, reviewCount: 128, stock: 25, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop'],
    category: { _id: 'cat1', name: 'Smartfonlar' }
  },
  {
    _id: 'p2', slug: 'samsung-galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung', price: 13200000, originalPrice: 14000000, discount: 6,
    rating: 4.8, reviewCount: 95, stock: 18, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'],
    category: { _id: 'cat1', name: 'Smartfonlar' }
  },
  {
    _id: 'p3', slug: 'macbook-pro-14-m3', name: 'MacBook Pro 14" M3',
    brand: 'Apple', price: 22000000, originalPrice: 23500000, discount: 6,
    rating: 4.9, reviewCount: 74, stock: 12, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'],
    category: { _id: 'cat2', name: 'Noutbuklar' }
  },
  {
    _id: 'p4', slug: 'sony-wh-1000xm5', name: 'Sony WH-1000XM5',
    brand: 'Sony', price: 3800000, originalPrice: 4200000, discount: 10,
    rating: 4.8, reviewCount: 210, stock: 35, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'],
    category: { _id: 'cat4', name: 'Quloqchinlar' }
  },
  {
    _id: 'p5', slug: 'apple-watch-series-9', name: 'Apple Watch Series 9',
    brand: 'Apple', price: 5200000, originalPrice: null, discount: 0,
    rating: 4.7, reviewCount: 88, stock: 22, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop'],
    category: { _id: 'cat5', name: 'Smart Soatlar' }
  },
  {
    _id: 'p6', slug: 'playstation-5', name: 'PlayStation 5',
    brand: 'Sony', price: 8500000, originalPrice: null, discount: 0,
    rating: 4.9, reviewCount: 312, stock: 10, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop'],
    category: { _id: 'cat7', name: 'Gaming' }
  },
  {
    _id: 'p7', slug: 'ipad-pro-12-m2', name: 'iPad Pro 12.9" M2',
    brand: 'Apple', price: 11500000, originalPrice: null, discount: 0,
    rating: 4.8, reviewCount: 56, stock: 15, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'],
    category: { _id: 'cat3', name: 'Planshetlar' }
  },
  {
    _id: 'p8', slug: 'dell-xps-15', name: 'Dell XPS 15',
    brand: 'Dell', price: 18500000, originalPrice: null, discount: 0,
    rating: 4.6, reviewCount: 43, stock: 8, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'],
    category: { _id: 'cat2', name: 'Noutbuklar' }
  },
  {
    _id: 'p9', slug: 'airpods-pro-2nd-gen', name: 'AirPods Pro 2nd Gen',
    brand: 'Apple', price: 3200000, originalPrice: null, discount: 0,
    rating: 4.7, reviewCount: 167, stock: 40, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop'],
    category: { _id: 'cat4', name: 'Quloqchinlar' }
  },
  {
    _id: 'p10', slug: 'samsung-65-qled-4k', name: 'Samsung 65" QLED 4K TV',
    brand: 'Samsung', price: 16500000, originalPrice: 18000000, discount: 8,
    rating: 4.7, reviewCount: 89, stock: 7, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=300&fit=crop'],
    category: { _id: 'cat8', name: 'Aksessuarlar' }
  },
  {
    _id: 'p11', slug: 'sony-a7-iv', name: 'Sony A7 IV',
    brand: 'Sony', price: 28000000, originalPrice: null, discount: 0,
    rating: 4.9, reviewCount: 34, stock: 6, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'],
    category: { _id: 'cat6', name: 'Kameralar' }
  },
  {
    _id: 'p12', slug: 'usb-c-hub-7in1', name: 'USB-C Hub 7-in-1',
    brand: 'Anker', price: 450000, originalPrice: null, discount: 0,
    rating: 4.5, reviewCount: 203, stock: 60, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop'],
    category: { _id: 'cat8', name: 'Aksessuarlar' }
  },
];

// ─── HOMEPAGE LOADERS ─────────────────────────────────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  try {
    const { categories } = await api.get('/categories');
    grid.innerHTML = categories.map(c => `
      <a href="products.html?category=${c._id}" class="category-card">
        <span class="category-icon">${c.icon}</span>
        <span class="category-name">${c.name}</span>
      </a>`).join('');
  } catch (e) {
    // Backend yo'q — mock data ishlatamiz
    grid.innerHTML = MOCK_CATEGORIES.map(c => `
      <a href="products.html?search=${c.slug}" class="category-card">
        <span class="category-icon">${c.icon}</span>
        <span class="category-name">${c.name}</span>
      </a>`).join('');
  }
}

async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    if (window.showSkeletons) showSkeletons('featured-grid', 8);
    if (window.LoadingBar) LoadingBar.start();
    const { products } = await api.get('/products?featured=true&limit=8');
    grid.innerHTML = products.length
      ? products.map(renderProductCard).join('')
      : MOCK_PRODUCTS.filter(p => p.isFeatured).map(renderProductCard).join('');
    if (window.LoadingBar) LoadingBar.done();
  } catch (e) {
    // Mock data
    grid.innerHTML = MOCK_PRODUCTS.filter(p => p.isFeatured).map(renderProductCard).join('');
    if (window.LoadingBar) LoadingBar.done();
  }
}

async function loadNewArrivals() {
  const grid = document.getElementById('new-grid');
  if (!grid) return;
  try {
    if (window.showSkeletons) showSkeletons('new-grid', 4);
    const { products } = await api.get('/products?sort=newest&limit=4');
    grid.innerHTML = products.length
      ? products.map(renderProductCard).join('')
      : MOCK_PRODUCTS.slice(0, 4).map(renderProductCard).join('');
  } catch (e) {
    grid.innerHTML = MOCK_PRODUCTS.slice(0, 4).map(renderProductCard).join('');
  }
}

// ─── MOBILE MENU ──────────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('nav-links')?.classList.toggle('open');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  Cart.updateBadge();
  loadCategories();
  loadFeaturedProducts();
  loadNewArrivals();

  // Auth modal events
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('login-btn')?.addEventListener('click', () => openLoginModal('login'));
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  // Modal close on backdrop
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target.id === 'auth-modal') closeLoginModal();
  });

  // Cart
  document.getElementById('cart-btn')?.addEventListener('click', openCart);
  document.getElementById('close-cart')?.addEventListener('click', closeCart);
  document.getElementById('overlay')?.addEventListener('click', closeCart);

  // Search
  document.getElementById('search-input')?.addEventListener('input', handleSearch);
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
  });

  // Mobile menu
  document.getElementById('menu-toggle')?.addEventListener('click', toggleMobileMenu);

  // Checkout redirect
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (!api.getUser()) { openLoginModal(); showToast('Buyurtma berish uchun kiring', 'info'); return; }
    if (Cart.getCount() === 0) { showToast('Savat bo\'sh', 'error'); return; }
    window.location.href = 'checkout.html';
  });
});
