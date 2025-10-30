// utils/authStore.js
export const USERS_KEY = "mockUsers";
export const CURRENT_KEY = "mockUser";
export const PAID_KEY = "paid";

export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}
export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
export function addUser(email, password) {
  const users = getUsers();
  if (users.some(u => u.email === email)) throw new Error("EXISTS");
  users.push({ email, password, createdAt: Date.now() });
  saveUsers(users);
}
export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
}
export function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function signOut() {
  localStorage.removeItem(CURRENT_KEY);
}
export function setPaidStatus(val) {
  localStorage.setItem(PAID_KEY, val ? "true" : "false");
}
export function getPaidStatus() {
  return localStorage.getItem(PAID_KEY) === "true";
}

// 🧩 เก็บข้อมูลแยกตาม user
export function userKey(user, key) {
  if (!user || !user.email) return null;
  const safe = encodeURIComponent(user.email);
  return `${key}_${safe}`;
}
export function getUserData(user, key, fallback = []) {
  const k = userKey(user, key);
  if (!k) return fallback;
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
export function setUserData(user, key, value) {
  const k = userKey(user, key);
  if (k) localStorage.setItem(k, JSON.stringify(value));
}
