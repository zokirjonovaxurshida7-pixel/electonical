const API_BASE = 'http://localhost:5000/api';

const api = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === 'admin';
  },
  isDemoMode() {
    const token = this.getToken();
    return token && token.startsWith('demo-token-');
  },

  async request(endpoint, options = {}) {
    // Demo rejimda mock data qaytarish
    if (this.isDemoMode()) {
      return this._mockResponse(endpoint, options);
    }
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xatolik yuz berdi');
    return data;
  },

  // Demo rejim uchun mock javoblar
  _mockResponse(endpoint, options = {}) {
    const method = options.method || 'GET';

    // Auth
    if (endpoint === '/auth/me') return Promise.resolve({ user: this.getUser() });

    if (endpoint === '/auth/register' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      if (!body.name || !body.email || !body.password)
        return Promise.reject(new Error('Ism, email va parol talab qilinadi'));
      // Mavjud foydalanuvchilarni tekshirish
      const existing = JSON.parse(localStorage.getItem('demo_users') || '[]');
      if (existing.find(u => u.email === body.email))
        return Promise.reject(new Error('Bu email allaqachon ro\'yxatdan o\'tgan'));
      const newUser = {
        _id: 'u-' + Date.now(),
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      existing.push({ ...newUser, password: body.password });
      localStorage.setItem('demo_users', JSON.stringify(existing));
      const token = 'demo-token-' + newUser._id;
      return Promise.resolve({ token, user: newUser });
    }

    if (endpoint === '/auth/login' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const found = users.find(u =>
        (u.email === body.email || u.name === body.email) && u.password === body.password
      );
      if (!found) return Promise.reject(new Error('Login yoki parol noto\'g\'ri'));
      if (!found.isActive) return Promise.reject(new Error('Akkount faol emas'));
      const { password, ...user } = found;
      const token = 'demo-token-' + user._id;
      return Promise.resolve({ token, user });
    }

    if (endpoint === '/auth/profile' && method === 'PUT') {
      const body = JSON.parse(options.body || '{}');
      const user = { ...this.getUser(), ...body };
      this.setAuth(this.getToken(), user);
      return Promise.resolve({ user });
    }
    if (endpoint === '/auth/change-password') return Promise.resolve({ message: 'Demo rejimda parol o\'zgartirilmaydi' });

    // Admin stats
    if (endpoint === '/admin/stats') return Promise.resolve({
      revenue: 54000000,
      totalOrders: 5,
      totalProducts: 12,
      totalUsers: 6,
      recentOrders: [
        { _id: 'o1', orderNumber: 'TS-001', user: { name: 'Alisher Karimov' }, total: 14500000, paymentStatus: 'paid', orderStatus: 'delivered', createdAt: '2024-05-01T10:00:00Z' },
        { _id: 'o2', orderNumber: 'TS-002', user: { name: 'Malika Yusupova' }, total: 3800000, paymentStatus: 'paid', orderStatus: 'shipped', createdAt: '2024-05-02T11:00:00Z' },
        { _id: 'o3', orderNumber: 'TS-003', user: { name: 'Bobur Toshmatov' }, total: 22000000, paymentStatus: 'pending', orderStatus: 'confirmed', createdAt: '2024-05-03T09:00:00Z' },
        { _id: 'o4', orderNumber: 'TS-004', user: { name: 'Nilufar Rahimova' }, total: 8500000, paymentStatus: 'paid', orderStatus: 'processing', createdAt: '2024-05-04T14:00:00Z' },
        { _id: 'o5', orderNumber: 'TS-005', user: { name: 'Jasur Mirzayev' }, total: 5200000, paymentStatus: 'failed', orderStatus: 'cancelled', createdAt: '2024-05-05T16:00:00Z' },
      ],
      topProducts: [
        { name: 'iPhone 15 Pro Max', price: 14500000, sold: 28, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=40&h=40&fit=crop'] },
        { name: 'MacBook Pro 14" M3', price: 22000000, sold: 15, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=40&h=40&fit=crop'] },
        { name: 'Sony WH-1000XM5', price: 3800000, sold: 42, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=40&h=40&fit=crop'] },
        { name: 'PlayStation 5', price: 8500000, sold: 19, images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=40&h=40&fit=crop'] },
        { name: 'Samsung Galaxy S24 Ultra', price: 13200000, sold: 11, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=40&h=40&fit=crop'] },
      ],
      monthlyRevenue: [
        { _id: { year: 2024, month: 1 }, revenue: 8500000 },
        { _id: { year: 2024, month: 2 }, revenue: 12000000 },
        { _id: { year: 2024, month: 3 }, revenue: 9800000 },
        { _id: { year: 2024, month: 4 }, revenue: 15200000 },
        { _id: { year: 2024, month: 5 }, revenue: 8500000 },
      ]
    });

    // Users
    if (endpoint.startsWith('/admin/users') && method === 'GET') {
      const mockUsers = [
        { _id: 'u1', name: 'Alisher Karimov', email: 'alisher@gmail.com', phone: '+998901234567', role: 'user', isActive: true, createdAt: '2024-01-15T10:00:00Z' },
        { _id: 'u2', name: 'Malika Yusupova', email: 'malika@gmail.com', phone: '+998901234568', role: 'user', isActive: true, createdAt: '2024-02-20T10:00:00Z' },
        { _id: 'u3', name: 'Bobur Toshmatov', email: 'bobur@gmail.com', phone: '+998901234569', role: 'user', isActive: false, createdAt: '2024-03-10T10:00:00Z' },
        { _id: 'u4', name: 'Nilufar Rahimova', email: 'nilufar@gmail.com', phone: '+998901234570', role: 'user', isActive: true, createdAt: '2024-04-05T10:00:00Z' },
        { _id: 'u5', name: 'Jasur Mirzayev', email: 'jasur@gmail.com', phone: '+998901234571', role: 'user', isActive: true, createdAt: '2024-05-01T10:00:00Z' },
        { _id: 'u6', name: 'Admin User', email: 'admin@techstore.uz', phone: '+998712345678', role: 'admin', isActive: true, createdAt: '2024-01-01T10:00:00Z' },
      ];
      const searchQ = endpoint.includes('search=') ? decodeURIComponent(endpoint.split('search=')[1]).toLowerCase() : '';
      const filtered = searchQ ? mockUsers.filter(u => u.name.toLowerCase().includes(searchQ) || u.email.toLowerCase().includes(searchQ)) : mockUsers;
      return Promise.resolve({ users: filtered, total: filtered.length, page: 1, pages: 1 });
    }
    if (endpoint.includes('/toggle') && method === 'PUT') {
      return Promise.resolve({ message: 'Demo rejimda o\'zgartirildi' });
    }

    // Products
    if (endpoint.startsWith('/products') && method === 'GET') {
      const mockProds = [
        { _id: 'p1', slug: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 14500000, originalPrice: 15000000, discount: 3, rating: 4.9, reviewCount: 128, stock: 25, isFeatured: true, isActive: true, sold: 28, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop'], category: { _id: 'cat1', name: 'Smartfonlar' } },
        { _id: 'p2', slug: 'samsung-galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 13200000, originalPrice: 14000000, discount: 6, rating: 4.8, reviewCount: 95, stock: 18, isFeatured: true, isActive: true, sold: 11, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'], category: { _id: 'cat1', name: 'Smartfonlar' } },
        { _id: 'p3', slug: 'macbook-pro-14-m3', name: 'MacBook Pro 14" M3', brand: 'Apple', price: 22000000, originalPrice: 23500000, discount: 6, rating: 4.9, reviewCount: 74, stock: 12, isFeatured: true, isActive: true, sold: 15, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'], category: { _id: 'cat2', name: 'Noutbuklar' } },
        { _id: 'p4', slug: 'sony-wh-1000xm5', name: 'Sony WH-1000XM5', brand: 'Sony', price: 3800000, originalPrice: 4200000, discount: 10, rating: 4.8, reviewCount: 210, stock: 35, isFeatured: true, isActive: true, sold: 42, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'], category: { _id: 'cat4', name: 'Quloqchinlar' } },
        { _id: 'p5', slug: 'apple-watch-series-9', name: 'Apple Watch Series 9', brand: 'Apple', price: 5200000, originalPrice: null, discount: 0, rating: 4.7, reviewCount: 88, stock: 22, isFeatured: true, isActive: true, sold: 19, images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop'], category: { _id: 'cat5', name: 'Smart Soatlar' } },
        { _id: 'p6', slug: 'playstation-5', name: 'PlayStation 5', brand: 'Sony', price: 8500000, originalPrice: null, discount: 0, rating: 4.9, reviewCount: 312, stock: 10, isFeatured: true, isActive: true, sold: 19, images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop'], category: { _id: 'cat7', name: 'Gaming' } },
        { _id: 'p7', slug: 'ipad-pro-12-m2', name: 'iPad Pro 12.9" M2', brand: 'Apple', price: 11500000, originalPrice: null, discount: 0, rating: 4.8, reviewCount: 56, stock: 15, isFeatured: false, isActive: true, sold: 8, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'], category: { _id: 'cat3', name: 'Planshetlar' } },
        { _id: 'p8', slug: 'dell-xps-15', name: 'Dell XPS 15', brand: 'Dell', price: 18500000, originalPrice: null, discount: 0, rating: 4.6, reviewCount: 43, stock: 8, isFeatured: false, isActive: true, sold: 5, images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'], category: { _id: 'cat2', name: 'Noutbuklar' } },
        { _id: 'p9', slug: 'airpods-pro-2nd-gen', name: 'AirPods Pro 2nd Gen', brand: 'Apple', price: 3200000, originalPrice: null, discount: 0, rating: 4.7, reviewCount: 167, stock: 40, isFeatured: false, isActive: true, sold: 33, images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop'], category: { _id: 'cat4', name: 'Quloqchinlar' } },
        { _id: 'p10', slug: 'samsung-65-qled-4k', name: 'Samsung 65" QLED 4K TV', brand: 'Samsung', price: 16500000, originalPrice: 18000000, discount: 8, rating: 4.7, reviewCount: 89, stock: 7, isFeatured: true, isActive: true, sold: 6, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&h=300&fit=crop'], category: { _id: 'cat8', name: 'Aksessuarlar' } },
        { _id: 'p11', slug: 'sony-a7-iv', name: 'Sony A7 IV', brand: 'Sony', price: 28000000, originalPrice: null, discount: 0, rating: 4.9, reviewCount: 34, stock: 6, isFeatured: false, isActive: true, sold: 3, images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'], category: { _id: 'cat6', name: 'Kameralar' } },
        { _id: 'p12', slug: 'usb-c-hub-7in1', name: 'USB-C Hub 7-in-1', brand: 'Anker', price: 450000, originalPrice: null, discount: 0, rating: 4.5, reviewCount: 203, stock: 60, isFeatured: false, isActive: true, sold: 47, images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop'], category: { _id: 'cat8', name: 'Aksessuarlar' } },
      ];
      // search filter
      const searchQ = endpoint.includes('search=') ? decodeURIComponent(endpoint.split('search=')[1].split('&')[0]).toLowerCase() : '';
      const filtered = searchQ ? mockProds.filter(p => p.name.toLowerCase().includes(searchQ) || p.brand.toLowerCase().includes(searchQ)) : mockProds;
      // single product by id or slug — faqat /products/SOMETHING shaklida
      const afterSlash = endpoint.replace('/products', '');
      if (afterSlash.startsWith('/') && !afterSlash.startsWith('/?')) {
        const idOrSlug = afterSlash.replace('/', '').split('?')[0];
        if (idOrSlug) {
          const found = mockProds.find(p => p._id === idOrSlug || p.slug === idOrSlug);
          if (found) return Promise.resolve({ product: found });
          return Promise.reject(new Error('Mahsulot topilmadi'));
        }
      }
      return Promise.resolve({ products: filtered, total: filtered.length, page: 1, pages: 1 });
    }
    if (endpoint.startsWith('/products') && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      body._id = 'new-' + Date.now();
      body.isActive = true;
      body.sold = 0;
      return Promise.resolve({ product: body });
    }
    if (endpoint.startsWith('/products') && method === 'PUT') {
      return Promise.resolve({ product: JSON.parse(options.body || '{}') });
    }
    if (endpoint.startsWith('/products') && method === 'DELETE') return Promise.resolve({ message: 'O\'chirildi' });

    // Categories
    if (endpoint.startsWith('/categories') && method === 'GET') {
      const mockCats = [
        { _id: 'cat1', name: 'Smartfonlar',   slug: 'smartphones',   icon: '📱', order: 1, isActive: true },
        { _id: 'cat2', name: 'Noutbuklar',    slug: 'laptops',       icon: '💻', order: 2, isActive: true },
        { _id: 'cat3', name: 'Planshetlar',   slug: 'tablets',       icon: '📟', order: 3, isActive: true },
        { _id: 'cat4', name: 'Quloqchinlar',  slug: 'headphones',    icon: '🎧', order: 4, isActive: true },
        { _id: 'cat5', name: 'Smart Soatlar', slug: 'smart-watches', icon: '⌚', order: 5, isActive: true },
        { _id: 'cat6', name: 'Kameralar',     slug: 'cameras',       icon: '📷', order: 6, isActive: true },
        { _id: 'cat7', name: 'Gaming',        slug: 'gaming',        icon: '🎮', order: 7, isActive: true },
        { _id: 'cat8', name: 'Aksessuarlar',  slug: 'accessories',   icon: '🔌', order: 8, isActive: true },
      ];
      // single category by id
      const afterCatSlash = endpoint.replace('/categories', '');
      if (afterCatSlash.startsWith('/') && !afterCatSlash.startsWith('/?')) {
        const catId = afterCatSlash.replace('/', '').split('?')[0];
        if (catId) {
          const found = mockCats.find(c => c._id === catId);
          if (found) return Promise.resolve({ category: found });
          return Promise.reject(new Error('Kategoriya topilmadi'));
        }
      }
      return Promise.resolve({ categories: mockCats });
    }
    if (endpoint.startsWith('/categories') && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      body._id = 'cat-' + Date.now();
      body.isActive = true;
      return Promise.resolve({ category: body });
    }
    if (endpoint.startsWith('/categories') && method === 'PUT') {
      return Promise.resolve({ category: JSON.parse(options.body || '{}') });
    }
    if (endpoint.startsWith('/categories') && method === 'DELETE') return Promise.resolve({ message: 'O\'chirildi' });

    // Orders
    if (endpoint.startsWith('/orders') && method === 'GET') {
      const mockOrders = [
        { _id: 'o1', orderNumber: 'TS-001', user: { name: 'Alisher Karimov', email: 'alisher@gmail.com' }, total: 14500000, paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: 'click', createdAt: '2024-05-01T10:00:00Z', items: [{ name: 'iPhone 15 Pro Max', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=52&h=52&fit=crop', quantity: 1, price: 14500000 }] },
        { _id: 'o2', orderNumber: 'TS-002', user: { name: 'Malika Yusupova', email: 'malika@gmail.com' }, total: 3800000, paymentStatus: 'paid', orderStatus: 'shipped', paymentMethod: 'payme', createdAt: '2024-05-02T11:00:00Z', items: [{ name: 'Sony WH-1000XM5', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=52&h=52&fit=crop', quantity: 1, price: 3800000 }] },
        { _id: 'o3', orderNumber: 'TS-003', user: { name: 'Bobur Toshmatov', email: 'bobur@gmail.com' }, total: 22000000, paymentStatus: 'pending', orderStatus: 'confirmed', paymentMethod: 'cash', createdAt: '2024-05-03T09:00:00Z', items: [{ name: 'MacBook Pro 14" M3', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=52&h=52&fit=crop', quantity: 1, price: 22000000 }] },
        { _id: 'o4', orderNumber: 'TS-004', user: { name: 'Nilufar Rahimova', email: 'nilufar@gmail.com' }, total: 8500000, paymentStatus: 'paid', orderStatus: 'processing', paymentMethod: 'click', createdAt: '2024-05-04T14:00:00Z', items: [{ name: 'PlayStation 5', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=52&h=52&fit=crop', quantity: 1, price: 8500000 }] },
        { _id: 'o5', orderNumber: 'TS-005', user: { name: 'Jasur Mirzayev', email: 'jasur@gmail.com' }, total: 5200000, paymentStatus: 'failed', orderStatus: 'cancelled', paymentMethod: 'payme', createdAt: '2024-05-05T16:00:00Z', items: [{ name: 'Apple Watch Series 9', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=52&h=52&fit=crop', quantity: 1, price: 5200000 }] },
      ];
      // status filter
      const statusFilter = endpoint.includes('status=') ? endpoint.split('status=')[1] : '';
      const filtered = statusFilter ? mockOrders.filter(o => o.orderStatus === statusFilter) : mockOrders;
      return Promise.resolve({ orders: filtered, total: filtered.length, page: 1, pages: 1 });
    }
    if (endpoint.includes('/status') && method === 'PUT') return Promise.resolve({ order: {} });

    // Reviews
    if (endpoint.startsWith('/reviews')) return Promise.resolve({ reviews: [] });

    return Promise.resolve({});
  },

  get(ep) { return this.request(ep); },
  post(ep, body) { return this.request(ep, { method: 'POST', body: JSON.stringify(body) }); },
  put(ep, body) { return this.request(ep, { method: 'PUT', body: JSON.stringify(body) }); },
  del(ep) { return this.request(ep, { method: 'DELETE' }); }
};
