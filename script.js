// Danh sách nhạc
const IMGBB_API_KEY = 'a2e37053f8981f1f85b08d5a676775b2';
const playlist = [
  "TikDown.com_TikTok_Media_002_0597ce2c603da8d81843864ee15722fd.mp3",
  "Tikviewer_NHC_LOFI_CHILL_D_NG_aveeplayermusicqdmusicqdmusic1_1763800893902.mp3",
  "TikDown.com_TikTok_Media_002_a36a703cbabc0874146559388b1ec2f7.mp3",
  "https://demngayyeu-jade.vercel.app/img/ST.mp3",
];

let index = 0;
const audio = document.getElementById("audio");
const title = document.getElementById("title");
const playBtn = document.getElementById("playBtn");

// Hàm cập nhật tiêu đề và nguồn nhạc
function loadTrack() {
  const trackNumber = (index % playlist.length) + 1;
  audio.src = playlist[index % playlist.length];
  title.innerHTML = `♪ Nhạc Chill #${trackNumber} - SANG DEV SHOP ♪`;
}

// Hàm chuyển bài và tự động phát
function playTrack() {
  loadTrack();
  audio.play();
  playBtn.textContent = "⏸";
}

// Hàm cập nhật icon Play/Pause
function updatePlayPauseIcon() {
  playBtn.textContent = audio.paused ? "▶" : "⏸";
}

// Khởi động lần đầu
playTrack();

// Nút Play/Pause
playBtn.onclick = () => {
  audio.paused ? audio.play() : audio.pause();
  updatePlayPauseIcon();
};

// Nút Previous
document.getElementById("prev").onclick = () => {
  index--;
  if (index < 0) index = playlist.length - 1;
  playTrack();
};

// Nút Next
document.getElementById("next").onclick = () => {
  index++;
  playTrack();
};

// Khi bài hát kết thúc → tự động chuyển bài tiếp theo
audio.onended = () => {
  index++;
  playTrack();
};

// Cập nhật icon
audio.onplay = audio.onpause = updatePlayPauseIcon;

// === CONFIG FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyCTnc0HQWRxsHDEWlJ4ZT9yqKDbC8unm00",
  authDomain: "adminshop-c2ac2.firebaseapp.com",
  projectId: "adminshop-c2ac2",
  storageBucket: "adminshop-c2ac2.firebasestorage.app",
  messagingSenderId: "583532399934",
  appId: "1:583532399934:web:23a213d578f3144053706f",
  measurementId: "G-9D6JRTW7TM"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;
let isAdmin = false;
let editingProductId = null;

// Biến phân trang và phân loại
let allProducts = [];
let currentPage = 1;
let currentCategory = 'all';
const itemsPerPage = 9;

// ==================== KHỞI TẠO BAN ĐẦU ====================
document.addEventListener('DOMContentLoaded', function() {
  showSection('productsSection');
  setupCategoryFilter();
  loadProducts();
  setupAuthForm();
});

// ==================== THIẾT LẬP FORM ĐĂNG NHẬP ====================
function setupAuthForm() {
  const authTitle = document.getElementById('authTitle');
  const authAction = document.getElementById('authAction');
  const usernameGroup = document.getElementById('usernameGroup');
  
  document.getElementById('toggleAuth').onclick = () => {
    const isLogin = authTitle.innerText === 'Đăng nhập';
    authTitle.innerText = isLogin ? 'Đăng ký' : 'Đăng nhập';
    authAction.innerText = isLogin ? 'Đăng ký' : 'Đăng nhập';
    usernameGroup.style.display = isLogin ? 'block' : 'none';
  };
  
  authAction.onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    const username = document.getElementById('username').value.trim();
    const isLoginMode = authTitle.innerText === 'Đăng nhập';
    
    if (!email || !pass) return alert('Nhập đầy đủ thông tin');
    if (!isLoginMode && !username) return alert('Nhập tên hiển thị');
    
    try {
      if (isLoginMode) {
        await auth.signInWithEmailAndPassword(email, pass);
      } else {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(cred.user.uid).set({
          username, 
          email, 
          balance: 0, 
          role: 'user', 
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      document.getElementById('email').value = '';
      document.getElementById('pass').value = '';
      document.getElementById('username').value = '';
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };
}

// ==================== SỬA LỖI PHÂN LOẠI SẢN PHẨM ====================
function setupCategoryFilter() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1;
      renderCurrentPage();
    });
  });
}

// ==================== XỬ LÝ ĐĂNG NHẬP ====================
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  
  // Ẩn loading
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
  
  if (!user) {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('logoutSidebar').classList.add('hidden');
    document.getElementById('adminSidebarBtn').classList.add('hidden');
    document.getElementById('balance').innerText = 'Số dư: 0đ';
    isAdmin = false;
    return;
  }
  
  // Đã đăng nhập
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('logoutSidebar').classList.remove('hidden');
  
  console.log('Đã đăng nhập:', user.email);
  await loadBalance();
  await checkAdmin(user.uid);
  document.getElementById('noidungNap').innerText = user.uid.slice(0, 12);
  showSection('productsSection');
  await loadProducts();
});

// ==================== LOAD SỐ DƯ ====================
async function loadBalance() {
  if (!currentUser) return;
  const snap = await db.collection('users').doc(currentUser.uid).get();
  const data = snap.data() || {balance: 0};
  document.getElementById('balance').innerText = `Số dư: ${data.balance.toLocaleString()}đ`;
}

// ==================== KIỂM TRA ADMIN ====================
async function checkAdmin(uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (snap.data()?.role === 'admin') {
    isAdmin = true;
    document.getElementById('adminSidebarBtn').classList.remove('hidden');
  }
}

// ==================== LOAD SẢN PHẨM ====================
async function loadProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '<p style="text-align:center; color:#aaa; grid-column:1/-1;">Đang tải sản phẩm...</p>';
  
  try {
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    allProducts = [];
    snap.forEach(doc => {
      const p = doc.data();
      p.id = doc.id;
      allProducts.push(p);
    });
    renderCurrentPage();
    setupPagination();
  } catch (err) {
    container.innerHTML = '<p style="color:#ff5555; text-align:center;">Lỗi tải sản phẩm!</p>';
  }
}

