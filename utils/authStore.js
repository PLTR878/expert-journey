// utils/authStore.js
export const USERS_KEY = "mockUsers";
export const CURRENT_KEY = "mockUser";
export const PAID_KEY = "paid";

// ── Users list ─────────────────────────────────────────────
export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(email, password) {
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    throw new Error("EXISTS"); // ซ้ำ
  }
  users.push({ email, password, createdAt: Date.now() });
  saveUsers(users);
}

// ── Current session ────────────────────────────────────────
export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function signOut() {
  localStorage.removeItem(CURRENT_KEY); // ❗️อย่าลบ USERS_KEY
}

// ── Paid/VIP ───────────────────────────────────────────────
export function setPaidStatus(val) {
  localStorage.setItem(PAID_KEY, val ? "true" : "false");
}
export function getPaidStatus() {
  return localStorage.getItem(PAID_KEY) === "true";
}
