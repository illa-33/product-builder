const getIsAdmin = () => localStorage.getItem('rb_admin') === 'true';

function initAdmin() {
  if (!getIsAdmin()) return;
  
  const headerRight = document.getElementById('header-right');
  if (headerRight && !document.getElementById('admin-header-add-btn')) {
    const adminBtn = document.createElement('button');
    adminBtn.id = 'admin-header-add-btn';
    adminBtn.className = 'icon-btn';
    adminBtn.style.fontSize = '14px';
    adminBtn.style.fontWeight = '700';
    adminBtn.style.border = '1px solid black';
    adminBtn.style.padding = '5px 10px';
    adminBtn.style.borderRadius = '4px';
    adminBtn.innerText = '＋ TOBAP';
    adminBtn.onclick = openAdminModal;
    headerRight.prepend(adminBtn);
  }
}

function openAdminModal() {
  const modal = document.getElementById('account-modal');
  if(modal) {
    modal.classList.add('active');
    renderAdminDashboard();
  }
}

window.renderAccountContent = function() {
  if (getIsAdmin()) {
    renderAdminDashboard();
  } else {
    renderCustomerNotice();
  }
}

function renderCustomerNotice() {
  const container = document.getElementById('account-modal-body');
  if (!container) return;
  container.innerHTML = `
    <div class="account-notice">
      <strong>Добро пожаловать!</strong><br>
      Это информационная панель. Если вы хотите сделать заказ, пожалуйста, добавьте товары в корзину и оформите заказ через WhatsApp.
    </div>
    <div class="admin-login-link">
      <button onclick="renderLoginForm()" class="btn-text">Вход для администратора</button>
    </div>
  `;
}

window.renderLoginForm = function() {
  const container = document.getElementById('account-modal-body');
  if (!container) return;
  container.innerHTML = `
    <h3 style="text-transform:uppercase; margin-bottom: 20px;">Вход для администратора</h3>
    <form onsubmit="handleLogin(event)" class="account-form">
      <div class="form-group">
        <label>Логин</label>
        <input type="text" id="login-user" required>
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input type="password" id="login-pass" required>
      </div>
      <button type="submit" class="btn-black">Войти</button>
      <button type="button" onclick="renderCustomerNotice()" class="btn-text" style="margin-top:10px;">Назад</button>
    </form>
  `;
}

window.handleLogin = function(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;

  // Credentials from previous version
  if (user === 'islam0814' && pass === '01068448600') {
    localStorage.setItem('rb_admin', 'true');
    alert('Добро пожаловать, администратор!');
    location.reload();
  } else {
    alert('Неверный логин или пароль');
  }
}

function renderAdminDashboard() {
  const container = document.getElementById('account-modal-body');
  if(!container) return;
  container.innerHTML = `
    <h3 style="text-transform:uppercase; margin-bottom: 20px;">Панель администратора</h3>
    <div style="display:grid; gap:10px;">
      <button onclick="renderAdminForm()" class="btn-black">Добавить товар</button>
      <button onclick="renderBulkUploadForm()" class="btn-black" style="background:transparent; color:black; border:1px solid black;">Массовая загрузка</button>
      <button onclick="logout()" class="btn-text" style="margin-top:10px;">Выйти</button>
    </div>
  `;
}

window.logout = function() {
  localStorage.removeItem('rb_admin');
  location.reload();
}

window.renderAdminForm = function(product = null) {
  const container = document.getElementById('account-modal-body');
  if(!container) return;
  container.innerHTML = `
    <h3 style="text-transform:uppercase;">${product ? 'Редактировать' : 'Добавить'} товар</h3>
    <form onsubmit="handleProductSubmit(event, ${product ? `'${product.id}'` : 'null'})" class="account-form">
      <div class="form-group">
        <label>Название товара</label>
        <input type="text" id="p-name" value="${product ? product.name : ''}" required>
      </div>
      <div class="form-group">
        <label>Цена (₽)</label>
        <input type="number" id="p-price" value="${product ? product.price : ''}" required>
      </div>
      <div class="form-group">
        <label>Категория</label>
        <select id="p-category" required>
          <option value="outer" ${product?.category === 'outer' ? 'selected' : ''}>Аутер</option>
          <option value="tops" ${product?.category === 'tops' ? 'selected' : ''}>Верх</option>
          <option value="bottoms" ${product?.category === 'bottoms' ? 'selected' : ''}>Низ</option>
          <option value="shoes" ${product?.category === 'shoes' ? 'selected' : ''}>Обувь</option>
          <option value="bags" ${product?.category === 'bags' ? 'selected' : ''}>Сумки</option>
          <option value="hats" ${product?.category === 'hats' ? 'selected' : ''}>Шапки</option>
          <option value="sports" ${product?.category === 'sports' ? 'selected' : ''}>Спорт</option>
          <option value="accessories" ${product?.category === 'accessories' ? 'selected' : ''}>Аксессуары</option>
        </select>
      </div>
      <div class="form-group">
        <label>Медиа (Изображение/Видео URL)</label>
        <input type="text" id="p-media-url" value="${product ? (product.image_url || product.video_url || '') : ''}" placeholder="Введите URL">
        <p style="font-size:10px; color:#999;">ИЛИ загрузите файл:</p>
        <input type="file" id="p-media-file" accept="image/*,video/*">
      </div>
      <div class="form-group">
        <label>Детали (HTML или Image URL)</label>
        <textarea id="p-detail-html" placeholder="Введите HTML (опционально)">${product ? (product.detail_html || '') : ''}</textarea>
        <input type="text" id="p-detail-url" value="${product ? (product.detail_image_url || '') : ''}" placeholder="URL изображения деталей">
        <p style="font-size:10px; color:#999;">ИЛИ загрузите файл:</p>
        <input type="file" id="p-detail-file" accept="image/*">
      </div>
      <div class="form-group" style="display:flex; align-items:center; gap:10px; flex-direction:row;">
        <input type="checkbox" id="p-sold-out" style="width:auto;" ${product?.is_sold_out ? 'checked' : ''}> 
        <label for="p-sold-out" style="margin:0;">Нет в наличии</label>
      </div>
      <button type="submit" class="btn-black">${product ? 'Сохранить' : 'Добавить'}</button>
      <button type="button" onclick="renderAdminDashboard()" class="btn-text">Назад</button>
    </form>
  `;
}

