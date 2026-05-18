import { API_BASE, getToken, getUser } from "./auth";

function isFavoritesUser(user) {
  return user?.role === "patient" || user?.role === "doctor";
}

function getAuthHeaders() {
  const token = getToken();

  if (!token) {
    return null;
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function canManageFavorites() {
  return isFavoritesUser(getUser()) && Boolean(getToken());
}

export async function getFavoritePosts({ page = 1, limit = 10, slug } = {}) {
  const headers = getAuthHeaders();

  if (!headers || !isFavoritesUser(getUser())) {
    return { data: [], pagination: null, error: null };
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (slug) {
    params.set("slug", slug);
  }

  try {
    const res = await fetch(`${API_BASE}/blog/favorites?${params.toString()}`, {
      headers,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: [],
        pagination: null,
        error: json?.error || "Failed to load favorites.",
      };
    }

    return {
      data: Array.isArray(json?.data) ? json.data : [],
      pagination: json?.meta?.pagination || null,
      error: null,
    };
  } catch {
    return {
      data: [],
      pagination: null,
      error: "Failed to load favorites.",
    };
  }
}

export async function addFavoritePost(slug) {
  const headers = getAuthHeaders();

  if (!headers || !isFavoritesUser(getUser())) {
    return { error: "Authentication required" };
  }

  try {
    const res = await fetch(`${API_BASE}/blog/favorites`, {
      method: "POST",
      headers,
      body: JSON.stringify({ slug }),
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { error: json?.error || "Failed to add favorite." };
    }

    return { data: json?.data || null, error: null };
  } catch {
    return { error: "Failed to add favorite." };
  }
}

export async function removeFavoritePost(slug) {
  const headers = getAuthHeaders();

  if (!headers || !isFavoritesUser(getUser())) {
    return { error: "Authentication required" };
  }

  try {
    const res = await fetch(`${API_BASE}/blog/favorites`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ slug }),
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { error: json?.error || "Failed to remove favorite." };
    }

    return { error: null };
  } catch {
    return { error: "Failed to remove favorite." };
  }
}
