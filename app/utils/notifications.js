import { API_BASE, getToken } from "./auth";

export const NOTIFICATIONS_UNREAD_CHANGED_EVENT =
  "notifications-unread-changed";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function notifyUnreadCountChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UNREAD_CHANGED_EVENT));
  }
}

async function parseResponse(response) {
  let json = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    json = await response.json();
  } else {
    const text = await response.text();
    if (text) {
      throw new Error(text);
    }
  }

  if (!response.ok) {
    const error = json?.error;
    if (typeof error === "string") {
      throw new Error(error);
    }

    if (Array.isArray(error) && error[0]?.message) {
      throw new Error(error[0].message);
    }

    if (response.status === 429) {
      throw new Error("Too many requests. Please wait and try again.");
    }

    throw new Error("Request failed");
  }

  return json;
}

export async function listNotifications({ page = 1, limit = 20 } = {}) {
  const response = await fetch(
    `${API_BASE}/notifications?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const json = await parseResponse(response);

  return {
    items: json.data || [],
    pagination: json.meta?.pagination || {
      page,
      limit,
      totalItems: 0,
      totalPages: 1,
    },
  };
}

export async function getUnreadNotificationCount() {
  const response = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(response);
  return json.data?.count || 0;
}

export async function markNotificationAsRead(uuid) {
  const response = await fetch(`${API_BASE}/notifications/${uuid}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(response);
  notifyUnreadCountChanged();
  return json.data;
}

export async function markAllNotificationsAsRead() {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(response);
  notifyUnreadCountChanged();
  return json.data?.updatedCount || 0;
}

export async function deleteNotificationByUuid(uuid) {
  const response = await fetch(`${API_BASE}/notifications/${uuid}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseResponse(response);
  notifyUnreadCountChanged();
}