// ==================== RENDER SẢN PHẨM THEO TRANG VÀ DANH MỤC ====================
function renderCurrentPage() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  
  // Lọc sản phẩm theo danh mục
  const filteredProducts = allProducts.filter(p => {
    if (currentCategory === 'all') return true;
    if (Array.isArray(p.category)) {
      return p.category.includes(currentCategory);
    }
    return p.category === currentCategory;
  });
  
  const pageItems = filteredProducts
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    })
    .slice(start, end);
  
  if (filteredProducts.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#aaa; font-size:1.2em;">Không có sản phẩm nào trong danh mục này</p>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
    return renderCurrentPage();
  }
  
  if (pageItems.length === 0 && filteredProducts.length > 0) {
    currentPage = 1;
    return renderCurrentPage();
  }
  
  if (pageItems.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#aaa;">Không có sản phẩm nào</p>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  
  pageItems.forEach(p => {
    const div = document.createElement('div');
    div.className = 'card';
    
    // Danh mục
    let categoryBadges = '';
    if (p.category) {
      const cats = Array.isArray(p.category) ? p.category : [p.category];
      categoryBadges = cats.map(cat => `
        <span class="category-badge category-${cat}" style="margin-right:6px; font-size:0.85em; padding:4px 10px; border-radius:8px;">
          ${getCategoryName(cat)}
        </span>
      `).join('');
    }
    
    // Ảnh demo
    let imagesHTML = '';
    if (p.images && p.images.length > 0) {
      const displayImages = p.images.length > 6 ? p.images.slice(0, 6) : p.images;
      imagesHTML = `
        <div style="margin:15px 0; padding:0; background:rgba(255,255,255,0.05); border-radius:16px; overflow:hidden; border:2px solid rgba(0,255,255,0.3);">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; padding:12px;">
            ${displayImages.map((img, idx) => `
              <div style="position:relative; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,255,255,0.2); cursor:pointer; transition:all 0.4s;"
                   onmouseover="this.querySelector('img').style.transform='scale(1.08)'; this.querySelector('img').style.filter='brightness(1.15)';"
                   onmouseout="this.querySelector('img').style.transform='scale(1)'; this.querySelector('img').style.filter='brightness(1)';">
                <img src="${img}"
                     onclick="openLightbox(${JSON.stringify(p.images)}, ${idx})"
                     style="width:100%; height:220px; object-fit:cover; display:block; transition:all 0.4s;">
                <div style="position:absolute; bottom:12px; left:12px; color:#00ffff; font-weight:600;">
                  Xem lớn
                </div>
              </div>
            `).join('')}
          </div>
          ${p.images.length > 6 ? `
            <div style="text-align:center; padding:10px 0 15px;">
              <button onclick="openLightbox(${JSON.stringify(p.images)}, 0)"
                      style="background:transparent; color:#00ffff; border:2px solid #00ffff; padding:10px 28px; border-radius:50px; cursor:pointer; font-weight:600; transition:0.4s;"
                      onmouseover="this.style.background='#00ffff'; this.style.color='#000';"
                      onmouseout="this.style.background='transparent'; this.style.color='#00ffff';">
                Xem tất cả ${p.images.length} ảnh
              </button>
            </div>
          ` : ''}
        </div>`;
    } else {
      imagesHTML = '<div style="background:#222; height:240px; border-radius:16px; display:flex; align-items:center; justify-content:center; color:#666; margin:15px 0; font-size:1.1em;">Không có ảnh demo</div>';
    }
    
    const buyButton = p.stock > 0
      ? `<button class="btn btn-primary" onclick="buy('${p.id}', '${escapeHtml(p.name)}', ${p.price}, '${escapeHtml(p.downloadURL || '')}')">Mua ngay</button>`
      : `<button class="btn" disabled style="background:#555; opacity:0.7; cursor:not-allowed;">Hết hàng</button>`;
    
    div.innerHTML = `
      <h3>${escapeHtml(p.name)}</h3>
      ${p.pinned ? '<div style="color:#ff00ff; font-size:0.9em; margin:8px 0;"><i class="fas fa-thumbtack"></i> Sản phẩm được ghim</div>' : ''}
      <div style="margin:8px 0;">${categoryBadges}</div>
      ${imagesHTML}
      <p style="margin:12px 0; line-height:1.7; color:#ddd;">${escapeHtml(p.desc).replace(/\n/g, '<br>')}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:10px;">
        <div>
          <p style="margin:5px 0;"><strong>Giá:</strong> <span style="color:#00ffff; font-size:1.5em; font-weight:700;">${p.price.toLocaleString()}đ</span></p>
          <p style="margin:5px 0;"><strong>Còn lại:</strong> <span style="color:${p.stock > 0 ? '#0f0' : '#f55'}; font-weight:600;">${p.stock}</span></p>
        </div>
        ${buyButton}
      </div>
      ${isAdmin ? `
        <div style="margin-top:15px; padding-top:15px; border-top:1px dashed rgba(0,255,255,0.3);">
          <button class="btn btn-success" onclick="editProduct('${p.id}')">Sửa</button>
          <label style="margin-left:12px; color:#aaa;">
            <input type="checkbox" class="delCheck" value="${p.id}"> Xóa
          </label>
        </div>` : ''
      }
    `;
    
    container.appendChild(div);
  });
  
  setupPagination(filteredProducts.length);
  document.getElementById('pagination').style.display = 'flex';
}

// ==================== PHÂN TRANG ====================
function setupPagination(totalItems = allProducts.length) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = document.getElementById('pageNumbers');
  pageNumbers.innerHTML = '';
  
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, currentPage + 3);
  
  if (endPage - startPage < 6) {
    if (currentPage < 4) endPage = Math.min(totalPages, 7);
    if (currentPage > totalPages - 3) startPage = Math.max(1, totalPages - 6);
  }
  
  if (startPage > 1) {
    addPageBtn(1);
    if (startPage > 2) pageNumbers.innerHTML += '<span style="color:#888;">...</span>';
  }
  
  for (let i = startPage; i <= endPage; i++) {
    addPageBtn(i);
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageNumbers.innerHTML += '<span style="color:#888;">...</span>';
    addPageBtn(totalPages);
  }
  
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === totalPages;
  document.getElementById('gotoPage').value = currentPage;
  document.getElementById('gotoPage').max = totalPages;
  
  function addPageBtn(page) {
    const btn = document.createElement('div');
    btn.className = 'page-number';
    btn.textContent = page;
    if (page === currentPage) btn.classList.add('active');
    btn.onclick = () => changePage(page);
    pageNumbers.appendChild(btn);
  }
}

function changePage(page) {
  const filteredProducts = allProducts.filter(p =>
    currentCategory === 'all' || 
    (Array.isArray(p.category) ? p.category.includes(currentCategory) : p.category === currentCategory)
  );
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page < 1 || page > totalPages || page === currentPage) return;
  
  currentPage = page;
  renderCurrentPage();
  setupPagination(filteredProducts.length);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('prevBtn').onclick = () => changePage(currentPage - 1);
document.getElementById('nextBtn').onclick = () => changePage(currentPage + 1);

document.getElementById('gotoPage').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) changePage(val);
  }
});

document.getElementById('gotoPage').addEventListener('change', (e) => {
  let val = parseInt(e.target.value);
  if (!isNaN(val)) changePage(val);
});

