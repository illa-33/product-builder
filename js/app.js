let allProducts = [];
let cart = JSON.parse(localStorage.getItem('rb_cart')) || [];
const whatsappNumber = '821068448600';
const SHIPPING_FEE = 500;
let currentCategory = 'all';
let searchQuery = '';

async function init() {
  await loadProducts();
  renderAll();
  setupEventListeners();
}

async function loadProducts() {
  allProducts = await window.api.fetchProducts();
}

function renderAll() {
  renderNewSection();
  renderProductGrid();
  updateCartUI();
}

function renderNewSection() {
  const container = document.getElementById('new-products-scroll');
  if (!container) return;

  // New products: latest 8, not necessarily sold out excluded but latest first
  const newItems = [...allProducts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  container.innerHTML = newItems.map(p => `
    <div class="new-product-card" onclick="openProductDetail('${p.id}')">
      <div class="img-wrapper">
        <img src="${p.image_url || 'https://via.placeholder.com/300x400?text=No+Image'}" alt="${p.name}" loading="lazy">
      </div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="price">₽ ${p.price.toLocaleString()}</div>
      </div>
    </div>
  `).join('');
}

function renderProductGrid(category = 'all') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  currentCategory = category;
  const isAdmin = sessionStorage.getItem('rb_admin') === 'true';

  let filtered = allProducts.filter(p => {
    const matchCategory = (category === 'all' || p.category === category);
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Sort: sold out at bottom, then latest
  const sorted = filtered.sort((a, b) => {
    if (a.is_sold_out && !b.is_sold_out) return 1;
    if (!a.is_sold_out && b.is_sold_out) return -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  grid.innerHTML = sorted.map(p => `
    <div class="product-card ${p.is_sold_out ? 'sold-out' : ''}">
      <div class="img-wrapper" onclick="openProductDetail('${p.id}')">
        <img src="${p.image_url || 'https://via.placeholder.com/300x400?text=No+Image'}" alt="${p.name}" loading="lazy">
        ${p.is_sold_out ? '<div class="sold-out-badge">SOLD OUT</div>' : ''}
      </div>
      <div class="product-info">
        <div onclick="openProductDetail('${p.id}')">
          <div class="product-name">${p.name}</div>
          <div class="product-price">₽ ${p.price.toLocaleString()}</div>
        </div>
        ${isAdmin ? `
          <div class="admin-product-actions">
            <button onclick="editProductFromGrid('${p.id}')">Изменить</button>
            <button class="btn-delete" onclick="deleteProductFromGrid('${p.id}')">Удалить</button>
            <button class="btn-soldout" onclick="toggleSoldOutStatus('${p.id}', ${p.is_sold_out})">${p.is_sold_out ? 'В наличии' : 'Нет в наличии'}</button>
          </div>
        ` : ''}
        <button class="add-btn" onclick="addToCart('${p.id}')" ${p.is_sold_out ? 'disabled' : ''}>
          ${p.is_sold_out ? 'Нет в наличии' : 'В корзину'}
        </button>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  // Category tabs
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderProductGrid(cat);
    });
  });
}

window.toggleSideMenu = () => {
  document.getElementById('side-menu').classList.toggle('active');
};

function addToCart(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product || product.is_sold_out) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
  }
  saveCart();
  updateCartUI();
  openCart();
}

window.changeQuantity = (id, delta) => {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
};

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.innerText = count);

  const cartItemsContainer = document.getElementById('cart-items');
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 20px; color:#999;">Ваша корзина пуста.</p>';
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image_url || 'https://via.placeholder.com/100x130'}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₽ ${item.price.toLocaleString()} x ${item.quantity}</div>
            <div class="quantity-controls-mini">
              <button onclick="changeQuantity('${item.id}', -1)">-</button>
              <span>${item.quantity}</span>
              <button onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.id}')">×</button>
        </div>
      `).join('');
    }
  }

  const goodsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = goodsTotal + SHIPPING_FEE;

  if (document.getElementById('cart-goods-total')) {
    document.getElementById('cart-goods-total').innerText = `₽ ${goodsTotal.toLocaleString()}`;
  }
  if (document.getElementById('cart-shipping')) {
    document.getElementById('cart-shipping').innerText = `₽ ${SHIPPING_FEE.toLocaleString()}`;
  }
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.innerText = `₽ ${total.toLocaleString()}`;
}

function saveCart() {
  localStorage.setItem('rb_cart', JSON.stringify(cart));
}

function sendWhatsApp() {
  if (cart.length === 0) {
    alert('Ваша корзина пуста.');
    return;
  }

  const goodsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = goodsTotal + SHIPPING_FEE;

  let msg = `[ORDER]\n`;
  cart.forEach(item => {
    msg += `- ${item.name} x ${item.quantity}\n`;
  });
  msg += `\nТовары: ₽ ${goodsTotal.toLocaleString()}\nДоставка: ₽ ${SHIPPING_FEE.toLocaleString()}\nИтого: ₽ ${total.toLocaleString()}`;

  const encodedMsg = encodeURIComponent(msg);
  window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`);
}

function openProductDetail(id) {
  // Navigation to detail page if needed
  // window.location.href = `product.html?id=${id}`;
  const p = allProducts.find(x => x.id === id);
  if (p) {
    alert(`Детали товара: ${p.name}\n(Функционал детальной страницы в разработке)`);
  }
}

// Modal functions
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.sendWhatsApp = sendWhatsApp;
window.openProductDetail = openProductDetail;
window.openCart = () => document.getElementById('cart-modal').classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

window.openAccount = () => {
  const modal = document.getElementById('account-modal');
  modal.classList.add('active');
  renderAccountContent();
};

function renderAccountContent() {
  const container = document.getElementById('account-modal-body');
  container.innerHTML = `
    <div class="account-notice">
      <p>Вы можете сделать заказ без регистрации.<br>
      Добавьте нужные товары в корзину и отправьте заказ через WhatsApp.<br>
      Стоимость доставки оплачивается один раз за заказ. (₽500)</p>
    </div>
    <div class="admin-login-link">
      <button onclick="showAdminLogin()" class="btn-text">Вход для администратора</button>
    </div>
  `;
}

window.showAdminLogin = () => {
  const container = document.getElementById('account-modal-body');
  container.innerHTML = `
    <h3 style="text-transform:uppercase;">Вход для администратора</h3>
    <form onsubmit="handleAdminLogin(event)" class="account-form">
      <input type="password" id="admin-pass" placeholder="Пароль" required>
      <button type="submit" class="btn-black">Войти</button>
      <button type="button" onclick="renderAccountContent()" class="btn-text">Назад</button>
    </form>
  `;
};

window.handleAdminLogin = (e) => {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  // Simple password check for demo purposes
  if (pass === '01068448600') {
    sessionStorage.setItem('rb_admin', 'true');
    location.reload();
  } else {
    alert('Неверный пароль.');
  }
};

window.logout = () => {
  sessionStorage.removeItem('rb_admin');
  location.reload();
};

document.addEventListener('DOMContentLoaded', init);
