export const THEME_CHANGED_EVENT = "theme-changed";
const THEME_STORAGE_KEY = "theme";

function notifyThemeChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
  }
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return theme === "light" || theme === "dark" ? theme : null;
}

export function resolveInitialTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function getActiveTheme() {
  return resolveInitialTheme();
}

export function setTheme(theme) {
  if (typeof window === "undefined") {
    return;
  }

  if (theme !== "light" && theme !== "dark") {
    return;
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  notifyThemeChanged();
}

export function toggleTheme() {
  const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  return nextTheme;
}