// ==================== CHUYỂN ĐỔI TÊN DANH MỤC ====================
function getCategoryName(category) {
  const categories = {
    'premium': 'Trả phí',
    'free': 'Miễn phí',
    'love': 'Tình yêu',
    '3js': 'ThreeJS',
    'wed': 'Website'
  };
  return categories[category] || category;
}

// ==================== LIGHTBOX ====================
function openLightbox(images, startIndex = 0) {
  if (!images || images.length === 0) return;
  
  let idx = startIndex;
  const lightbox = document.createElement('div');
  lightbox.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;`;
  lightbox.innerHTML = `
    <div style="position:relative;max-width:90%;max-height:90%;">
      <img id="lbImg" src="${images[idx]}" style="max-width:100%;max-height:90vh;object-fit:contain;border-radius:12px;">
      <button onclick="this.closest('[style]').remove()" style="position:absolute;top:10px;right:10px;background:#ff3b30;color:#fff;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;z-index:10;">Đóng</button>
      ${images.length > 1 ? `
        <button onclick="changeLightboxImg(-1)" style="position:absolute;left:20px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:15px 10px;border:none;border-radius:8px;cursor:pointer;font-size:2em;">◄</button>
        <button onclick="changeLightboxImg(1)" style="position:absolute;right:20px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:15px 10px;border:none;border-radius:8px;cursor:pointer;font-size:2em;">►</button>
        <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,0.6);padding:5px 15px;border-radius:8px;">
          ${idx+1} / ${images.length}
        </div>` : ''}
    </div>`;
  
  document.body.appendChild(lightbox);
  
  window.changeLightboxImg = (dir) => {
    idx = (idx + dir + images.length) % images.length;
    document.getElementById('lbImg').src = images[idx];
    lightbox.querySelector('div:last-child').innerText = `${idx+1} / ${images.length}`;
  };
}

// ==================== SỬA & THÊM SẢN PHẨM ====================
window.editProduct = async (id) => {
  if (!isAdmin) return;
  
  const snap = await db.collection('products').doc(id).get();
  if (!snap.exists) return alert('Sản phẩm không tồn tại!');
  
  const p = snap.data();
  editingProductId = id;
  
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pDesc').value = p.desc || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pStock').value = p.stock || '';
  document.getElementById('pDownloadURL').value = p.downloadURL || '';
  document.getElementById('pImageLinks').value = p.images ? p.images.join('\n') : '';
  document.getElementById('pPinned').checked = !!p.pinned;
  
  // Danh mục
  if (Array.isArray(p.category)) {
    setSelectedCategories(p.category);
  } else if (p.category) {
    setSelectedCategories([p.category]);
  } else {
    setSelectedCategories(['premium']);
  }
  
  document.getElementById('addProductBtn').innerText = 'Cập nhật sản phẩm';
  document.getElementById('addProductBtn').onclick = updateProduct;
  showSection('adminPanel');
};

window.updateProduct = async () => { await saveProduct(true); };
window.addProduct = async () => { await saveProduct(false); };

async function saveProduct(isUpdate) {
  if (!isAdmin) return alert('Chỉ admin mới được thêm!');
  
  const name = document.getElementById('pName').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  const price = parseInt(document.getElementById('pPrice').value);
  const stock = parseInt(document.getElementById('pStock').value);
  const categories = getSelectedCategories();
  const downloadURL = document.getElementById('pDownloadURL').value.trim();
  const imageURLs = document.getElementById('pImageLinks').value.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  const pinned = document.getElementById('pPinned').checked;
  
  if (!name || !desc || isNaN(price) || isNaN(stock) || price < 0 || stock < 1 || !downloadURL || imageURLs.length === 0) {
    return alert('Phải nhập đầy đủ + ít nhất 1 link ảnh demo hợp lệ!');
  }
  if (categories.length === 0) return alert('Phải chọn ít nhất 1 danh mục!');
  
  const btn = document.getElementById('addProductBtn');
  const originalText = btn.innerText;
  btn.disabled = true;
  btn.innerText = isUpdate ? 'Đang cập nhật...' : 'Đang thêm...';
  
  try {
    const productData = {
      name, desc, price, stock,
      category: categories,
      downloadURL,
      images: imageURLs,
      pinned,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (isUpdate) {
      await db.collection('products').doc(editingProductId).update(productData);
      alert('Cập nhật thành công!');
    } else {
      await db.collection('products').add({
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Thêm sản phẩm thành công!');
    }
    
    // Reset form
    document.getElementById('pName').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pStock').value = '';
    document.getElementById('pDownloadURL').value = '';
    document.getElementById('pImageLinks').value = '';
    document.getElementById('pPinned').checked = false;
    setSelectedCategories(['premium']);
    
    btn.innerText = 'Thêm sản phẩm mới';
    btn.onclick = addProduct;
    editingProductId = null;
    loadProducts();
    showSection('productsSection');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = originalText;
  }
}

document.getElementById('addProductBtn').onclick = addProduct;

// Xóa nhiều
window.deleteSelected = async () => {
  if (!isAdmin || !confirm('Xóa thật hả đại ca?')) return;
  
  const checks = document.querySelectorAll('.delCheck:checked');
  if (checks.length === 0) return alert('Chọn ít nhất 1 sản phẩm');
  
  for (let c of checks) {
    await db.collection('products').doc(c.value).delete();
  }
  
  alert('Xóa thành công!');
  loadProducts();
};

// ==================== MUA HÀNG ====================
window.buy = async (productId, productName, price, downloadURL) => {
  if (!currentUser) return alert('Đăng nhập đi bro!');
  
  const userSnap = await db.collection('users').doc(currentUser.uid).get();
  const userData = userSnap.data();
  
  if (userData.balance < price) return alert(`Không đủ tiền! Cần ${price.toLocaleString()}đ`);
  
  const productSnap = await db.collection('products').doc(productId).get();
  const p = productSnap.data();
  
  if (p.stock < 1) return alert('Hết hàng rồi!');
  if (!confirm(`Mua "${productName}" với giá ${price.toLocaleString()}đ?`)) return;
  
  const key = 'KEY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  try {
    await db.runTransaction(async t => {
      t.update(db.collection('users').doc(currentUser.uid), { 
        balance: firebase.firestore.FieldValue.increment(-price) 
      });
      t.update(db.collection('products').doc(productId), { 
        stock: firebase.firestore.FieldValue.increment(-1) 
      });
      
      const historyRef = db.collection('history').doc();
      t.set(historyRef, {
        uid: currentUser.uid,
        productId,
        productName,
        price,
        key,
        downloadURL,
        time: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    alert(`Mua thành công!\nMã key: ${key}\nLink tải sẽ có trong lịch sử mua hàng`);
    
    // Gửi thông báo Telegram
    try {
      const telegramBotToken = '7571735453:AAG8gkZ5pFyt4mCc88RTQOKAq3MqDAURfSQ';
      const telegramChatId = '7389597494';
      const message = encodeURIComponent(
        `🛒 *CÓ ĐƠN MUA HÀNG MỚI!*\n\n` +
        `👤 Người mua: ${userData?.username || 'Chưa đặt tên'} (${currentUser.email})\n` +
        `🆔 UID: ${currentUser.uid}\n` +
        `📦 Sản phẩm: ${productName}\n` +
        `💰 Giá: ${price.toLocaleString()}đ\n` +
        `🔑 Key: ${key}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
        `💳 Số dư còn lại: ${(userData.balance - price).toLocaleString()}đ`
      );
      
      fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${message}&parse_mode=Markdown`)
        .catch(err => console.error('Lỗi gửi Telegram:', err));
    } catch (err) {
      console.error('Lỗi gửi thông báo Telegram:', err);
    }
    
    // Ghi log hoạt động
    await db.collection('userActivity').add({
      uid: currentUser.uid,
      type: 'purchase',
      details: { productName, price },
      time: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    loadBalance();
    loadProducts();
  } catch (e) {
    console.error('Lỗi mua hàng:', e);
    alert('Lỗi: ' + e.message);
  }
};

// ==================== LỊCH SỬ ====================
async function loadHistory() {
  if (!currentUser) return;
  
  const list = document.getElementById('historyList');
  list.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">Đang tải lịch sử...</p>';
  
  try {
    const snap = await db.collection('history')
      .where('uid', '==', currentUser.uid)
      .orderBy('time', 'desc')
      .get();
    
    if (snap.empty) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px 20px;font-size:15px;">Chưa mua gì cả 👀</p>';
      return;
    }
    
    list.innerHTML = '';
    
    snap.forEach(doc => {
      const h = doc.data();
      const date = h.time?.toDate();
      const timeStr = date ? date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Không rõ';
      
      const div = document.createElement('div');
      div.className = 'history-card';
      
      div.innerHTML = `
        <div class="history-header">
          <h4>${escapeHtml(h.productName || 'Sản phẩm')}</h4>
        </div>
        <div class="history-body">
          <p><strong>Mã key:</strong> <code class="key-code">${escapeHtml(h.key)}</code></p>
          <p><strong>Giá:</strong> <span class="price">${h.price.toLocaleString('vi-VN')}</span>đ</p>
          <p><strong>Thời gian:</strong> <span class="time">${timeStr}</span></p>
        </div>
        ${h.downloadURL ? `
          <div class="history-footer">
            <a href="${h.downloadURL}" target="_blank" class="btn-download">
              Tải source ngay
            </a>
          </div>
        ` : ''}
      `;
      
      list.appendChild(div);
    });
  } catch (error) {
    console.error('Lỗi tải lịch sử:', error);
    list.innerHTML = `<p style="text-align:center;color:#ff5555;padding:20px;">Lỗi tải lịch sử:<br><small>${error.message}</small></p>`;
  }
}

// ==================== NẠP TIỀN ====================
window.daNap = async () => {
  if (!currentUser) return alert('Đăng nhập đi bro!');
  
  const amount = parseInt(document.getElementById('amountNap').value);
  if (!amount || amount < 10000) return alert('Tối thiểu 10,000đ');
  
  try {
    await db.collection('pendingPayments').add({
      uid: currentUser.uid,
      amount,
      time: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    
    alert('Đã gửi yêu cầu nạp tiền! Admin sẽ duyệt sớm.');
    document.getElementById('amountNap').value = '';
  } catch (error) {
    alert('Lỗi gửi yêu cầu: ' + error.message);
  }
};

// ==================== ADMIN ====================
async function loadPendingPayments() {
  if (!isAdmin) return;
  
  const container = document.getElementById('pendingPayments');
  
  try {
    const snap = await db.collection('pendingPayments').where('status', '==', 'pending').get();
    
    if (snap.empty) {
      container.innerHTML = '<p style="color:#0f0;">Không có yêu cầu nào</p>';
      return;
    }
    
    container.innerHTML = '';
    
    snap.forEach(doc => {
      const p = doc.data();
      const div = document.createElement('div');
      div.className = 'card';
      
      div.innerHTML = `
        <p><strong>UID:</strong> ${p.uid}</p>
        <p><strong>Số tiền:</strong> ${p.amount.toLocaleString()}đ</p>
        <p><strong>Thời gian:</strong> ${p.time?.toDate().toLocaleString('vi-VN') || 'Chưa xác định'}</p>
        <button class="btn btn-success" onclick="approvePayment('${doc.id}', '${p.uid}', ${p.amount})">Duyệt</button>
        <button class="btn btn-danger" onclick="denyPayment('${doc.id}')">Từ chối</button>
      `;
      
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<p style="color:#ff5555;">Lỗi tải yêu cầu: ' + error.message + '</p>';
  }
}

window.approvePayment = async (id, uid, amount) => {
  if (!isAdmin) return;
  
  try {
    await db.runTransaction(async t => {
      t.update(db.collection('pendingPayments').doc(id), {status: 'approved'});
      t.update(db.collection('users').doc(uid), {balance: firebase.firestore.FieldValue.increment(amount)});
    });
    
    alert('Đã duyệt!');
    loadPendingPayments();
  } catch (error) {
    alert('Lỗi duyệt: ' + error.message);
  }
};

window.denyPayment = async (id) => {
  if (!isAdmin) return;
  
  try {
    await db.collection('pendingPayments').doc(id).update({status: 'denied'});
    alert('Đã từ chối');
    loadPendingPayments();
  } catch (error) {
    alert('Lỗi từ chối: ' + error.message);
  }
};

// ==================== QUẢN LÝ NGƯỜI DÙNG ====================
async function loadUsers() {
  if (!isAdmin) return;
  
  const container = document.getElementById('usersList');
  const search = document.getElementById('searchUser').value.toLowerCase().trim();
  
  container.innerHTML = '<p>Đang tải danh sách...</p>';
  
  try {
    const snap = await db.collection('users').get();
    let html = '';
    
    snap.forEach(doc => {
      const u = doc.data();
      const uid = doc.id;
      
      // Lọc tìm kiếm
      if (search &&
          !u.username?.toLowerCase().includes(search) &&
          !u.email?.toLowerCase().includes(search) &&
          !uid.toLowerCase().includes(search)) {
        return;
      }
      
      const isAdminUser = u.role === 'admin';
      
      html += `
        <div class="card" style="padding:18px 20px;margin:12px 0;position:relative;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;">
            <div style="flex:1;min-width:260px;">
              <h4 style="margin:0;color:#00ffff;font-size:1.3em;">${escapeHtml(u.username || 'Chưa đặt tên')}</h4>
              <p style="margin:5px 0 8px;color:#aaa;">
                <strong>Email:</strong> ${escapeHtml(u.email)}<br>
                <strong>UID:</strong> <code>${uid}</code>
              </p>
              <p style="margin:0;font-size:1.1em;">
                Số dư: <span style="color:#00ff88;font-weight:600;">${(u.balance || 0).toLocaleString()}đ</span> |
                Vai trò: <span style="color:${isAdminUser ? '#ff00ff' : '#00ff88'};font-weight:700;">${(u.role || 'user').toUpperCase()}</span>
              </p>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              ${!isAdminUser ? `
                <button class="btn btn-success" onclick="setRole('${uid}','admin')">
                  Thăng Admin
                </button>
              ` : `
                <button class="btn" style="background:#ff9500;color:#000;" onclick="setRole('${uid}','user')">
                  Hạ thành User
                </button>
              `}
              <button class="btn btn-danger" onclick="fineUser('${uid}','${escapeHtml((u.username || uid).replace(/'/g, "\\'"))}')">
                Phạt tiền
              </button>
              <button class="btn" style="background:#ff2d55;" onclick="deleteUser('${uid}','${escapeHtml((u.username || uid).replace(/'/g, "\\'"))}')">
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html || '<p style="text-align:center;color:#aaa;padding:40px;">Không tìm thấy người dùng nào</p>';
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p style="color:#ff5555;text-align:center;">Lỗi: ${e.message}</p>`;
  }
}

// Tìm kiếm realtime
document.getElementById('searchUser').addEventListener('input', loadUsers);

// Preview image links
document.getElementById('pImageLinks').addEventListener('input', function() {
  const preview = document.getElementById('linkPreview');
  const links = this.value.trim().split('\n').filter(l => l.startsWith('http'));
  
  if (links.length === 0) {
    preview.innerHTML = '<p style="color:#aaa;">Chưa có link ảnh hợp lệ</p>';
    return;
  }
  
  preview.innerHTML = `
    <p><strong>Preview (${links.length} ảnh):</strong></p>
    <div style="display:flex;gap:10px;overflow-x:auto;padding:10px 0;">
      ${links.map(link => `<img src="${link}" style="height:80px;border-radius:8px;object-fit:cover;">`).join('')}
    </div>
  `;
});

// Thăng / Hạ cấp Admin
window.setRole = async (uid, newRole) => {
  if (!isAdmin) return;
  if (!confirm(`Bạn chắc chắn muốn ${newRole === 'admin' ? 'THĂNG' : 'HẠ'} quyền này?`)) return;
  
  try {
    await db.collection('users').doc(uid).update({ role: newRole });
    alert(`${newRole === 'admin' ? 'Thăng' : 'Hạ'} cấp thành công!`);
    loadUsers();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
};

// Xóa tài khoản
window.deleteUser = async (uid, username) => {
  if (!isAdmin) return;
  if (!confirm(`XÓA HOÀN TOÀN tài khoản "${username}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!\nTất cả lịch sử mua hàng sẽ bị xóa!`)) return;
  
  const pass = prompt('Nhập mật khẩu admin để xác nhận xóa (bảo mật):');
  if (pass !== 'sangdev123') return alert('Sai mật khẩu admin!');
  
  try {
    // Xóa lịch sử mua
    const historySnap = await db.collection('history').where('uid', '==', uid).get();
    const batch = db.batch();
    historySnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    // Xóa yêu cầu nạp tiền
    const pendingSnap = await db.collection('pendingPayments').where('uid', '==', uid).get();
    const batch2 = db.batch();
    pendingSnap.forEach(doc => batch2.delete(doc.ref));
    await batch2.commit();
    
    // Xóa user
    await db.collection('users').doc(uid).delete();
    
    alert(`Đã xóa sạch tài khoản "${username}"!`);
    loadUsers();
  } catch (err) {
    alert('Lỗi xóa: ' + err.message);
  }
};

