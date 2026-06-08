const Cart = {
  STORAGE_KEY: 'techstore_cart',

  get() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  save(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateBadge();
  },

  add(product, qty = 1) {
    const items = this.get();
    const idx = items.findIndex(i => i.productId === product._id);
    if (idx > -1) {
      items[idx].quantity += qty;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || 'https://via.placeholder.com/100x100',
        price: product.price,
        quantity: qty
      });
    }
    this.save(items);
  },

  remove(productId) {
    this.save(this.get().filter(i => i.productId !== productId));
  },

  updateQty(productId, qty) {
    const items = this.get();
    const idx = items.findIndex(i => i.productId === productId);
    if (idx > -1) {
      if (qty <= 0) { items.splice(idx, 1); }
      else { items[idx].quantity = qty; }
    }
    this.save(items);
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateBadge();
  },

  getTotal() {
    return this.get().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getCount() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = this.getCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  renderSidebar() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    if (!list) return;

    const items = this.get();
    if (!items.length) {
      list.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-shopping-cart"></i>
          <p>Savat bo'sh</p>
        </div>`;
      if (totalEl) totalEl.textContent = "0 so'm";
      return;
    }

    list.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.productId}">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60'">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">${formatPrice(item.price)}</p>
          <div class="cart-item-qty">
            <button onclick="Cart.updateQty('${item.productId}', ${item.quantity - 1}); Cart.renderSidebar()">−</button>
            <span>${item.quantity}</span>
            <button onclick="Cart.updateQty('${item.productId}', ${item.quantity + 1}); Cart.renderSidebar()">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove('${item.productId}'); Cart.renderSidebar()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');

    if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
  }
};
