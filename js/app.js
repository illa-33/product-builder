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
  try {
    allProducts = await window.api.fetchProducts();
  } catch(e) {
    console.error("Failed to fetch products", e);
    allProducts = []; // fallback
  }
}

function renderAll() {
  renderNewSection();
  renderProductGrid(currentCategory);
  updateCartUI();
}

function renderNewSection() {
  const container = document.getElementById('new-products-scroll');
  if (!container) return;

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
  const isAdmin = localStorage.getItem('rb_admin') === 'true';

  let filtered = allProducts.filter(p => {
    const matchCategory = (category === 'all' || p.category === category);
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sorted = filtered.sort((a, b) => {
    if (a.is_sold_out && !b.is_sold_out) return 1;
    if (!a.is_sold_out && b.is_sold_out) return -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  grid.innerHTML = sorted.map(p => `
    <div class="product-card ${p.is_sold_out ? 'sold-out' : ''}">
      <div class="img-wrapper" onclick="openProductDetail('${p.id}')">
        <img src="${p.image_url || 'https://via.placeholder.com/300x400?text=No+Image'}" alt="${p.name}" loading="lazy">
        ${p.is_sold_out ? '<div class="sold-out-badge">НЕТ В НАЛИЧИИ</div>' : ''}
      </div>
      <div class="product-info">
        <div onclick="openProductDetail('${p.id}')" style="cursor:pointer;">
          <div class="product-name">${p.name}</div>
          <div class="product-price">₽ ${p.price.toLocaleString()}</div>
        </div>
        ${isAdmin ? `
          <div class="admin-product-actions" style="margin-bottom:10px; display:flex; gap:5px;">
            <button onclick="editProductFromGrid('${p.id}')" style="font-size:10px; padding:4px;">Изменить</button>
            <button class="btn-delete" onclick="deleteProductFromGrid('${p.id}')" style="font-size:10px; padding:4px; color:red;">Удалить</button>
            <button class="btn-soldout" onclick="toggleSoldOutStatus('${p.id}', ${p.is_sold_out})" style="font-size:10px; padding:4px;">${p.is_sold_out ? 'В наличии' : 'Распродано'}</button>
          </div>
        ` : ''}
        <button class="add-btn" onclick="openProductDetail('${p.id}')" ${p.is_sold_out ? 'disabled' : ''}>
          ${p.is_sold_out ? 'Нет в наличии' : 'Подробнее'}
        </button>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderProductGrid(cat);
    });
  });

  // Cart event delegation
  const cartContainer = document.getElementById('cart-items');
  if (cartContainer) {
    cartContainer.addEventListener('click', function(e) {
      const target = e.target;
      
      // 버튼이 아닌 경우 무시
      if (!target) return;

      // Handle nested elements within the button just in case
      const btn = target.closest('.btn-increase, .btn-decrease, .btn-remove');
      if (!btn) return;

      const id = btn.dataset.id;
      if (!id) return;

      console.log('clicked:', btn.className, id);

      if (btn.classList.contains('btn-increase')) {
        changeQuantity(id, 1);
      }
      
      if (btn.classList.contains('btn-decrease')) {
        changeQuantity(id, -1);
      }
      
      if (btn.classList.contains('btn-remove')) {
        removeFromCart(id);
      }
    });
  }
}

// Side Menu
window.toggleSideMenu = () => {
  document.getElementById('side-menu').classList.toggle('active');
};

// Search Bar
window.toggleSearchBar = () => {
  const container = document.getElementById('search-bar-container');
  if (container) {
    if (container.style.display === 'block') {
      container.style.display = 'none';
      searchQuery = '';
      const input = document.getElementById('global-search-input');
      if(input) input.value = '';
      renderProductGrid(currentCategory);
    } else {
      container.style.display = 'block';
      const input = document.getElementById('global-search-input');
      if(input) input.focus();
    }
  }
};

let searchTimeout = null;
window.handleSearch = (value) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = value.trim();
    renderProductGrid(currentCategory);
  }, 300); // debounce 300ms
};

// Cart logic
function addToCart(idOrProduct, selectedOptions = {}) {
  let product;
  if (typeof idOrProduct === 'object' && idOrProduct !== null) {
    product = idOrProduct;
  } else {
    product = allProducts.find(p => p.id === idOrProduct);
  }

  if (!product || product.is_sold_out) return;

  // Use the requested comparison logic: same ID AND same options
  const existingItem = cart.find(item =>
    item.id === product.id &&
    JSON.stringify(item.selectedOptions || {}) === JSON.stringify(selectedOptions)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    // Create a unique cartId for internal tracking
    const optionKey = encodeURIComponent(JSON.stringify(selectedOptions));
    const cartId = `${product.id}-${optionKey}`;
    cart.push({ 
      cartId: cartId,
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
      selectedOptions: selectedOptions 
    });
  }
  saveCart();
  updateCartUI();
  window.openCart();
}

function removeFromCart(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const countEls = document.querySelectorAll('.cart-count');
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  countEls.forEach(el => el.innerText = totalCount);

  const container = document.getElementById('cart-items');
  if (!container) return;

  container.innerHTML = cart.map(item => {
    // Implement requested option display: Футбока (Black / L)
    const optionsStr = Object.values(item.selectedOptions || {}).join(' / ');
    const displayName = optionsStr ? `${item.name} (${optionsStr})` : item.name;

    return `
      <div class="cart-item">
        <img src="${item.image_url || 'https://via.placeholder.com/60x80?text=No+Image'}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${displayName}</div>
          <div class="cart-item-price">₽ ${item.price.toLocaleString()}</div>
          <div class="quantity-controls-mini">
            <button class="btn-decrease" data-id="${item.cartId}">-</button>
            <span>${item.quantity}</span>
            <button class="btn-increase" data-id="${item.cartId}">+</button>
          </div>
        </div>
        <button class="btn-remove" data-id="${item.cartId}">×</button>
      </div>
    `;
  }).join('');

  const goodsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = goodsTotal + SHIPPING_FEE;

  const goodsEl = document.getElementById('cart-goods-total');
  if (goodsEl) goodsEl.innerText = `₽ ${goodsTotal.toLocaleString()}`;

  const shippingEl = document.getElementById('cart-shipping');
  if (shippingEl) {
    shippingEl.innerText = `₽ ${SHIPPING_FEE.toLocaleString()}`;
  }
  
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.innerText = `₽ ${totalAmount.toLocaleString()}`;
}

function changeQuantity(cartId, delta) {
  const item = cart.find(x => x.cartId === cartId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(cartId);
    } else {
      saveCart();
      updateCartUI();
    }
  }
}

function saveCart() {
  localStorage.setItem('rb_cart', JSON.stringify(cart));
}

function sendWhatsApp() {
  if (cart.length === 0) {
    alert('Ваша корзина пуста.');
    return;
  }

  const itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = itemsTotal + SHIPPING_FEE;

  let msg = `Товары:\n`;
  cart.forEach(item => {
    const optionsStr = Object.values(item.selectedOptions || {}).join(' / ');
    const displayName = optionsStr ? `${item.name} (${optionsStr})` : item.name;
    msg += `${displayName} x ${item.quantity}\n`;
  });
  msg += `\nОбщая сумма: ${totalAmount} RUB`;

  const encodedMsg = encodeURIComponent(msg);
  window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`);
}

function openProductDetail(id) {
  window.location.href = `product.html?id=${id}`;
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.sendWhatsApp = sendWhatsApp;
window.openProductDetail = openProductDetail;
window.openCart = () => document.getElementById('cart-modal').classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

window.openAccount = () => {
  const modal = document.getElementById('account-modal');
  modal.classList.add('active');
  if (window.renderAccountContent) {
    window.renderAccountContent();
  }
};

document.addEventListener('DOMContentLoaded', init);
