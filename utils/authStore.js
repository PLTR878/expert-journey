export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getUserData(user, key, defaultValue) {
  const all = JSON.parse(localStorage.getItem("userData") || "{}");
  return all[user.email]?.[key] || defaultValue;
}

export function setUserData(user, key, value) {
  const all = JSON.parse(localStorage.getItem("userData") || "{}");
  if (!all[user.email]) all[user.email] = {};
  all[user.email][key] = value;
  localStorage.setItem("userData", JSON.stringify(all));
}
