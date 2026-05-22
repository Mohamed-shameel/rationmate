/**
 * app.js — RationMate application logic
 * Depends on window.API (api.js must be loaded first)
 */

// ─── Application State ────────────────────────────────────────────────────────
const state = {
  currentPage: 'page1',
  selectedShopId: null,   // shopId string (e.g. "SHOP001") chosen on Page 2
  shopToken: null,        // JWT for shop owner
  shopData: null,         // shop object returned by login
  userToken: null,        // JWT for citizen user
  otpSent: false,
  productToDelete: null   // productName pending delete confirmation
};

// ─── Notification ─────────────────────────────────────────────────────────────
function showNotification(message, type = 'success') {
  const el = document.getElementById('notification');
  el.textContent = message;

  const styles = {
    success: { bg: '#53d22c', color: '#131712' },
    error:   { bg: '#ef4444', color: '#ffffff' },
    warning: { bg: '#f59e0b', color: '#ffffff' },
    info:    { bg: '#3b82f6', color: '#ffffff' }
  };
  const s = styles[type] || styles.success;
  el.style.background = s.bg;
  el.style.color = s.color;

  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ─── Session Expiry Handler ───────────────────────────────────────────────────
// Triggered by api.js whenever the server returns 401 { expired: true }
window.addEventListener('session:expired', () => {
  state.shopToken = null;
  state.shopData = null;
  state.selectedShopId = null;
  state.userToken = null;
  state.otpSent = false;
  showPage('page1');
  showNotification('Your session has expired. Please log in again.', 'warning');
});

// ─── Page Switching ───────────────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'fade-in'));
  const target = document.getElementById(pageId);
  target.classList.add('active', 'fade-in');
  state.currentPage = pageId;
  setTimeout(() => target.classList.remove('fade-in'), 350);
}

// ─── Loading helpers ──────────────────────────────────────────────────────────
function setLoading(btn, loading, defaultText) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = `<span class="truncate">${defaultText}</span>`;
  }
}

