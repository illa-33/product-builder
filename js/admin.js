const isAdmin = sessionStorage.getItem('rb_admin') === 'true';

function initAdmin() {
  if (!isAdmin) return;
  
  const headerRight = document.getElementById('header-right');
  if (headerRight) {
    const adminBtn = document.createElement('button');
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
  modal.classList.add('active');
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const container = document.getElementById('account-modal-body');
  container.innerHTML = `
    <h3 style="text-transform:uppercase; margin-bottom: 20px;">Панель администратора</h3>
    <div style="display:grid; gap:10px;">
      <button onclick="renderAdminForm()" class="btn-black">Добавить товар</button>
      <button onclick="renderBulkUploadForm()" class="btn-black" style="background:transparent; color:black; border:1px solid black;">Массовая загрузка</button>
      <button onclick="logout()" class="btn-text" style="margin-top:10px;">Выйти</button>
    </div>
  `;
}

function renderAdminForm(product = null) {
  const container = document.getElementById('account-modal-body');
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

async function handleProductSubmit(e, id) {
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

    // Check if media is video
    const isVideo = finalMediaUrl && (finalMediaUrl.includes('.mp4') || finalMediaUrl.includes('.mov') || mediaFile?.type.startsWith('video/'));

    const productData = {
      name,
      price,
      category,
      image_url: isVideo ? null : finalMediaUrl,
      video_url: isVideo ? finalMediaUrl : null,
      detail_html: detailHtml || null,
      detail_image_url: finalDetailUrl || null,
      is_sold_out: isSoldOut,
      created_at: id ? undefined : new Date().toISOString() // 수정 시에는 created_at을 건드리지 않음
    };

    if (id) {
      await window.api.updateProduct(id, productData);
      alert('Товар обновлен.');
    } else {
      await window.api.addProduct(productData);
      alert('Товар добавлен.');
    }
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Ошибка: ' + err.message);
  }
}

function renderBulkUploadForm() {
  const container = document.getElementById('account-modal-body');
  container.innerHTML = `
    <h3 style="text-transform:uppercase;">Массовая загрузка</h3>
    <p style="font-size:12px; margin-bottom:10px; color:#666;">Введите JSON массив или CSV данные.</p>
    <textarea id="bulk-data" placeholder='[{"name": "Item 1", "price": 5000, "category": "tops"}]' style="height: 200px; width:100%; border:1px solid #ddd; padding:10px; font-family:monospace; font-size:12px;"></textarea>
    <div style="margin-top:20px; display:grid; gap:10px;">
      <button onclick="handleBulkUpload()" class="btn-black">Загрузить</button>
      <button onclick="renderAdminDashboard()" class="btn-text">Назад</button>
    </div>
  `;
}

async function handleBulkUpload() {
  const rawData = document.getElementById('bulk-data').value.trim();
  if (!rawData) return alert('Введите данные.');

  try {
    let products = [];
    if (rawData.startsWith('[')) {
      products = JSON.parse(rawData);
    } else {
      // Very simple CSV parser (header: name,price,category,image_url)
      const lines = rawData.split('\n');
      const header = lines[0].split(',');
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;
        let p = {};
        header.forEach((h, index) => {
          let val = values[index]?.trim();
          if (h.trim() === 'price') val = parseInt(val);
          p[h.trim()] = val;
        });
        products.push(p);
      }
    }

    if (!Array.isArray(products)) throw new Error('Данные должны быть массивом.');

    for (const p of products) {
      await window.api.addProduct({
        ...p,
        is_sold_out: p.is_sold_out || false,
        created_at: new Date().toISOString()
      });
    }
    alert('Массовая загрузка завершена.');
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Ошибка при разборе данных: ' + err.message);
  }
}

window.renderAdminForm = renderAdminForm;
window.renderBulkUploadForm = renderBulkUploadForm;
window.handleBulkUpload = handleBulkUpload;

document.addEventListener('DOMContentLoaded', initAdmin);
