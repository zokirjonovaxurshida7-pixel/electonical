function renderOrderSummary() {
  const items = Cart.get();
  const container = document.getElementById('order-items');
  const subtotalEl = document.getElementById('order-subtotal');
  const shippingEl = document.getElementById('order-shipping');
  const totalEl = document.getElementById('order-total');

  if (!items.length) { window.location.href = 'index.html'; return; }

  if (container) {
    container.innerHTML = items.map(i => `
      <div class="order-item">
        <img src="${i.image}" alt="${i.name}" onerror="this.src='https://via.placeholder.com/50x50'">
        <div class="order-item-info">
          <p>${i.name}</p>
          <small>${i.quantity} x ${formatPrice(i.price)}</small>
        </div>
        <span>${formatPrice(i.price * i.quantity)}</span>
      </div>`).join('');
  }

  const subtotal = Cart.getTotal();
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Bepul' : formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(total);
}

async function placeOrder(e) {
  e.preventDefault();
  const user = api.getUser();
  if (!user) { openLoginModal(); return; }

  const btn = document.getElementById('place-order-btn');
  const method = document.querySelector('input[name="payment"]:checked')?.value;
  if (!method) { showToast('To\'lov usulini tanlang', 'error'); return; }

  const shippingAddress = {
    name: document.getElementById('sh-name').value,
    phone: document.getElementById('sh-phone').value,
    street: document.getElementById('sh-street').value,
    city: document.getElementById('sh-city').value,
    region: document.getElementById('sh-region').value
  };

  const items = Cart.get().map(i => ({ productId: i.productId, quantity: i.quantity }));

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buyurtma berilmoqda...';

    const { order } = await api.post('/orders', { items, shippingAddress, paymentMethod: method });

    if (method === 'cash') {
      Cart.clear();
      window.location.href = `order-success.html?orderId=${order._id}&orderNumber=${order.orderNumber}`;
      return;
    }

    // Online payment
    const endpoint = method === 'click' ? '/payment/click/initiate' : '/payment/payme/initiate';
    const { paymentUrl } = await api.post(endpoint, { orderId: order._id });
    Cart.clear();
    window.location.href = paymentUrl;

  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Buyurtma berish';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!api.getUser()) { openLoginModal(); }
  updateAuthUI();
  Cart.updateBadge();
  renderOrderSummary();

  document.getElementById('checkout-form')?.addEventListener('submit', placeOrder);
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
