let currentProduct = null;

async function loadProduct() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { window.location.href = 'products.html'; return; }

  try {
    const { product } = await api.get(`/products/${slug}`);
    currentProduct = product;
    renderProduct(product);
    loadReviews(product._id);
  } catch (err) {
    document.getElementById('product-container').innerHTML =
      `<div class="no-results"><i class="fas fa-exclamation-circle"></i><p>${err.message}</p></div>`;
  }
}

function renderProduct(p) {
  document.title = `${p.name} - TechStore`;

  // Breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `
    <a href="index.html">Bosh sahifa</a> /
    <a href="products.html?category=${p.category?._id}">${p.category?.name || 'Mahsulotlar'}</a> /
    <span>${p.name}</span>`;

  // Main image
  const mainImg = document.getElementById('main-image');
  if (mainImg) mainImg.src = p.images?.[0] || 'https://via.placeholder.com/500x400';

  // Thumbnails
  const thumbs = document.getElementById('thumbnails');
  if (thumbs && p.images?.length > 1) {
    thumbs.innerHTML = p.images.map((img, i) => `
      <img src="${img}" class="thumb ${i === 0 ? 'active' : ''}"
           onclick="changeImage('${img}', this)"
           onerror="this.src='https://via.placeholder.com/80x80'">`).join('');
  }

  // Info
  document.getElementById('product-brand').textContent = p.brand || '';
  document.getElementById('product-name').textContent = p.name;
  document.getElementById('product-rating-stars').innerHTML = renderStars(p.rating || 0);
  document.getElementById('product-review-count').textContent = `(${p.reviewCount || 0} sharh)`;
  document.getElementById('product-price').textContent = formatPrice(p.price);

  const origEl = document.getElementById('product-original-price');
  if (origEl) {
    if (p.originalPrice) { origEl.textContent = formatPrice(p.originalPrice); origEl.style.display = 'inline'; }
    else origEl.style.display = 'none';
  }

  const discEl = document.getElementById('product-discount');
  if (discEl) {
    if (p.discount > 0) { discEl.textContent = `-${p.discount}%`; discEl.style.display = 'inline-flex'; }
    else discEl.style.display = 'none';
  }

  const stockEl = document.getElementById('product-stock');
  if (stockEl) {
    stockEl.textContent = p.stock > 0 ? `Mavjud (${p.stock} ta)` : 'Tugagan';
    stockEl.className = `stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}`;
  }

  document.getElementById('product-description').textContent = p.description;

  // Specs
  const specsEl = document.getElementById('product-specs');
  if (specsEl && p.specifications?.length) {
    specsEl.innerHTML = p.specifications.map(s => `
      <tr><td class="spec-key">${s.key}</td><td class="spec-val">${s.value}</td></tr>`).join('');
  }

  // Add to cart
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.disabled = p.stock === 0;
    addBtn.textContent = p.stock === 0 ? 'Tugagan' : "Savatga qo'shish";
    addBtn.onclick = () => {
      const qty = parseInt(document.getElementById('qty-input')?.value || 1);
      Cart.add(p, qty);
      Cart.renderSidebar();
      showToast(`${p.name} savatga qo'shildi!`);
    };
  }

  const buyBtn = document.getElementById('buy-now-btn');
  if (buyBtn) {
    buyBtn.disabled = p.stock === 0;
    buyBtn.onclick = () => {
      if (!api.getUser()) { openLoginModal(); return; }
      const qty = parseInt(document.getElementById('qty-input')?.value || 1);
      Cart.add(p, qty);
      window.location.href = 'checkout.html';
    };
  }
}

function changeImage(src, el) {
  document.getElementById('main-image').src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function changeQty(delta) {
  const input = document.getElementById('qty-input');
  if (!input) return;
  const max = currentProduct?.stock || 99;
  input.value = Math.max(1, Math.min(max, parseInt(input.value) + delta));
}

async function loadReviews(productId) {
  const container = document.getElementById('reviews-list');
  if (!container) return;
  try {
    const { reviews } = await api.get(`/reviews/product/${productId}`);
    if (!reviews.length) {
      container.innerHTML = '<p class="no-reviews">Hali sharh yo\'q. Birinchi bo\'ling!</p>';
      return;
    }
    container.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-avatar">${r.user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <strong>${r.user?.name || 'Foydalanuvchi'}</strong>
            <div class="stars">${renderStars(r.rating)}</div>
          </div>
          <span class="review-date">${new Date(r.createdAt).toLocaleDateString('uz-UZ')}</span>
        </div>
        ${r.title ? `<p class="review-title">${r.title}</p>` : ''}
        <p class="review-comment">${r.comment}</p>
      </div>`).join('');
  } catch (e) { console.error(e); }
}

async function submitReview(e) {
  e.preventDefault();
  if (!api.getUser()) { openLoginModal(); return; }
  const btn = e.target.querySelector('button[type=submit]');
  const rating = document.querySelector('.star-select.selected')?.dataset.val || 5;
  const comment = document.getElementById('review-comment').value;
  try {
    btn.disabled = true;
    await api.post('/reviews', { productId: currentProduct._id, rating: parseInt(rating), comment });
    showToast('Sharhingiz qo\'shildi!');
    e.target.reset();
    document.querySelectorAll('.star-select').forEach(s => s.classList.remove('selected'));
    loadReviews(currentProduct._id);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  Cart.updateBadge();
  loadProduct();

  // Star selector
  document.querySelectorAll('.star-select').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      document.querySelectorAll('.star-select').forEach((s, i) => {
        s.classList.toggle('selected', i < val);
      });
    });
  });

  document.getElementById('review-form')?.addEventListener('submit', submitReview);
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
});
