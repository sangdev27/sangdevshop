// Danh sách nhạc (thay bằng link thật của bạn)
const playlist = [
  "TikDown.com_TikTok_Media_002_0597ce2c603da8d81843864ee15722fd.mp3",
  "Tikviewer_NHC_LOFI_CHILL_D_NG_aveeplayermusicqdmusicqdmusic1_1763800893902.mp3",
  "TikDown.com_TikTok_Media_002_a36a703cbabc0874146559388b1ec2f7.mp3"
  // Thêm bao nhiêu bài tùy thích
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
  playBtn.textContent = "⏸";  // Đang phát → hiện nút pause
}

// Hàm cập nhật icon Play/Pause chính xác
function updatePlayPauseIcon() {
  if (audio.paused) {
    playBtn.textContent = "▶";
  } else {
    playBtn.textContent = "⏸";
  }
}

// Khởi động lần đầu
playTrack();

// Nút Play/Pause
playBtn.onclick = () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
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

// Cập nhật icon ngay cả khi người dùng tua, tạm dừng bằng phím cách, v.v.
audio.onplay = audio.onpause = updatePlayPauseIcon;
//scrip


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
let authInitialized = false;
// ==================== BIẾN PHÂN TRANG VÀ PHÂN LOẠI ====================
let allProducts = [];
let currentPage = 1;
let currentCategory = 'all'; // Biến quan trọng để theo dõi danh mục hiện tại
const itemsPerPage = 9;
// ==================== KHỞI TẠO BAN ĐẦU ====================
document.addEventListener('DOMContentLoaded', function() {
  showSection('productsSection');
  setupCategoryFilter(); // Gọi hàm thiết lập bộ lọc danh mục
  loadProducts();
});
// ==================== SỬA LỖI PHÂN LOẠI SẢN PHẨM ====================
function setupCategoryFilter() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Xóa active khỏi tất cả các nút
      categoryBtns.forEach(b => b.classList.remove('active'));
      // Thêm active vào nút được click
      btn.classList.add('active');
     
      const category = btn.dataset.category;
      currentCategory = category; // Cập nhật danh mục hiện tại
      currentPage = 1; // Reset về trang 1 khi chuyển danh mục
      renderCurrentPage(); // Render lại sản phẩm
    });
  });
}
// ==================== AUTH STATE CHANGED ====================
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  // Ẩn loading ngay lập tức
  document.getElementById('loading')?.classList.add('hidden');
  if (user) {
    // ĐÃ ĐĂNG NHẬP
    console.log('Đã đăng nhập:', user.email);
    // Ẩn form login, hiện các nút user
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('logoutSidebar').classList.remove('hidden');
    // Load dữ liệu user
    await loadBalance();
    await checkAdmin(user.uid);
    document.getElementById('noidungNap').innerText = user.uid.slice(0, 12);
    // Vào thẳng trang sản phẩm
    showSection('productsSection');
    await loadProducts();
  } else {
    // CHƯA ĐĂNG NHẬP HOẶC ĐĂNG XUẤT
    console.log('Chưa đăng nhập hoặc đã đăng xuất');
    // Reset giao diện
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('logoutSidebar').classList.add('hidden');
    document.getElementById('adminSidebarBtn').classList.add('hidden');
    document.getElementById('balance').innerText = 'Số dư: 0đ';
    document.getElementById('noidungNap').innerText = 'Chưa đăng nhập';
    isAdmin = false;
    // Hiện form login
    showSection('authSection');
    await loadProducts();
  }
 
  // Sau khi đăng nhập thành công → tự động chuyển sang trang sản phẩm
  if (user && document.getElementById('authSection')) {
    showSection('productsSection');
  }
});
// ==================== ĐĂNG NHẬP / ĐĂNG KÝ ====================
document.getElementById('switchAuth').onclick = (e) => {
  e.preventDefault();
  const isLogin = document.getElementById('authTitle').innerText === 'Đăng nhập';
  document.getElementById('authTitle').innerText = isLogin ? 'Đăng ký' : 'Đăng nhập';
  document.getElementById('authAction').innerText = isLogin ? 'Đăng ký' : 'Đăng nhập';
  document.getElementById('username').classList.toggle('hidden');
  const switchBtn = document.getElementById('switchAuth');
  switchBtn.innerText = isLogin
      ? 'Đã có tài khoản? Đăng nhập'
      : 'Chưa có tài khoản? Đăng ký ngay';
  // thêm class highlight khi đang ở chế độ login để hiện "Đăng ký ngay"
  switchBtn.classList.toggle('highlight', isLogin);
};
document.getElementById('authAction').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('pass').value;
  const username = document.getElementById('username').value.trim();
 
  if (!email || !pass) return alert('Nhập đầy đủ thông tin');
 
  try {
    if (document.getElementById('authTitle').innerText === 'Đăng nhập') {
      await auth.signInWithEmailAndPassword(email, pass);
    } else {
      if (!username) return alert('Nhập tên hiển thị');
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await db.collection('users').doc(cred.user.uid).set({
        username, email, balance: 0, role: 'user', createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    // Reset form
    document.getElementById('email').value = '';
    document.getElementById('pass').value = '';
    document.getElementById('username').value = '';
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
};
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
// ==================== RENDER SẢN PHẨM THEO TRANG VÀ DANH MỤC ====================
function renderCurrentPage() {
    const container = document.getElementById('products');
    container.innerHTML = '';
  
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
  
    // Lọc sản phẩm theo danh mục (hỗ trợ cả string và array)
    const filteredProducts = allProducts.filter(p => {
        if (currentCategory === 'all') return true;
       
        // Nếu category là mảng
        if (Array.isArray(p.category)) {
            return p.category.includes(currentCategory);
        }
        // Nếu là string
        return p.category === currentCategory;
    });
  
    const pageItems = filteredProducts
  .sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Cùng ghim hoặc cùng không ghim → mới nhất lên trước
    const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  })
  .slice(start, end);
  
    // Nếu không có sản phẩm nào trong danh mục hiện tại
    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#aaa; font-size:1.2em;">Không có sản phẩm nào trong danh mục này</p>';
        document.getElementById('pagination').style.display = 'none';
        return;
    }
  
    // Nếu trang hiện tại vượt quá số trang có sẵn → tự động về trang cuối
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
        // Xử lý hiển thị nhiều danh mục (badge)
        let categoryBadges = '';
        if (p.category) {
            const cats = Array.isArray(p.category) ? p.category : [p.category];
            categoryBadges = cats.map(cat => `
                <span class="category-badge category-${cat}" style="margin-right:6px; font-size:0.85em; padding:4px 10px; border-radius:8px;">
                    ${getCategoryName(cat)}
                </span>
            `).join('');
        }
        // Ảnh demo đẹp
        let imagesHTML = '';
        if (p.images && p.images.length > 0) {
            const displayImages = p.images.length > 6 ? p.images.slice(0, 6) : p.images;
            imagesHTML = `
                <div style="margin:15px 0; padding:0; background:rgba(255,255,255,0.05); border-radius:16px; overflow:hidden; border:2px solid rgba(0,255,255,0.3);">
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; padding:12px;">
                        ${displayImages.map((img, idx) => `
                            <div style="position:relative; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,255,255,0.2); cursor:pointer; transition:all 0.4s;"
                                 onmouseover="this.querySelector('img').style.transform='scale(1.08)'; this.querySelector('img').style.filter='brightness(1.15)'; this.querySelectorAll('div')[0].style.opacity='1'; this.querySelectorAll('div')[1].style.opacity='1'; this.querySelectorAll('div')[1].style.transform='translateY(0)';"
                                 onmouseout="this.querySelector('img').style.transform='scale(1)'; this.querySelector('img').style.filter='brightness(1)'; this.querySelectorAll('div')[0].style.opacity='0'; this.querySelectorAll('div')[1].style.opacity='0'; this.querySelectorAll('div')[1].style.transform='translateY(10px)';">
                                <img src="${img}"
                                     onclick="openLightbox(${JSON.stringify(p.images)}, ${idx})"
                                     style="width:100%; height:220px; object-fit:cover; display:block; transition:all 0.4s;">
                                <div style="position:absolute; inset:0; background:linear-gradient(transparent, rgba(0,0,0,0.7)); opacity:0; transition:opacity 0.4s;"></div>
                                <div style="position:absolute; bottom:12px; left:12px; color:#00ffff; font-weight:600; opacity:0; transition:all 0.4s; transform:translateY(10px);">
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
            ? `<button class="btn btn-primary" onclick="buy('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.downloadURL || ''}')">Mua ngay</button>`
            : `<button class="btn" disabled style="background:#555; opacity:0.7; cursor:not-allowed;">Hết hàng</button>`;
        div.innerHTML = `
            <h3>${p.name}</h3>
            ${p.pinned ? '<div style="color:#ff00ff; font-size:0.9em; margin:8px 0;"><i class="fas fa-thumbtack"></i> Sản phẩm được ghim</div>' : ''}
            <div style="margin:8px 0;">${categoryBadges}</div>
            ${imagesHTML}
            <p style="margin:12px 0; line-height:1.7; color:#ddd;">${p.desc.replace(/\n/g, '<br>')}</p>
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
    // Cập nhật phân trang theo kết quả lọc
    setupPagination(filteredProducts.length);
    document.getElementById('pagination').style.display = 'flex';
}
// ==================== PHÂN TRANG ====================
function setupPagination(totalItems = allProducts.length) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = document.getElementById('pageNumbers');
  pageNumbers.innerHTML = '';
  // Giới hạn hiển thị tối đa 7 số trang (đẹp mắt)
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, currentPage + 3);
  if (endPage - startPage < 6) {
    if (currentPage < 4) endPage = Math.min(totalPages, 7);
    if (currentPage > totalPages - 3) startPage = Math.max(1, totalPages - 6);
  }
  // Nút đầu
  if (startPage > 1) {
    addPageBtn(1);
    if (startPage > 2) pageNumbers.innerHTML += '<span style="color:#888;">...</span>';
  }
  for (let i = startPage; i <= endPage; i++) {
    addPageBtn(i);
  }
  // Nút cuối
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageNumbers.innerHTML += '<span style="color:#888;">...</span>';
    addPageBtn(totalPages);
  }
  // Cập nhật nút trước/sau
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === totalPages;
  // Cập nhật ô nhập trang
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
      currentCategory === 'all' || p.category === currentCategory
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
 
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  renderCurrentPage();
  setupPagination(filteredProducts.length);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
// Sự kiện nút Trước / Sau
document.getElementById('prevBtn').onclick = () => changePage(currentPage - 1);
document.getElementById('nextBtn').onclick = () => changePage(currentPage + 1);
// Nhập số trang + Enter
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
      <button onclick="changeImg(-1)" style="position:absolute;left:20px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:15px 10px;border:none;border-radius:8px;cursor:pointer;font-size:2em;">◄</button>
      <button onclick="changeImg(1)" style="position:absolute;right:20px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:15px 10px;border:none;border-radius:8px;cursor:pointer;font-size:2em;">►</button>
      <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,0.6);padding:5px 15px;border-radius:8px;">
        ${idx+1} / ${images.length}
      </div>` : ''}
    </div>`;
  document.body.appendChild(lightbox);
  window.changeImg = (dir) => {
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

  // Danh mục (hỗ trợ mảng)
  if (Array.isArray(p.category)) {
    setSelectedCategories(p.category);
  } else if (p.category) {
    setSelectedCategories([p.category]);
  } else {
    setSelectedCategories(['premium']);
  }

  // Ghim
  document.getElementById('pPinned').checked = !!p.pinned;

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
  const category = document.getElementById('pCategory').value;
  const downloadURL = document.getElementById('pDownloadURL').value.trim();
  const imageURLs = document.getElementById('pImageLinks').value.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  if (!name || !desc || isNaN(price) || isNaN(stock) || price < 0 || stock < 1 || !downloadURL || imageURLs.length === 0) {
    return alert('Phải nhập đầy đủ + ít nhất 1 link ảnh demo hợp lệ!');
  }
  const btn = document.getElementById('addProductBtn');
  btn.disabled = true;
  btn.innerText = isUpdate ? 'Đang cập nhật...' : 'Đang thêm...';
  try {
    if (isUpdate) {
      await db.collection('products').doc(editingProductId).update({
        name, desc, price, stock, category, downloadURL, images: imageURLs
      });
      alert('Cập nhật thành công!');
    } else {
      await db.collection('products').add({
        name, desc, price, stock, category, downloadURL, images: imageURLs,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Thêm sản phẩm thành công!');
    }
    // Reset form
    document.getElementById('pName').value = document.getElementById('pDesc').value = document.getElementById('pPrice').value = document.getElementById('pStock').value = document.getElementById('pDownloadURL').value = '';
    document.getElementById('pImageLinks').value = '';
    btn.innerText = 'Thêm sản phẩm mới';
    btn.onclick = addProduct;
    editingProductId = null;
    loadProducts();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}
document.getElementById('addProductBtn').onclick = addProduct;
// Xóa nhiều
window.deleteSelected = async () => {
  if (!isAdmin || !confirm('Xóa thật hả đại ca?')) return;
  const checks = document.querySelectorAll('.delCheck:checked');
  if (checks.length === 0) return alert('Chọn ít nhất 1 sản phẩm');
  for (let c of checks) await db.collection('products').doc(c.value).delete();
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
      t.update(db.collection('users').doc(currentUser.uid), { balance: firebase.firestore.FieldValue.increment(-price) });
      t.update(db.collection('products').doc(productId), { stock: firebase.firestore.FieldValue.increment(-1) });
     
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

    list.innerHTML = ''; // Xóa loading

    snap.forEach(doc => {
      const h = doc.data();

      const div = document.createElement('div');
      div.className = 'history-card'; // Đổi class cho dễ style riêng

      // Format ngày giờ đẹp hơn
      const date = h.time?.toDate();
      const timeStr = date ? date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Không rõ';

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

// Hàm escape HTML đơn giản để tránh XSS (nên có)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// ==================== NẠP TIỀN & ADMIN ====================
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
function showSection(sectionId) {
  // Ẩn tất cả section TRỪ form đăng nhập (nếu chưa đăng nhập)
  const sections = document.querySelectorAll('.section');
  sections.forEach(s => {
    if (s.id === 'authSection' && !currentUser) {
      // Nếu chưa đăng nhập → giữ nguyên form login, không ẩn nó
      s.classList.remove('hidden');
    } else {
      s.classList.add('hidden');
    }
  });
  // Hiện section được chọn
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');
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
  // QUAN TRỌNG NHẤT: Nếu chưa đăng nhập và không phải đang ở trang auth → tự động quay về trang đăng nhập
  if (!currentUser && sectionId !== 'authSection' && sectionId !== 'productsSection') {
    alert('Vui lòng đăng nhập để sử dụng tính năng này!');
    showSection('authSection');
    return;
  }
}
// ==================== QUẢN LÝ NGƯỜI DÙNG ====================
async function loadUsers() {
  if (!isAdmin) return alert('Chỉ admin mới được dùng!');
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
              <h4 style="margin:0;color:#00ffff;font-size:1.3em;">${u.username || 'Chưa đặt tên'}</h4>
              <p style="margin:5px 0 8px;color:#aaa;">
                <strong>Email:</strong> ${u.email}<br>
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
              <button class="btn btn-danger" onclick="fineUser('${uid}','${(u.username || uid).replace(/'/g, "\\'")}')">
                Phạt tiền
              </button>
              <button class="btn" style="background:#ff2d55;" onclick="deleteUser('${uid}','${(u.username || uid).replace(/'/g, "\\'")}')">
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
document.getElementById('searchUser').addEventListener('input', () => {
  loadUsers();
});
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
// Xóa tài khoản vĩnh viễn
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
// Toggle submenu
function toggleSubmenu(el) {
  el.classList.toggle('active');
  el.nextElementSibling.classList.toggle('active');
}
// Mobile menu
document.getElementById('mobileMenuBtn').onclick = () => {
  document.getElementById('sidebar').classList.toggle('open');
}
// Modal báo cáo
document.getElementById('adminReportBtn').onclick = () => {
  document.getElementById('adminReportModal').classList.add('active');
}
document.querySelector('.close-modal').onclick = () => {
  document.getElementById('adminReportModal').classList.remove('active');
}
document.getElementById('adminReportModal').onclick = (e) => {
  if (e.target === document.getElementById('adminReportModal')) {
    e.target.classList.remove('active');
  }
}
// Easter egg: click avatar 10 lần
let clickCount = 0;
document.getElementById('adminAvatar').onclick = () => {
  if (++clickCount === 10) {
    window.open('pass.html', '_blank');
  }
}
// ==================== FIX SỐ DƯ 100% - KHÔNG CẦN SỬA HTML NỮA ====================
(function() {
  // Tạo chỗ hiển thị số dư ngay dưới dòng "Shop Mã Nguồn Private" (tự động tìm đúng vị trí)
  const header = document.querySelector('.sidebar-header p');
  if (header && !document.getElementById('autoBalance')) {
    const balanceP = document.createElement('p');
    balanceP.id = 'autoBalance';
    balanceP.style.cssText = 'margin:10px 0 0 !important;font-size:1.1em;color:#0f0;font-weight:600;text-align:center;';
    balanceP.innerHTML = '<i class="fas fa-wallet"></i> Số dư: <span id="balance" style="color:#00ffff;font-weight:700;">0đ</span>';
    header.parentNode.insertBefore(balanceP, header.nextSibling);
  }
  // Hàm cập nhật số dư (dùng lại cái có sẵn của bạn)
  window.updateBalance = async function() {
    if (!currentUser) {
      const el = document.getElementById('balance');
      if (el) el.textContent = 'Chưa đăng nhập';
      return;
    }
    try {
      const snap = await db.collection('users').doc(currentUser.uid).get();
      const bal = (snap.data()?.balance || 0).toLocaleString();
      const el = document.getElementById('balance');
      if (el) el.innerHTML = `<strong>${bal}đ</strong>`;
    } catch(e) { console.log(e); }
  };
  // Tự động chạy khi đăng nhập + mỗi 8 giây
  auth.onAuthStateChanged(user => { currentUser = user; updateBalance(); });
  setInterval(updateBalance, 8000);
 
  // Gọi ngay lần đầu
  setTimeout(updateBalance, 1000);
})();
// ==================== XỬ LÝ PHÂN LOẠI NHIỀU DANH MỤC ====================
// Hàm lấy danh mục đã chọn (nhiều)
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
// Hàm thiết lập danh mục đã chọn (khi sửa sản phẩm)
function setSelectedCategories(categories) {
  const select = document.getElementById('pCategory');
  // Reset tất cả selection
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].selected = false;
  }
 
  // Chọn các danh mục từ mảng
  if (categories && categories.length > 0) {
    for (let i = 0; i < select.options.length; i++) {
      if (categories.includes(select.options[i].value)) {
        select.options[i].selected = true;
      }
    }
  }
}
// Sửa hàm editProduct để hỗ trợ nhiều danh mục
window.editProduct = async (id) => {
  if (!isAdmin) return;
  const snap = await db.collection('products').doc(id).get();
  if (!snap.exists) return alert('Sản phẩm không tồn tại!');
  const p = snap.data();
  editingProductId = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pDesc').value = p.desc;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pDownloadURL').value = p.downloadURL || '';
 
  // SỬA DÒNG NÀY - hỗ trợ cả string và array
  if (Array.isArray(p.category)) {
    setSelectedCategories(p.category);
  } else {
    setSelectedCategories(p.category ? [p.category] : ['premium']);
  }
 
  document.getElementById('pImageLinks').value = p.images ? p.images.join('\n') : '';
  document.getElementById('addProductBtn').innerText = 'Cập nhật sản phẩm';
  document.getElementById('addProductBtn').onclick = updateProduct;
  showSection('adminPanel');
};
// Sửa hàm saveProduct để lưu nhiều danh mục
async function saveProduct(isUpdate) {
  if (!isAdmin) return alert('Chỉ admin mới được thêm!');

  const name = document.getElementById('pName').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  const price = parseInt(document.getElementById('pPrice').value);
  const stock = parseInt(document.getElementById('pStock').value);
  const categories = getSelectedCategories();
  const downloadURL = document.getElementById('pDownloadURL').value.trim();
  const imageURLs = document.getElementById('pImageLinks').value.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  const pinned = document.getElementById('pPinned').checked; // THÊM DÒNG NÀY

  if (!name || !desc || isNaN(price) || isNaN(stock) || price < 0 || stock < 1 || !downloadURL || imageURLs.length === 0) {
    return alert('Phải nhập đầy đủ + ít nhất 1 link ảnh demo hợp lệ!');
  }
  if (categories.length === 0) return alert('Phải chọn ít nhất 1 danh mục!');

  const btn = document.getElementById('addProductBtn');
  btn.disabled = true;
  btn.innerText = isUpdate ? 'Đang cập nhật...' : 'Đang thêm...';

  try {
    const productData = {
      name, desc, price, stock,
      category: categories,
      downloadURL,
      images: imageURLs,
      pinned: pinned, // LƯU TRẠNG THÁI GHIM
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
    document.getElementById('pName').value = document.getElementById('pDesc').value = 
    document.getElementById('pPrice').value = document.getElementById('pStock').value = 
    document.getElementById('pDownloadURL').value = document.getElementById('pImageLinks').value = '';
    document.getElementById('pPinned').checked = false;
    setSelectedCategories(['premium']);
    
    btn.innerText = 'Thêm sản phẩm mới';
    btn.onclick = addProduct;
    editingProductId = null;
    loadProducts();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}
// ĐÓNG MENU MOBILE KHI BẤM RA NGOÀI – 100% KHÔNG LỖI TÍNH NĂNG KHÁC
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('sidebar');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const isMobile = window.innerWidth <= 992;

  if (isMobile && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
}, { passive: true });

let locked = false;
let blockAllHandler;  // để sau này remove đúng handler

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
    beep.play();

    // Bật fullscreen ngay lập tức
    enterFullscreen();

    // Hiển thị cảnh báo
    document.getElementById("blockOverlay").style.display = "block";
    document.getElementById("blockMessage").style.display = "block";

    locked = true;

    // === HÀM CHẶN HOÀN TOÀN TẤT CẢ (kể cả ESC) ===
    blockAllHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();   // cực mạnh
        return false;
    };

    // Chặn MỌI phím (bao gồm cả ESC, F11, Alt+F4, Ctrl+W, v.v.)
    document.addEventListener("keydown", blockAllHandler, true);
    document.addEventListener("keyup", blockAllHandler, true);
    document.addEventListener("keypress", blockAllHandler, true);

    // Chặn MỌI hành động chuột
    document.addEventListener("mousedown", blockAllHandler, true);
    document.addEventListener("mouseup", blockAllHandler, true);
    document.addEventListener("click", blockAllHandler, true);
    document.addEventListener("dblclick", blockAllHandler, true);
    document.addEventListener("contextmenu", blockAllHandler, true);
    document.addEventListener("wheel", blockAllHandler, true);
    document.addEventListener("mousemove", blockAllHandler, true);

    // Ẩn con trỏ chuột hoàn toàn
    document.body.style.cursor = "none";

    // === SAU 10 GIÂY TỰ ĐỘNG MỞ KHÓA ===
    setTimeout(() => {
        locked = false;

        // Thoát fullscreen (nếu vẫn còn)
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();

        // Tắt cảnh báo + âm thanh
        document.getElementById("blockOverlay").style.display = "none";
        document.getElementById("blockMessage").style.display = "none";
        beep.pause();
        beep.currentTime = 0;

        // Bỏ toàn bộ chặn
        document.removeEventListener("keydown", blockAllHandler, true);
        document.removeEventListener("keyup", blockAllHandler, true);
        document.removeEventListener("keypress", blockAllHandler, true);
        document.removeEventListener("mousedown", blockAllHandler, true);
        document.removeEventListener("mouseup", blockAllHandler, true);
        document.removeEventListener("click", blockAllHandler, true);
        document.removeEventListener("dblclick", blockAllHandler, true);
        document.removeEventListener("contextmenu", blockAllHandler, true);
        document.removeEventListener("wheel", blockAllHandler, true);
        document.removeEventListener("mousemove", blockAllHandler, true);

        // Hiện lại con trỏ
        document.body.style.cursor = "default";
    }, 10000); // 10 giây bị "treo máy"
}

// === CHẶN CÁC PHÍM CẤM (F12, Ctrl+U, Ctrl+Shift+I, chuột phải, v.v.) ===
document.addEventListener("keydown", function(e) {
    if (locked) return;

    const blocked = 
        e.key === "F12" ||
        e.key === "Escape" ||                    // phòng trường hợp ai đó bấm ESC ngoài lúc bị phạt
        (e.ctrlKey && e.shiftKey && ["I","C","J"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toLowerCase() === "u") ||
        (e.ctrlKey && e.key.toLowerCase() === "s") ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.key === "5") ||
        (e.ctrlKey && e.key.toLowerCase() === "w") ||     // Ctrl+W
        (e.ctrlKey && e.key.toLowerCase() === "q");       // Ctrl+Q

    if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showWarning();
    }
});

// Chặn chuột phải
document.oncontextmenu = function(e) {
    e.preventDefault();
    if (!locked) showWarning();
    return false;
};
