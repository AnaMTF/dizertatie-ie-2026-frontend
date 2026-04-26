export const API_BASE = "http://localhost:9000/api/v1";
export const AUTH_CHANGED_EVENT = "auth-changed";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("token") || null;
}

export function setAuth({ user, token }) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
  notifyAuthChanged();
}

export function clearAuth() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  notifyAuthChanged();
}