// ─── Shop List (Page 2) ───────────────────────────────────────────────────────
async function loadShopList() {
  const container = document.getElementById('shopList');
  container.innerHTML = `<div class="flex justify-center py-10"><span class="spinner"></span></div>`;

  try {
    const data = await API.getShops();
    if (!data.success || !data.shops.length) {
      container.innerHTML = `<p class="text-[#a5b6a0] px-4 py-6 text-center">No shops available at the moment.</p>`;
      return;
    }

    container.innerHTML = data.shops.map((shop, i) => `
      <div class="p-4 shop-item" data-shopid="${shop.shopId}">
        <div class="flex items-stretch justify-between gap-4 rounded-xl hover:bg-[#1f251d] p-4 transition-colors border border-transparent hover:border-[#2d372a]">
          <div class="flex flex-col gap-1 flex-[2_2_0px]">
            <p class="text-white text-base font-bold leading-tight">${shop.name}</p>
            <p class="text-[#a5b6a0] text-sm font-normal leading-normal">
              ${shop.address?.street || ''}, ${shop.address?.city || ''}
            </p>
            <p class="text-[#53d22c] text-xs font-medium mt-1">Shop ID: ${shop.shopId}</p>
          </div>
          <div class="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 bg-[#1f251d] flex items-center justify-center">
            <svg class="text-[#42513e] w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 36V18L24 6L42 18V36C42 37.1 41.1 38 40 38H30V28H18V38H8C6.9 38 6 37.1 6 36Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click listeners
    container.querySelectorAll('.shop-item').forEach(item => {
      item.addEventListener('click', () => {
        state.selectedShopId = item.dataset.shopid;
        document.getElementById('selectedShopName').textContent =
          item.querySelector('.font-bold').textContent;
        document.getElementById('shopPassword').value = '';
        document.getElementById('passwordModal').style.display = 'flex';
      });
    });

  } catch (err) {
    console.error('loadShopList error:', err);
    container.innerHTML = `<p class="text-red-400 px-4 py-6 text-center">Could not connect to server. Is the backend running?</p>`;
  }
}

// ─── User Shop Selector (Page 5.5) ────────────────────────────────────────────
async function loadUserShopList() {
  const container = document.getElementById('userShopList');
  container.innerHTML = `<div class="flex justify-center py-10"><span class="spinner"></span></div>`;

  try {
    const data = await API.getShops();
    if (!data.success || !data.shops.length) {
      container.innerHTML = `<p class="text-[#a5b6a0] px-4 py-6 text-center">No shops available.</p>`;
      return;
    }

    container.innerHTML = data.shops.map(shop => `
      <div class="p-3 cursor-pointer user-shop-item rounded-xl hover:bg-[#1f251d] transition-colors border border-transparent hover:border-[#2d372a] flex items-center gap-4"
           data-shopid="${shop.shopId}">
        <div class="w-10 h-10 rounded-full bg-[#1f251d] flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-[#53d22c]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        </div>
        <div>
          <p class="text-white text-sm font-bold">${shop.name}</p>
          <p class="text-[#a5b6a0] text-xs">${shop.address?.street || ''}, ${shop.address?.city || ''}</p>
        </div>
        <svg class="ml-auto text-[#42513e] w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    `).join('');

    container.querySelectorAll('.user-shop-item').forEach(item => {
      item.addEventListener('click', () => {
        loadUserInventory(item.dataset.shopid, item.querySelector('.font-bold').textContent);
      });
    });

  } catch (err) {
    container.innerHTML = `<p class="text-red-400 px-4 py-6 text-center">Could not load shops.</p>`;
  }
}

// ─── Inventory table helpers ──────────────────────────────────────────────────
function stockBadge(qty, unit) {
  if (qty <= 0)  return `<span class="stock-badge stock-empty">Out of stock</span>`;
  if (qty < 20)  return `<span class="stock-badge stock-low">${qty} ${unit} — Low</span>`;
  return `<span class="stock-badge stock-high">${qty} ${unit}</span>`;
}

function buildShopInventoryRow(item) {
  return `
    <tr class="border-t border-t-[#42513e]" data-product="${item.productName}">
      <td class="h-[72px] px-4 py-2 w-[250px] text-white text-sm font-medium leading-normal">${item.productName}</td>
      <td class="h-[72px] px-4 py-2 w-[160px] text-[#a5b6a0] text-sm leading-normal stock-value">${item.currentStock}</td>
      <td class="h-[72px] px-4 py-2 w-[180px]">
        <input type="number" class="update-input w-24 px-2 py-1 rounded-lg bg-[#1f251d] text-white border border-[#42513e] text-sm focus:border-[#53d22c] focus:outline-none" placeholder="New qty" min="0">
      </td>
      <td class="h-[72px] px-4 py-2 w-[160px]">
        <div class="flex gap-2">
          <button class="update-btn px-3 py-1 bg-[#53d22c] text-[#131712] rounded-lg text-xs font-bold hover:bg-[#45b82a] transition-colors">Update</button>
          <button class="delete-btn px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
        </div>
      </td>
    </tr>`;
}

function renderShopInventory(inventory) {
  const tbody = document.getElementById('productTableBody');
  if (!inventory || inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-[#a5b6a0] py-8">No products yet. Add your first product above.</td></tr>`;
    return;
  }
  tbody.innerHTML = inventory.map(buildShopInventoryRow).join('');
}

// ─── User inventory view ──────────────────────────────────────────────────────
async function loadUserInventory(shopId, shopName) {
  document.getElementById('userInventoryShopName').textContent = shopName || shopId;
  const tbody = document.getElementById('userInventoryTable');
  tbody.innerHTML = `<tr><td colspan="2" class="text-center py-10"><span class="spinner"></span></td></tr>`;
  showPage('page6');

  try {
    const data = await API.getShop(shopId);
    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-red-400 py-8">${data.message}</td></tr>`;
      return;
    }

    const inv = data.shop.inventory;
    if (!inv || inv.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-[#a5b6a0] py-8">No inventory data available for this shop.</td></tr>`;
      return;
    }

    tbody.innerHTML = inv.map(item => `
      <tr class="border-t border-t-[#42513e]">
        <td class="h-[72px] px-4 py-2 text-white text-sm font-normal">${item.productName}</td>
        <td class="h-[72px] px-4 py-2 text-sm font-normal">${stockBadge(item.currentStock, item.unit)}</td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-red-400 py-8">Failed to load inventory.</td></tr>`;
  }
}

// ─── Logout helpers ───────────────────────────────────────────────────────────
function logoutShop() {
  state.shopToken = null;
  state.shopData = null;
  state.selectedShopId = null;
  localStorage.removeItem('shopToken');
  localStorage.removeItem('shopData');
  showPage('page1');
  showNotification('Logged out successfully', 'info');
}

function logoutUser() {
  state.userToken = null;
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  showPage('page1');
  showNotification('Logged out successfully', 'info');
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function showDeleteConfirmation(productName) {
  state.productToDelete = productName;
  document.getElementById('deleteProductName').textContent = productName;
  document.getElementById('deleteConfirmModal').style.display = 'flex';
}
function hideDeleteConfirmation() {
  state.productToDelete = null;
  document.getElementById('deleteConfirmModal').style.display = 'none';
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Session Restoration ───────────────────────────────────────────────────
  // If a user or shop owner refreshed the page, restore their session.
  (function restoreSession() {
    const shopToken = localStorage.getItem('shopToken');
    const shopDataStr = localStorage.getItem('shopData');
    if (shopToken && shopDataStr) {
      try {
        const shopData = JSON.parse(shopDataStr);
        state.shopToken = shopToken;
        state.shopData = shopData;
        state.selectedShopId = shopData.shopId;
        document.getElementById('currentShopName').textContent = shopData.name;
        renderShopInventory(shopData.inventory);
        showPage('page3');
        // Refresh inventory from server in background
        API.getShop(shopData.shopId).then(data => {
          if (data.success) {
            renderShopInventory(data.shop.inventory);
            state.shopData.inventory = data.shop.inventory;
            localStorage.setItem('shopData', JSON.stringify(state.shopData));
          }
        }).catch(() => {});
        return; // skip further checks
      } catch (e) {
        localStorage.removeItem('shopToken');
        localStorage.removeItem('shopData');
      }
    }

    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      state.userToken = userToken;
      loadUserShopList();
      showPage('page5');
      return;
    }
  })();

  // ── Page 1: Welcome ──────────────────────────────────────────────────────
  document.getElementById('loginUser').addEventListener('click', () => showPage('page4'));

  document.getElementById('loginShopOwner').addEventListener('click', () => {
    showPage('page2');
    loadShopList();
  });

  // ── Page 2: Shop selection & password modal ───────────────────────────────
  document.getElementById('cancelPassword').addEventListener('click', () => {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('shopPassword').value = '';
  });

  document.getElementById('verifyPassword').addEventListener('click', async function () {
    const password = document.getElementById('shopPassword').value.trim();
    if (!password) {
      showNotification('Please enter the password', 'error');
      return;
    }

    setLoading(this, true, 'Login');
    try {
      const data = await API.shopLogin(state.selectedShopId, password);
      if (data.success) {
        state.shopToken = data.token;
        state.shopData = data.shop;
        localStorage.setItem('shopToken', data.token);
        localStorage.setItem('shopData', JSON.stringify(data.shop));

        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('shopPassword').value = '';
        document.getElementById('currentShopName').textContent = data.shop.name;
        renderShopInventory(data.shop.inventory);
        showNotification(`Welcome, ${data.shop.ownerName}!`);
        showPage('page3');
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      showNotification('Could not connect to server', 'error');
    } finally {
      setLoading(this, false, 'Login');
    }
  });

  // Close password modal on backdrop click / ESC
  document.getElementById('passwordModal').addEventListener('click', function (e) {
    if (e.target === this) {
      this.style.display = 'none';
      document.getElementById('shopPassword').value = '';
    }
  });

  // ── Page 3: Shop Inventory Management ────────────────────────────────────
  document.getElementById('logoutShopBtn').addEventListener('click', logoutShop);

  document.getElementById('addProduct').addEventListener('click', async function () {
    const productName = document.getElementById('newProductName').value.trim();
    const quantity    = document.getElementById('newProductQuantity').value.trim();

    if (!productName || !quantity || isNaN(quantity) || Number(quantity) < 0) {
      showNotification('Please enter a valid product name and quantity', 'error');
      return;
    }
    if (Number(quantity) > 10000) {
      showNotification('Quantity cannot exceed 10,000', 'warning');
      return;
    }

    setLoading(this, true, 'Add Product');
    try {
      const data = await API.addInventoryItem(
        state.shopData.shopId, productName, Number(quantity), state.shopToken
      );
      if (data.success) {
        renderShopInventory(data.inventory);
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductQuantity').value = '';
        showNotification(`${productName} added successfully!`);
      } else {
        showNotification(data.message || 'Failed to add product', 'error');
      }
    } catch (err) {
      showNotification('Server error. Please try again.', 'error');
    } finally {
      setLoading(this, false, 'Add Product');
    }
  });

  // Update and Delete buttons (event delegation)
  document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('update-btn')) {
      const row = e.target.closest('tr');
      const productName = row.dataset.product;
      const input = row.querySelector('.update-input');
      const qty = input.value.trim();

      if (!qty || isNaN(qty) || Number(qty) < 0) {
        showNotification('Enter a valid quantity (0 or more)', 'error');
        input.focus();
        return;
      }

      e.target.disabled = true;
      e.target.textContent = '...';
      try {
        const data = await API.updateInventory(
          state.shopData.shopId, productName, Number(qty), state.shopToken
        );
        if (data.success) {
          renderShopInventory(data.inventory);
          showNotification(`${productName} updated to ${qty}!`);
        } else {
          showNotification(data.message || 'Update failed', 'error');
        }
      } catch (err) {
        showNotification('Server error. Please try again.', 'error');
      }
    }

    if (e.target.classList.contains('delete-btn')) {
      const row = e.target.closest('tr');
      showDeleteConfirmation(row.dataset.product);
    }
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!state.productToDelete) return;
    const productName = state.productToDelete;
    hideDeleteConfirmation();

    try {
      const data = await API.deleteInventoryItem(
        state.shopData.shopId, productName, state.shopToken
      );
      if (data.success) {
        renderShopInventory(data.inventory);
        showNotification(`${productName} deleted`, 'info');
      } else {
        showNotification(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showNotification('Server error. Please try again.', 'error');
    }
  });

  document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirmation);

  document.getElementById('deleteConfirmModal').addEventListener('click', function (e) {
    if (e.target === this) hideDeleteConfirmation();
  });

  // ── Page 4: User login (OTP) ──────────────────────────────────────────────
  document.getElementById('backToHome').addEventListener('click', () => {
    showPage('page1');
    resetOtpForm();
  });

  document.getElementById('sendOtp').addEventListener('click', async function () {
    const phone = document.getElementById('phoneNumber').value.trim();
    if (!phone || !/^\d{10}$/.test(phone)) {
      showNotification('Enter a valid 10-digit phone number', 'error');
      return;
    }

    setLoading(this, true, 'Send OTP');
    try {
      const data = await API.sendOtp(phone);
      if (data.success) {
        state.otpSent = true;
        document.getElementById('otpInput').disabled = false;
        const verifyBtn = document.getElementById('verifyOtp');
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-[#2d372a]', 'text-white');
        verifyBtn.classList.add('bg-[#53d22c]', 'text-[#131712]');

        const msg = data.otp
          ? `OTP sent! (Dev mode — OTP: ${data.otp})`
          : 'OTP sent to your phone via SMS!';
        showNotification(msg);
      } else {
        showNotification(data.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showNotification('Could not connect to server', 'error');
    } finally {
      setLoading(this, false, 'Send OTP');
    }
  });

  document.getElementById('verifyOtp').addEventListener('click', async function () {
    const phone = document.getElementById('phoneNumber').value.trim();
    const otp   = document.getElementById('otpInput').value.trim();

    if (!state.otpSent || !otp) {
      showNotification('Please enter the OTP first', 'error');
      return;
    }

    setLoading(this, true, 'Verify OTP');
    try {
      const data = await API.verifyOtpAndLogin(phone, otp);
      if (data.success) {
        state.userToken = data.token;
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        resetOtpForm();
        showNotification('Login successful! Select your ration shop.');
        loadUserShopList();
        showPage('page5');
      } else {
        showNotification(data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      showNotification('Could not connect to server', 'error');
    } finally {
      setLoading(this, false, 'Verify OTP');
    }
  });

  // ── Page 5: User selects shop ─────────────────────────────────────────────
  document.getElementById('logoutUserBtn').addEventListener('click', logoutUser);

  // ── Page 6: User inventory view ───────────────────────────────────────────
  document.getElementById('backToShopSelectBtn').addEventListener('click', () => showPage('page5'));
  document.getElementById('logoutUserBtn2').addEventListener('click', logoutUser);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('passwordModal').style.display === 'flex') {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('shopPassword').value = '';
      }
      if (document.getElementById('deleteConfirmModal').style.display === 'flex') {
        hideDeleteConfirmation();
      }
    }
    if (e.key === 'Enter' && document.getElementById('passwordModal').style.display === 'flex') {
      document.getElementById('verifyPassword').click();
    }
  });

  // Enter key support for OTP flow
  document.addEventListener('keypress', e => {
    if (e.key === 'Enter' && state.currentPage === 'page4') {
      const active = document.activeElement;
      if (active.id === 'phoneNumber' && !state.otpSent) {
        document.getElementById('sendOtp').click();
      } else if (active.id === 'otpInput' && state.otpSent) {
        document.getElementById('verifyOtp').click();
      }
    }
  });

  // ── Input sanitization ────────────────────────────────────────────────────
  document.getElementById('phoneNumber').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });
  document.getElementById('otpInput').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
  });
  document.getElementById('newProductQuantity').addEventListener('input', function () {
    this.value = this.value.replace(/[^\d.]/g, '');
  });
});

// ─── Helper: reset OTP form ───────────────────────────────────────────────────
function resetOtpForm() {
  document.getElementById('phoneNumber').value = '';
  document.getElementById('otpInput').value = '';
  document.getElementById('otpInput').disabled = true;
  const verifyBtn = document.getElementById('verifyOtp');
  verifyBtn.disabled = true;
  verifyBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-[#2d372a]', 'text-white');
  verifyBtn.classList.remove('bg-[#53d22c]', 'text-[#131712]');
  state.otpSent = false;
}

console.log('✅ RationMate app.js loaded');
