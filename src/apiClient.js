const API_BASE = import.meta.env.VITE_API_BASE || "";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`API request failed: ${res.status} ${res.statusText} ${payload}`);
  }
  return res.status === 204 ? null : res.json();
}

export function getProducts() {
  return fetchJson("/api/products");
}

export function saveProducts(products) {
  return fetchJson("/api/products", {
    method: "PUT",
    body: JSON.stringify(products),
  });
}

export function getStockIn() {
  return fetchJson("/api/stock-in");
}

export function getStockOut() {
  return fetchJson("/api/stock-out");
}

export function saveStockIn(rows) {
  return fetchJson("/api/stock-in", {
    method: "PUT",
    body: JSON.stringify(rows),
  });
}

export function saveStockOut(rows) {
  return fetchJson("/api/stock-out", {
    method: "PUT",
    body: JSON.stringify(rows),
  });
}

export function getPurchaseOrders() {
  return fetchJson("/api/purchase-orders");
}

export function savePurchaseOrders(orders) {
  return fetchJson("/api/purchase-orders", {
    method: "PUT",
    body: JSON.stringify(orders),
  });
}

export function getEndingInventory() {
  return fetchJson("/api/ending-inventory");
}

export function saveEndingInventory(rows) {
  return fetchJson("/api/ending-inventory", {
    method: "PUT",
    body: JSON.stringify(rows),
  });
}

export function getAdvanceCustomerPo() {
  return fetchJson("/api/advance-customer-po");
}

export function saveAdvanceCustomerPo(orders) {
  return fetchJson("/api/advance-customer-po", {
    method: "PUT",
    body: JSON.stringify(orders),
  });
}

export function getBackload() {
  return fetchJson("/api/backload");
}

export function saveBackload(items) {
  return fetchJson("/api/backload", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export function getReturns() {
  return fetchJson("/api/returns");
}

export function saveReturns(returns) {
  return fetchJson("/api/returns", {
    method: "PUT",
    body: JSON.stringify(returns),
  });
}

export function healthCheck() {
  return fetchJson("/api/health");
}

// Auth
export function signupUser({ name, email, password }) {
  return fetchJson('/api/auth/signup-request', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function verifySignupOtp({ email, otp }) {
  return fetchJson('/api/auth/signup-verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export function forgotPasswordRequest({ email }) {
  return fetchJson('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyForgotPasswordOtp({ email, otp, password }) {
  return fetchJson('/api/auth/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password }),
  });
}

export function loginUser({ email, password }) {
  return fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Users resource
export function getUsers() { return fetchJson('/api/users'); }
export function createUser(u) { return fetchJson('/api/users', { method: 'POST', body: JSON.stringify(u) }); }
export function updateUser(id, patch) { return fetchJson(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); }
export function deleteUser(id) { return fetchJson(`/api/users/${id}`, { method: 'DELETE' }); }

// User roles resource
export function getUserRoles() { return fetchJson('/api/user-roles'); }
export function createUserRole(role) { return fetchJson('/api/user-roles', { method: 'POST', body: JSON.stringify(role) }); }
export function updateUserRole(id, role) { return fetchJson(`/api/user-roles/${id}`, { method: 'PUT', body: JSON.stringify(role) }); }
export function deleteUserRole(id) { return fetchJson(`/api/user-roles/${id}`, { method: 'DELETE' }); }

// Get current user profile
export function getCurrentUserProfile(email) { return fetchJson(`/api/auth/profile/${encodeURIComponent(email)}`); }
