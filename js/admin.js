// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
function requireAdmin() {
  const user = api.getUser();
  const token = api.getToken();
  if (!user || !token || user.role !== 'admin') {
    window.location.href = '../index.html';
    return;
  }
  // Demo rejimda token tekshirilmaydi
  if (token === 'demo-token-admin') return;
}

function setAdminName() {
  const user = api.getUser();
  const el = document.getElementById('admin-name');
  if (el && user) el.textContent = user.name;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await api.get('/admin/stats');
    renderStatCards(data);
    renderRecentOrders(data.recentOrders || []);
    renderTopProducts(data.topProducts || []);
    renderRevenueChart(data.monthlyRevenue || []);
  } catch (err) {
    showToast('Dashboard yuklanmadi: ' + err.message, 'error');
    // Mock data ko'rsatish
    renderStatCards({ revenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 });
    renderRecentOrders([]);
    renderTopProducts([]);
  }
}

function renderStatCards(data) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-revenue', formatPrice(data.revenue || 0));
  set('stat-orders', (data.totalOrders || 0).toLocaleString());
  set('stat-products', (data.totalProducts || 0).toLocaleString());
  set('stat-users', (data.totalUsers || 0).toLocaleString());
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--gray-400)">Buyurtmalar yo\'q</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber || o._id?.slice(-6) || '-'}</strong></td>
      <td>${o.user?.name || '-'}</td>
      <td>${formatPrice(o.total || 0)}</td>
      <td><span class="status-badge status-${o.paymentStatus}">${paymentStatusLabel(o.paymentStatus)}</span></td>
      <td><span class="status-badge status-${o.orderStatus}">${orderStatusLabel(o.orderStatus)}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
    </tr>`).join('');
}

function renderTopProducts(products) {
  const list = document.getElementById('top-products-list');
  if (!list) return;
  if (!products.length) {
    list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--gray-400)">Ma\'lumot yo\'q</div>';
    return;
  }
  list.innerHTML = products.map((p, i) => `
    <div class="top-product-item">
      <span class="rank">${i + 1}</span>
      <img src="${p.images?.[0] || 'https://via.placeholder.com/40x40'}" alt="${p.name}"
           onerror="this.src='https://via.placeholder.com/40x40'">
      <div class="top-product-info">
        <p>${p.name}</p>
        <small>${formatPrice(p.price || 0)}</small>
      </div>
      <span class="sold-count">${p.sold || 0} ta sotildi</span>
    </div>`).join('');
}

function renderRevenueChart(monthlyData) {
  const canvas = document.getElementById('revenue-chart');
  if (!canvas) return;
  if (!window.Chart) {
    canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:40px">Chart.js yuklanmadi</p>';
    return;
  }
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const labels = monthlyData.length
    ? monthlyData.map(d => `${months[d._id.month - 1]} ${d._id.year}`)
    : months;
  const revenues = monthlyData.length
    ? monthlyData.map(d => d.revenue)
    : new Array(12).fill(0);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: "Daromad (so'm)",
        data: revenues,
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => (v / 1000000).toFixed(1) + 'M' }
        }
      }
    }
  });
}

// ─── PRODUCTS ADMIN ───────────────────────────────────────────────────────────
let allCategories = [];
let editingProductId = null;

async function loadAdminProducts(search = '') {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const ep = search ? `/products?limit=100&search=${encodeURIComponent(search)}` : '/products?limit=100';
    const { products } = await api.get(ep);
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400)">Mahsulotlar yo\'q</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.images?.[0] || 'https://via.placeholder.com/50x50'}" class="table-img"
                 onerror="this.src='https://via.placeholder.com/50x50'"></td>
        <td><strong>${p.name}</strong><br><small style="color:var(--gray-500)">${p.brand || ''}</small></td>
        <td>${p.category?.name || '-'}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="${p.stock < 5 ? 'text-danger' : ''}">${p.stock}</span></td>
        <td><span class="status-badge ${p.isActive !== false ? 'status-paid' : 'status-failed'}">${p.isActive !== false ? 'Faol' : 'Nofaol'}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-outline" onclick="openEditProduct('${p._id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger)">${err.message}</td></tr>`;
  }
}

async function loadCategoriesForForm() {
  try {
    const { categories } = await api.get('/categories');
    allCategories = categories;
    const sel = document.getElementById('prod-category');
    if (sel) sel.innerHTML = categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  } catch (e) { console.error('Categories load error:', e); }
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById('product-modal-title').textContent = "Mahsulot qo'shish";
  document.getElementById('product-form').reset();
  document.getElementById('product-modal').classList.add('active');
}