// Phạt tiền
window.fineUser = async (uid, username) => {
  if (!isAdmin) return;
  
  const amount = prompt(`Phạt bao nhiêu tiền từ "${username}"?\n(Ví dụ: 50000)`);
  if (!amount || isNaN(amount) || amount <= 0) return alert('Nhập số tiền hợp lệ!');
  
  const reason = prompt('Lý do phạt (bắt buộc):', 'Vi phạm nội quy shop');
  if (!reason) return alert('Phải ghi lý do!');
  
  if (!confirm(`Phạt ${parseInt(amount).toLocaleString()}đ từ "${username}"?\nLý do: ${reason}`)) return;
  
  try {
    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(uid);
      const userSnap = await t.get(userRef);
      const current = userSnap.data().balance || 0;
      
      if (current < amount) throw new Error('Không đủ tiền để phạt!');
      
      t.update(userRef, {
        balance: firebase.firestore.FieldValue.increment(-parseInt(amount))
      });
      
      // Ghi log phạt
      t.set(db.collection('history').doc(), {
        uid,
        productName: `[PHẠT TIỀN] ${reason}`,
        price: parseInt(amount),
        key: 'FINE',
        time: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    alert(`Đã phạt thành công ${amount.toLocaleString()}đ!`);
    loadUsers();
  } catch (err) {
    alert('Lỗi phạt: ' + err.message);
  }
};

// ==================== UI CONTROLS ====================
function showSection(sectionId) {
  // Ẩn tất cả section
  const sections = document.querySelectorAll('.section');
  sections.forEach(s => {
    s.classList.add('hidden');
  });
  
  // Hiện section được chọn
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
  }
  
  // Ẩn/hiện bộ lọc danh mục
  const categoryFilter = document.querySelector('.category-filter');
  if (sectionId === 'productsSection') {
    categoryFilter?.classList.remove('hidden');
  } else {
    categoryFilter?.classList.add('hidden');
  }
  
  // Load dữ liệu khi chuyển tab
  if (sectionId === 'historySection' && currentUser) loadHistory();
  if (sectionId === 'napSection' && currentUser) {
    document.getElementById('noidungNap').innerText = currentUser.uid.slice(0, 12);
  }
  if (sectionId === 'adminPanel' && isAdmin) {
    loadPendingPayments();
    loadUsers();
  }
  if (sectionId === 'newsSection') {
    loadTinTuc();
  }
  
  // Nếu chưa đăng nhập và không phải trang sản phẩm
  if (!currentUser && sectionId !== 'authSection' && sectionId !== 'productsSection') {
    alert('Vui lòng đăng nhập để sử dụng tính năng này!');
    showSection('authSection');
    return;
  }
}

// Toggle submenu
function toggleSubmenu(el) {
  el.classList.toggle('active');
  el.nextElementSibling?.classList.toggle('active');
}

// Mobile menu
document.getElementById('mobileMenuBtn').onclick = () => {
  document.getElementById('sidebar').classList.toggle('open');
};

// Đóng menu khi click ra ngoài
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('sidebar');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  
  if (window.innerWidth <= 992 && 
      sidebar.classList.contains('open') && 
      !sidebar.contains(e.target) && 
      !mobileBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// Modal báo cáo
document.getElementById('adminReportBtn')?.addEventListener('click', () => {
  document.getElementById('adminReportModal').classList.add('active');
});

document.querySelector('.close-modal')?.addEventListener('click', () => {
  document.getElementById('adminReportModal').classList.remove('active');
});

document.getElementById('adminReportModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('adminReportModal')) {
    e.target.classList.remove('active');
  }
});

