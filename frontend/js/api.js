/**
 * api.js — All backend fetch() calls for RationMate
 * Base URL is read from the module-level constant so it's easy to change.
 */

// When served from Express (same origin), use relative path.
// Falls back to localhost:5000 only when opening index.html as a file:// during dev.
const BASE_URL = window.location.hostname
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

/** Generic request helper
 * - Attaches Content-Type and any extra headers
 * - On 401 with `expired: true`, clears localStorage and fires 'session:expired'
 */
async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions
  });
  const data = await response.json();

  // Auto-handle expired sessions globally
  if (response.status === 401 && data.expired) {
    localStorage.removeItem('shopToken');
    localStorage.removeItem('shopData');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.dispatchEvent(new CustomEvent('session:expired'));
  }

  return data;
}

// ─── Shops ────────────────────────────────────────────────────────────────────

/**
 * Get all active shops (public).
 * @returns {Promise<{success: boolean, shops: Array}>}
 */
async function getShops() {
  return request('/shops');
}

/**
 * Get a single shop's details + inventory (public).
 * @param {string} shopId - e.g. "SHOP001"
 */
async function getShop(shopId) {
  return request(`/shops/${shopId}`);
}

/**
 * Shop owner login.
 * @param {string} shopId
 * @param {string} password
 */
async function shopLogin(shopId, password) {
  return request('/shops/login', {
    method: 'POST',
    body: JSON.stringify({ shopId, password })
  });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

/**
 * Update an existing product's stock (or create it if not found).
 * @param {string} shopId
 * @param {string} productName
 * @param {number} quantity
 * @param {string} token - Shop JWT
 */
async function updateInventory(shopId, productName, quantity, token) {
  return request(`/shops/${shopId}/inventory`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productName, quantity })
  });
}

/**
 * Add a new product to the shop's inventory.
 * @param {string} shopId
 * @param {string} productName
 * @param {number} quantity
 * @param {string} token - Shop JWT
 */
async function addInventoryItem(shopId, productName, quantity, token) {
  return request(`/shops/${shopId}/inventory`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productName, quantity })
  });
}

/**
 * Delete a product from the shop's inventory.
 * @param {string} shopId
 * @param {string} productName
 * @param {string} token - Shop JWT
 */
async function deleteInventoryItem(shopId, productName, token) {
  return request(`/shops/${shopId}/inventory/${encodeURIComponent(productName)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

// ─── OTP & Auth ───────────────────────────────────────────────────────────────

/**
 * Send OTP to phone number via Twilio (server-side).
 * @param {string} phoneNumber - 10-digit number
 */
async function sendOtp(phoneNumber) {
  return request('/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber })
  });
}

/**
 * Verify OTP and log the user in — returns JWT.
 * @param {string} phoneNumber
 * @param {string} otp
 */
async function verifyOtpAndLogin(phoneNumber, otp) {
  return request('/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp })
  });
}

// Export as a global API object (no module bundler needed)
window.API = {
  getShops,
  getShop,
  shopLogin,
  updateInventory,
  addInventoryItem,
  deleteInventoryItem,
  sendOtp,
  verifyOtpAndLogin
};