async function openEditProduct(id) {
  editingProductId = id;
  document.getElementById('product-modal-title').textContent = 'Mahsulotni tahrirlash';
  try {
    // ID bo'yicha to'g'ridan-to'g'ri olish
    const { product: p } = await api.get(`/products/${id}`);
    if (!p) { showToast('Mahsulot topilmadi', 'error'); return; }
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-slug').value = p.slug;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-brand').value = p.brand || '';
    document.getElementById('prod-description').value = p.description || '';
    document.getElementById('prod-category').value = p.category?._id || p.category || '';
    document.getElementById('prod-images').value = (p.images || []).join('\n');
    document.getElementById('prod-featured').checked = !!p.isFeatured;
    document.getElementById('product-modal').classList.add('active');
  } catch (err) { showToast(err.message, 'error'); }
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const body = {
    name: document.getElementById('prod-name').value.trim(),
    slug: document.getElementById('prod-slug').value.trim(),
    price: parseFloat(document.getElementById('prod-price').value),
    stock: parseInt(document.getElementById('prod-stock').value),
    brand: document.getElementById('prod-brand').value.trim(),
    description: document.getElementById('prod-description').value.trim(),
    category: document.getElementById('prod-category').value,
    images: document.getElementById('prod-images').value.split('\n').map(s => s.trim()).filter(Boolean),
    isFeatured: document.getElementById('prod-featured').checked
  };
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    if (editingProductId) {
      await api.put(`/products/${editingProductId}`, body);
      showToast('Mahsulot yangilandi');
    } else {
      await api.post('/products', body);
      showToast("Mahsulot qo'shildi");
    }
    document.getElementById('product-modal').classList.remove('active');
    loadAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Saqlash';
  }
}

async function deleteProduct(id) {
  if (!confirm('Mahsulotni o\'chirmoqchimisiz?')) return;
  try {
    await api.del(`/products/${id}`);
    showToast("Mahsulot o'chirildi");
    loadAdminProducts();
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── ORDERS ADMIN ─────────────────────────────────────────────────────────────
async function loadAdminOrders(status = '') {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const ep = status ? `/orders?status=${status}` : '/orders';
    const { orders } = await api.get(ep);
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-400)">Buyurtmalar yo\'q</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.orderNumber || o._id?.slice(-6) || '-'}</strong></td>
        <td>${o.user?.name || '-'}<br><small style="color:var(--gray-500)">${o.user?.email || ''}</small></td>
        <td>${formatPrice(o.total || 0)}</td>
        <td><span class="status-badge status-${o.paymentStatus}">${paymentStatusLabel(o.paymentStatus)}</span></td>
        <td>
          <select class="status-select form-control" style="padding:4px 8px;font-size:.8rem"
                  onchange="updateOrderStatus('${o._id}', this.value)">
            ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s =>
              `<option value="${s}" ${o.orderStatus === s ? 'selected' : ''}>${orderStatusLabel(s)}</option>`
            ).join('')}
          </select>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await api.put(`/orders/${id}/status`, { status });
    showToast('Status yangilandi');
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── USERS ADMIN ──────────────────────────────────────────────────────────────
async function loadAdminUsers(search = '') {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const ep = search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users';
    const { users } = await api.get(ep);
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-400)">Foydalanuvchilar yo\'q</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar-sm">${(u.name || '?')[0].toUpperCase()}</div>
            <div><strong>${u.name}</strong><br><small style="color:var(--gray-500)">${u.email}</small></div>
          </div>
        </td>
        <td>${u.phone || '-'}</td>
        <td><span class="role-badge role-${u.role}">${u.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}</span></td>
        <td><span class="status-badge ${u.isActive ? 'status-paid' : 'status-failed'}">${u.isActive ? 'Faol' : 'Bloklangan'}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('uz-UZ')}</td>
        <td>
          <button class="btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-outline'}" onclick="toggleUser('${u._id}')">
            <i class="fas fa-${u.isActive ? 'ban' : 'check'}"></i>
            ${u.isActive ? 'Bloklash' : 'Faollashtirish'}
          </button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${err.message}</td></tr>`;
  }
}

async function toggleUser(id) {
  try {
    await api.put(`/admin/users/${id}/toggle`);
    showToast('Foydalanuvchi holati yangilandi');
    loadAdminUsers();
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── CATEGORIES ADMIN ─────────────────────────────────────────────────────────
let editingCategoryId = null;

async function loadAdminCategories() {
  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const { categories } = await api.get('/categories');
    if (!categories.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-400)">Kategoriyalar yo\'q</td></tr>';
      return;
    }
    tbody.innerHTML = categories.map(c => `
      <tr>
        <td style="font-size:1.5rem">${c.icon || '📦'}</td>
        <td><strong>${c.name}</strong></td>
        <td><code style="background:var(--gray-100);padding:2px 6px;border-radius:4px">${c.slug}</code></td>
        <td>${c.order || '-'}</td>
        <td><span class="status-badge ${c.isActive !== false ? 'status-paid' : 'status-failed'}">${c.isActive !== false ? 'Faol' : 'Nofaol'}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-outline" onclick="openEditCategory('${c._id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c._id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger)">${err.message}</td></tr>`;
  }
}