// ==================== FIX SỐ DƯ ====================
(function() {
  // Tạo chỗ hiển thị số dư
  const header = document.querySelector('.sidebar-header p');
  if (header && !document.getElementById('autoBalance')) {
    const balanceP = document.createElement('p');
    balanceP.id = 'autoBalance';
    balanceP.style.cssText = 'margin:10px 0 0 !important;font-size:1.1em;color:#0f0;font-weight:600;text-align:center;';
    balanceP.innerHTML = '<i class="fas fa-wallet"></i> Số dư: <span id="balance" style="color:#00ffff;font-weight:700;">0đ</span>';
    header.parentNode.insertBefore(balanceP, header.nextSibling);
  }
  
  // Tự động cập nhật số dư
  setInterval(loadBalance, 8000);
})();

// ==================== XỬ LÝ PHÂN LOẠI NHIỀU DANH MỤC ====================
function getSelectedCategories() {
  const select = document.getElementById('pCategory');
  const selected = [];
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].selected) {
      selected.push(select.options[i].value);
    }
  }
  return selected;
}

function setSelectedCategories(categories) {
  const select = document.getElementById('pCategory');
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].selected = false;
  }
  
  if (categories && categories.length > 0) {
    for (let i = 0; i < select.options.length; i++) {
      if (categories.includes(select.options[i].value)) {
        select.options[i].selected = true;
      }
    }
  }
}