window.handleProductSubmit = async function(e, id) {
  e.preventDefault();
  const name = document.getElementById('p-name').value;
  const price = parseInt(document.getElementById('p-price').value);
  const category = document.getElementById('p-category').value;
  const mediaUrl = document.getElementById('p-media-url').value;
  const mediaFile = document.getElementById('p-media-file').files[0];
  const detailHtml = document.getElementById('p-detail-html').value;
  const detailUrl = document.getElementById('p-detail-url').value;
  const detailFile = document.getElementById('p-detail-file').files[0];
  const isSoldOut = document.getElementById('p-sold-out').checked;

  try {
    let finalMediaUrl = mediaUrl;
    if (mediaFile) {
      finalMediaUrl = await window.api.uploadFile(mediaFile);
    }

    let finalDetailUrl = detailUrl;
    if (detailFile) {
      finalDetailUrl = await window.api.uploadFile(detailFile);
    }

    const isVideo = finalMediaUrl && (finalMediaUrl.includes('.mp4') || finalMediaUrl.includes('.mov') || mediaFile?.type.startsWith('video/'));

    const productData = {
      name,
      price,
      category,
      image_url: isVideo ? null : finalMediaUrl,
      video_url: isVideo ? finalMediaUrl : null,
      detail_html: detailHtml || null,
      detail_image_url: finalDetailUrl || null,
      is_sold_out: isSoldOut
    };

    if (id) {
      await window.api.updateProduct(id, productData);
      alert('Товар обновлен.');
    } else {
      productData.created_at = new Date().toISOString();
      await window.api.addProduct(productData);
      alert('Товар добавлен.');
    }
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Ошибка: ' + err.message);
  }
}

window.renderBulkUploadForm = function() {
  const container = document.getElementById('account-modal-body');
  container.innerHTML = `
    <h3 style="text-transform:uppercase;">Массовая загрузка</h3>
    <p style="font-size:12px; margin-bottom:10px; color:#666;">Введите JSON массив.</p>
    <textarea id="bulk-data" placeholder='[{"name": "Item 1", "price": 5000, "category": "tops"}]' style="height: 200px; width:100%; border:1px solid #ddd; padding:10px; font-family:monospace; font-size:12px;"></textarea>
    <div style="margin-top:20px; display:grid; gap:10px;">
      <button onclick="handleBulkUpload()" class="btn-black">Загрузить</button>
      <button onclick="renderAdminDashboard()" class="btn-text">Назад</button>
    </div>
  `;
}

window.handleBulkUpload = async function() {
  const dataStr = document.getElementById('bulk-data').value;
  try {
    const arr = JSON.parse(dataStr);
    if(!Array.isArray(arr)) throw new Error("Not an array");
    
    for (const item of arr) {
      if(!item.name || !item.price || !item.category) {
        throw new Error("Missing required fields (name, price, category)");
      }
      item.created_at = new Date().toISOString();
      await window.api.addProduct(item);
    }
    alert('Успешно загружено!');
    location.reload();
  } catch (err) {
    alert('Ошибка: Неверный формат JSON или данные. ' + err.message);
  }
}

// Global functions for grid actions
window.editProductFromGrid = function(id) {
  if (typeof allProducts !== 'undefined') {
    const p = allProducts.find(x => x.id === id);
    if (p) {
      const modal = document.getElementById('account-modal');
      modal.classList.add('active');
      window.renderAdminForm(p);
    }
  } else {
    window.api.fetchProducts().then(products => {
      const p = products.find(x => x.id === id);
      if (p) {
        const modal = document.getElementById('account-modal');
        modal.classList.add('active');
        window.renderAdminForm(p);
      }
    });
  }
};

window.deleteProductFromGrid = async function(id) {
  if (confirm('Вы уверены, что хотите удалить этот товар?')) {
    try {
      await window.api.deleteProduct(id);
      alert('Товар удален.');
      location.reload();
    } catch(err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  }
};

window.toggleSoldOutStatus = async function(id, currentStatus) {
  try {
    await window.api.updateProduct(id, { is_sold_out: !currentStatus });
    location.reload();
  } catch(err) {
    alert('Ошибка обновления статуса: ' + err.message);
  }
};

document.addEventListener('DOMContentLoaded', initAdmin);
