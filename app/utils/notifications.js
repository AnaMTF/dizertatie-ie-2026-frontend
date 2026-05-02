import { API_BASE, getToken } from "./auth";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const json = await response.json();

  if (!response.ok) {
    const error = json?.error;
    if (typeof error === "string") {
      throw new Error(error);
    }

    if (Array.isArray(error) && error[0]?.message) {
      throw new Error(error[0].message);
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
  return json.data;
}

export async function markAllNotificationsAsRead() {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(response);
  return json.data?.updatedCount || 0;
}

export async function deleteNotificationByUuid(uuid) {
  const response = await fetch(`${API_BASE}/notifications/${uuid}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseResponse(response);
}