// ==================== TIN TỨC ====================
function loadTinTuc() {
  const list = document.getElementById('newsList');
  if (!list) return;
  
  db.collection("news")
    .orderBy("createdAt", "desc")
    .onSnapshot(snap => {
      if (snap.empty) {
        list.innerHTML = "<p style='text-align:center;color:#888;padding:30px;'>Chưa có thông báo nào</p>";
        return;
      }
      
      let html = "";
      snap.forEach(doc => {
        const n = doc.data();
        const time = n.createdAt ? n.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong';
        
        html += `
        <div class="news-card card" style="position:relative;overflow:hidden;margin:20px 0;padding:25px;border:2px solid ${n.pinned?'#ff00ff':'#00ffff'};border-radius:18px;">
          ${n.pinned ? '<div style="position:absolute;top:8px;right:-35px;background:#ff00ff;color:#fff;padding:8px 45px;transform:rotate(45deg);font-weight:bold;font-size:0.9em;">GHIM</div>' : ''}
          <h3 style="color:#00ffff;margin:0 0 10px;font-size:1.4em;">${escapeHtml(n.title || 'Thông báo từ Admin')}</h3>
          <p style="color:#ffeb3b;margin:8px 0;"><i class="fas fa-clock"></i> ${time}</p>
          <div style="margin-top:15px;line-height:1.8;font-size:1.05em;color:#ddd;">
            ${escapeHtml(n.content).replace(/\n/g, '<br>')}
          </div>
          ${n.images && n.images.length > 0 ? `
            <div style="margin-top:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
              ${n.images.map(img => `
                <img src="${img}" style="width:100%;border-radius:12px;border:2px solid #00ffff;box-shadow:0 0 20px rgba(0,255,255,0.3);cursor:pointer;" onclick="window.open(this.src)">
              `).join('')}
            </div>
          ` : ''}
        </div>`;
      });
      
      list.innerHTML = html;
    }, err => {
      console.error("Lỗi load tin tức:", err);
      list.innerHTML = "<p style='color:#f55;text-align:center;'>Lỗi tải tin tức!</p>";
    });
}