function openAddCategory() {
  editingCategoryId = null;
  document.getElementById('category-modal-title').textContent = "Kategoriya qo'shish";
  document.getElementById('category-form').reset();
  document.getElementById('category-modal').classList.add('active');
}

async function openEditCategory(id) {
  editingCategoryId = id;
  document.getElementById('category-modal-title').textContent = 'Kategoriyani tahrirlash';
  try {
    const { category: c } = await api.get(`/categories/${id}`);
    if (!c) { showToast('Kategoriya topilmadi', 'error'); return; }
    document.getElementById('cat-name').value = c.name;
    document.getElementById('cat-slug').value = c.slug;
    document.getElementById('cat-icon').value = c.icon || '';
    document.getElementById('cat-order').value = c.order || 1;
    document.getElementById('category-modal').classList.add('active');
  } catch (err) { showToast(err.message, 'error'); }
}

async function saveCategory(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const body = {
    name: document.getElementById('cat-name').value.trim(),
    slug: document.getElementById('cat-slug').value.trim(),
    icon: document.getElementById('cat-icon').value.trim(),
    order: parseInt(document.getElementById('cat-order').value) || 1
  };
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    if (editingCategoryId) {
      await api.put(`/categories/${editingCategoryId}`, body);
      showToast('Kategoriya yangilandi');
    } else {
      await api.post('/categories', body);
      showToast("Kategoriya qo'shildi");
    }
    document.getElementById('category-modal').classList.remove('active');
    loadAdminCategories();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Saqlash';
  }
}

async function deleteCategory(id) {
  if (!confirm('Kategoriyani o\'chirmoqchimisiz?')) return;
  try {
    await api.del(`/categories/${id}`);
    showToast("Kategoriya o'chirildi");
    loadAdminCategories();
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function paymentStatusLabel(s) {
  return { pending: 'Kutilmoqda', paid: "To'langan", failed: 'Xatolik', refunded: 'Qaytarildi' }[s] || s;
}
function orderStatusLabel(s) {
  return { pending: 'Yangi', confirmed: 'Tasdiqlandi', processing: 'Tayyorlanmoqda', shipped: 'Yetkazilmoqda', delivered: 'Yetkazildi', cancelled: 'Bekor qilindi' }[s] || s;
}

function adminLogout() {
  api.clearAuth();
  window.location.href = '../index.html';
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  setAdminName();

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    if (window.Theme) Theme.toggle();
  });

  // Dashboard
  if (document.getElementById('stat-revenue')) loadDashboard();

  // Products page
  if (document.getElementById('products-tbody')) {
    loadAdminProducts();
    loadCategoriesForForm();
    document.getElementById('add-product-btn')?.addEventListener('click', openAddProduct);
    document.getElementById('product-form')?.addEventListener('submit', saveProduct);
    document.getElementById('close-product-modal')?.addEventListener('click', () => {
      document.getElementById('product-modal').classList.remove('active');
    });
    // Search
    let searchTimer;
    document.getElementById('product-search')?.addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadAdminProducts(e.target.value.trim()), 400);
    });
    // Auto-generate slug from name
    document.getElementById('prod-name')?.addEventListener('input', e => {
      const slugEl = document.getElementById('prod-slug');
      if (slugEl && !editingProductId) {
        slugEl.value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    });
  }

  // Orders page
  if (document.getElementById('orders-tbody')) {
    loadAdminOrders();
    document.querySelectorAll('.order-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.order-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadAdminOrders(tab.dataset.status);
      });
    });
  }

  // Users page
  if (document.getElementById('users-tbody')) {
    loadAdminUsers();
    let userSearchTimer;
    document.getElementById('user-search')?.addEventListener('input', e => {
      clearTimeout(userSearchTimer);
      userSearchTimer = setTimeout(() => loadAdminUsers(e.target.value.trim()), 400);
    });
  }

  // Categories page
  if (document.getElementById('categories-tbody')) {
    loadAdminCategories();
    document.getElementById('add-category-btn')?.addEventListener('click', openAddCategory);
    document.getElementById('category-form')?.addEventListener('submit', saveCategory);
    document.getElementById('close-category-modal')?.addEventListener('click', () => {
      document.getElementById('category-modal').classList.remove('active');
    });
    document.getElementById('cat-name')?.addEventListener('input', e => {
      const slugEl = document.getElementById('cat-slug');
      if (slugEl && !editingCategoryId) {
        slugEl.value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    });
  }

  document.getElementById('admin-logout')?.addEventListener('click', adminLogout);
});