// ==================== CHATBOX ====================
(function initChatbox() {
  // Tạo HTML cho chatbox
  const chatHTML = `
    <!-- Nút mở chatbox -->
    <button id="chatToggleBtn" style="
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ffff, #ff00ff);
      border: 3px solid #fff;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 6px 25px rgba(0,255,255,0.6);
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <i class="fas fa-comments"></i>
      <span id="unreadBadge" style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff3b30;
        color: #fff;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        font-size: 12px;
        font-weight: bold;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
      ">0</span>
    </button>

    <!-- Cửa sổ chat -->
    <div id="chatWindow" style="
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 380px;
      height: 550px;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 3px solid #00ffff;
      border-radius: 20px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      box-shadow: 0 10px 50px rgba(0,255,255,0.4);
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #00ffff, #ff00ff);
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #fff;
      ">
        <div>
          <h3 style="margin: 0; color: #fff; font-size: 1.3em;">
            <i class="fas fa-users"></i> Cộng Đồng Chat
          </h3>
          <p id="onlineCount" style="margin: 5px 0 0; font-size: 0.85em; color: #ffffffe6;">
            0 người online
          </p>
        </div>
        <button id="closeChatBtn" style="
          background: rgba(255,255,255,0.3);
          border: none;
          color: #fff;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        ">×</button>
      </div>

      <!-- Danh sách tin nhắn -->
      <div id="chatMessages" style="
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: rgba(0,0,0,0.3);
        scrollbar-width: thin;
        scrollbar-color: #00ffff transparent;
      "></div>

      <!-- Khu vực nhập tin nhắn -->
      <div style="
        padding: 15px;
        background: rgba(0,0,0,0.4);
        border-top: 2px solid #00ffff;
      ">
        <!-- Preview ảnh -->
        <div id="imagePreview" style="display: none; margin-bottom: 10px; position: relative;">
          <img id="previewImg" style="max-width: 100%; max-height: 150px; border-radius: 12px; border: 2px solid #00ffff;">
          <button id="removeImageBtn" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff3b30;
            border: none;
            color: #fff;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-weight: bold;
          ">×</button>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="chatInput" placeholder="Nhập tin nhắn hoặc link ảnh..." style="
            flex: 1;
            padding: 12px 15px;
            border-radius: 25px;
            border: 2px solid #00ffff;
            background: rgba(255,255,255,0.1);
            color: #fff;
            font-size: 1em;
            outline: none;
          ">
          
          <!-- Nút chọn ảnh -->
          <label for="imageUpload" style="
            background: linear-gradient(135deg, #ff00ff, #ff0080);
            width: 45px;
            height: 45px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.3s;
          ">
            <i class="fas fa-image" style="color: #fff; font-size: 20px;"></i>
          </label>
          <input type="file" id="imageUpload" accept="image/*" style="display: none;">
          
          <!-- Nút gửi -->
          <button id="sendChatBtn" style="
            background: linear-gradient(135deg, #00ffff, #00ff88);
            border: none;
            color: #000;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            transition: 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', chatHTML);
  
  // Biến chat
  let chatOpen = false;
  let unreadCount = 0;
  let selectedImage = null;
  
  // Lấy các element
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatWindow = document.getElementById('chatWindow');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const unreadBadge = document.getElementById('unreadBadge');
  const onlineCount = document.getElementById('onlineCount');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImageBtn');
  
  // Mở/đóng chat
  chatToggleBtn.onclick = () => {
    if (!currentUser) {
      alert('Đăng nhập để chat với cộng đồng!');
      return;
    }
    chatOpen = !chatOpen;
    chatWindow.style.display = chatOpen ? 'flex' : 'none';
    if (chatOpen) {
      unreadCount = 0;
      updateUnreadBadge();
      chatInput.focus();
      scrollToBottom();
      updateOnlineStatus(true);
    } else {
      updateOnlineStatus(false);
    }
  };
  
  closeChatBtn.onclick = () => {
    chatOpen = false;
    chatWindow.style.display = 'none';
    updateOnlineStatus(false);
  };
  
  // Xử lý ảnh
  imageUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh tối đa 5MB!');
      imageUpload.value = '';
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file ảnh!');
      imageUpload.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      selectedImage = event.target.result;
      previewImg.src = selectedImage;
      imagePreview.style.display = 'block';
      chatInput.placeholder = 'Thêm mô tả cho ảnh...';
    };
    reader.readAsDataURL(file);
  };
  
  removeImageBtn.onclick = () => {
    selectedImage = null;
    imagePreview.style.display = 'none';
    imageUpload.value = '';
    chatInput.placeholder = 'Nhập tin nhắn hoặc link ảnh...';
  };
  
  // Bot commands
  const botCommands = {
    '/menu': {
      title: '📋 MENU LỆNH',
      content: `
        <div style="line-height: 2;">
          <strong style="color: #00ffff;">📌 Các lệnh có sẵn:</strong><br>
          <code>/menu</code> - Hiển thị menu này<br>
          <code>/mau</code> - Code mẫu C++<br>
          <code>/ham</code> - Công thức toán học<br>
          <code>/admin</code> - Thông tin admin<br>
          <br>
          <em style="color: #aaa;">Gõ lệnh vào ô chat để sử dụng! 🚀</em>
        </div>
      `
    },
    '/mau': {
      title: '💻 CODE MẪU C++',
      content: `
        <pre style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 12px; overflow-x: auto; font-size: 0.9em; line-height: 1.6;">
<span style="color: #ff79c6;">#include</span> <span style="color: #f1fa8c;">&lt;iostream&gt;</span>
<span style="color: #ff79c6;">using namespace</span> <span style="color: #8be9fd;">std</span>;
<span style="color: #8be9fd;">int</span> <span style="color: #50fa7b;">main</span>() {
    cout << <span style="color: #f1fa8c;">"Hello SANG DEV SHOP!"</span> << endl;
    <span style="color: #ff79c6;">return</span> <span style="color: #bd93f9;">0</span>;
}
        </pre>
      `
    },
    '/admin': {
      title: '👑 THÔNG TIN ADMIN',
      content: `
        <div style="text-align: center;">
          <h3 style="color: #ff00ff; margin: 10px 0;">SANG DEV</h3>
          <p style="color: #aaa; margin: 10px 0; line-height: 1.8;">
            🏪 Shop bán mã nguồn cao cấp<br>
            ✅ An toàn & Uy tín 100%<br>
            💯 Hỗ trợ 24/7
          </p>
        </div>
      `
    }
  };
  
  // Xử lý lệnh bot
  function handleBotCommand(text) {
    const command = text.toLowerCase().trim();
    return botCommands[command] || null;
  }
  
  // Gửi tin nhắn
  async function uploadImageToImgBB(base64Image) {
    const formData = new FormData();
    formData.append('image', base64Image.split(',')[1]);
    
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: 'POST', body: formData }
    );
    
    const data = await res.json();
    return data.success ? data.data.url : null;
  }
  
  async function sendMessage() {
    if (!currentUser) {
      alert('Bạn cần đăng nhập để chat!');
      return;
    }
    
    const text = chatInput.value.trim();
    if (!text && !selectedImage) return;
    
    // Kiểm tra lệnh bot
    if (!selectedImage && text.startsWith('/')) {
      const botResponse = handleBotCommand(text);
      if (botResponse) {
        showBotResponse(botResponse);
        chatInput.value = '';
        return;
      }
    }
    
    if (text.length > 500) {
      alert('Tin nhắn tối đa 500 ký tự!');
      return;
    }
    
    sendChatBtn.disabled = true;
    sendChatBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
      const userSnap = await db.collection('users').doc(currentUser.uid).get();
      const userData = userSnap.data();
      const username = userData?.username || currentUser.email?.split('@')[0] || 'User';
      
      const messageData = {
        uid: currentUser.uid,
        username: username,
        message: text || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date()
      };
      
      // Upload ảnh nếu có
      if (selectedImage) {
        const imageUrl = await uploadImageToImgBB(selectedImage);
        if (imageUrl) {
          messageData.image = imageUrl;
          messageData.hasImage = true;
        }
      }
      
      await db.collection('chatMessages').add(messageData);
      
      // Reset form
      chatInput.value = '';
      selectedImage = null;
      imagePreview.style.display = 'none';
      imageUpload.value = '';
      chatInput.placeholder = 'Nhập tin nhắn hoặc link ảnh...';
      
      scrollToBottom();
    } catch (err) {
      console.error('Lỗi gửi tin:', err);
      alert('Lỗi gửi tin nhắn: ' + err.message);
    } finally {
      sendChatBtn.disabled = false;
      sendChatBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
  }
  
  function showBotResponse(botData) {
    const botMsgHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-self: flex-start;
        margin: 15px 0;
        max-width: 90%;
      ">
        <span style="font-size: 0.85em; color: #ff00ff; margin-bottom: 6px; font-weight: 700;">
          🤖 SANG BOT
        </span>
        <div style="
          background: linear-gradient(135deg, rgba(255,0,255,0.2), rgba(0,255,255,0.2));
          padding: 18px;
          border-radius: 18px 18px 18px 4px;
          color: #fff;
          word-wrap: break-word;
          box-shadow: 0 6px 20px rgba(255,0,255,0.3);
          border: 2px solid rgba(255,0,255,0.5);
        ">
          <strong style="color: #ff00ff; font-size: 1.1em; display: block; margin-bottom: 10px;">
            ${botData.title}
          </strong>
          ${botData.content}
        </div>
      </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', botMsgHTML);
    scrollToBottom();
  }
  
  sendChatBtn.onclick = sendMessage;
  chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
  
  // Load tin nhắn
  function loadMessages() {
    db.collection('chatMessages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const messages = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          messages.unshift({ id: doc.id, ...data });
        });
        renderMessages(messages);
      });
  }
  
  function renderMessages(messages) {
    let html = '';
    let lastDate = '';
    
    messages.forEach(msg => {
      const date = msg.timestamp?.toDate ? msg.timestamp.toDate() : 
                   msg.createdAt?.toDate ? msg.createdAt.toDate() : 
                   (msg.createdAt ? new Date(msg.createdAt) : new Date());
      
      const dateStr = date.toLocaleDateString('vi-VN');
      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      
      if (dateStr !== lastDate) {
        html += `
          <div style="text-align: center; margin: 20px 0;">
            <span style="background: rgba(0,255,255,0.2); padding: 6px 15px; border-radius: 20px; font-size: 0.85em; color: #aaa;">
              ${dateStr}
            </span>
          </div>
        `;
        lastDate = dateStr;
      }
      
      const isMe = msg.uid === currentUser?.uid;
      
      html += `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: ${isMe ? 'flex-end' : 'flex-start'};
          margin: 10px 0;
        ">
          ${!isMe ? `
            <div style="font-size:12px; color:#00ffff; margin-left:8px;">
              ${escapeHtml(msg.username || 'User')}
            </div>
          ` : ''}
          
          <div style="
            max-width: 75%;
            background: ${isMe ? '#00ffd5' : '#2a2a2a'};
            color: ${isMe ? '#000' : '#fff'};
            padding: 10px 14px;
            border-radius: 16px;
            word-break: break-word;
          ">
            ${escapeHtml(msg.message || '')}
            
            ${msg.image ? `
              <div style="margin-top:8px;">
                <img src="${msg.image}" style="max-width:100%; border-radius:10px;">
              </div>
            ` : ''}
          </div>
          
          <div style="font-size:10px; color:#888; margin:4px 8px;">
            ${timeStr}
          </div>
        </div>
      `;
    });
    
    chatMessages.innerHTML = html || '<p style="text-align: center; color: #aaa; margin-top: 20px;">Chưa có tin nhắn nào. Hãy là người đầu tiên! 🎉</p>';
    scrollToBottom();
  }
  
  function updateUnreadBadge() {
    if (unreadCount > 0) {
      unreadBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      unreadBadge.style.display = 'flex';
    } else {
      unreadBadge.style.display = 'none';
    }
  }
  
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function updateOnlineStatus(isOnline) {
    if (!currentUser) return;
    
    const userStatusRef = db.collection('onlineUsers').doc(currentUser.uid);
    
    if (isOnline) {
      userStatusRef.set({
        username: currentUser.displayName || currentUser.email,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      userStatusRef.delete();
    }
  }
  
  // Đếm online
  db.collection('onlineUsers').onSnapshot(snapshot => {
    onlineCount.textContent = `${snapshot.size} người online`;
  });
  
  // Khởi động
  auth.onAuthStateChanged(user => {
    if (user) loadMessages();
  });
  
  // CSS cho scrollbar
  const chatStyles = document.createElement('style');
  chatStyles.textContent = `
    #chatMessages::-webkit-scrollbar {
      width: 8px;
    }
    #chatMessages::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.2);
      border-radius: 10px;
    }
    #chatMessages::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #00ffff, #ff00ff);
      border-radius: 10px;
    }
  `;
  document.head.appendChild(chatStyles);
})();

// ==================== HÀM HỖ TRỢ ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== XỬ LÝ MENU ====================
window.showProductsSection = () => showSection('productsSection');
window.showHistorySection = () => showSection('historySection');
window.showNapSection = () => showSection('napSection');
window.showNewsSection = () => showSection('newsSection');
window.showAdminPanel = () => showSection('adminPanel');
window.showContactAdmin = () => alert("📞 Liên hệ Admin: 0335764804 (Zalo)");

window.logout = function() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    auth.signOut().then(() => {
      alert('Đã đăng xuất thành công!');
      currentUser = null;
      isAdmin = false;
      showSection('authSection');
    }).catch(err => {
      alert('Lỗi đăng xuất: ' + err.message);
    });
  }
};

// Gắn sự kiện cho menu
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const icon = this.querySelector('i');
    if (!icon) return;
    
    const iconClass = icon.className;
    
    if (iconClass.includes('fa-home')) showProductsSection();
    else if (iconClass.includes('fa-history')) showHistorySection();
    else if (iconClass.includes('fa-wallet')) showNapSection();
    else if (iconClass.includes('fa-bullhorn')) showNewsSection();
    else if (iconClass.includes('fa-phone-alt')) toggleSubmenu(this);
    else if (iconClass.includes('fa-user-shield')) showAdminPanel();
    else if (iconClass.includes('fa-sign-out-alt')) logout();
    
    if (window.innerWidth <= 992) {
      document.getElementById('sidebar').classList.remove('open');
    }
  });
});

// ==================== CHẶN PHÍM VÀ CHUỘT PHẢI ====================
let locked = false;

function enterFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}

function showWarning() {
  if (locked) return;
  
  const beep = document.getElementById("warnSound");
  beep?.play();
  
  enterFullscreen();
  
  document.getElementById("blockOverlay").style.display = "block";
  document.getElementById("blockMessage").style.display = "block";
  
  locked = true;
  
  // Chặn các sự kiện
  const blockHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel'].forEach(event => {
    document.addEventListener(event, blockHandler, true);
  });
  
  document.body.style.cursor = "none";
  
  setTimeout(() => {
    locked = false;
    
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
    
    document.getElementById("blockOverlay").style.display = "none";
    document.getElementById("blockMessage").style.display = "none";
    beep?.pause();
    beep.currentTime = 0;
    
    ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel'].forEach(event => {
      document.removeEventListener(event, blockHandler, true);
    });
    
    document.body.style.cursor = "default";
  }, 10000);
}

// Chặn các phím cấm
document.addEventListener("keydown", function(e) {
  if (locked) return;
  
  const blocked = 
    e.key === "F12" ||
    e.key === "Escape" ||
    (e.ctrlKey && e.shiftKey && ["I","C","J"].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key.toLowerCase() === "u") ||
    (e.ctrlKey && e.key.toLowerCase() === "s") ||
    (e.ctrlKey && e.key.toLowerCase() === "p");
  
  if (blocked) {
    e.preventDefault();
    showWarning();
  }
});

// Chặn chuột phải
document.oncontextmenu = function(e) {
  e.preventDefault();
  if (!locked) showWarning();
  return false;
};
