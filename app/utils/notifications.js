import { API_BASE, getToken } from "./auth";

export const NOTIFICATIONS_UNREAD_CHANGED_EVENT =
  "notifications-unread-changed";
export const APP_DATA_REFRESH_EVENT = "app-data-refresh";

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
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (arguments[0]?.kind) {
    params.set("kind", arguments[0].kind);
  }

  const response = await fetch(
    `${API_BASE}/notifications?${params.toString()}`,
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

export async function listReminderNotifications({ page = 1, limit = 5 } = {}) {
  const result = await listNotifications({ page, limit, kind: "reminder" });

  return {
    items: result.items.map((item) => ({
      uuid: item.uuid,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      readAt: item.readAt,
      url: item.data?.url || "/notifications",
      reminderKind:
        item.data?.reminderKind ||
        (item.type === "follow_up_reminder" ? "follow_up" : "appointment"),
      targetDateTime: item.data?.targetDateTime || null,
      targetDate: item.data?.targetDate || null,
      specialty: item.data?.specialty || null,
      doctorName: item.data?.doctorName || null,
    })),
    pagination: result.pagination,
  };
}

export async function listFollowUpReminders() {
  const response = await fetch(`${API_BASE}/appointment/follow-up-reminders`, {
    headers: getAuthHeaders(),
  });

  const json = await parseResponse(response);
  const items = json.data || [];

  return items.map((item) => ({
    uuid: item.uuid,
    appointmentUuid: item.appointmentUuid,
    reminderType: item.reminderType,
    createdAt: item.createdAt,
    targetDate: item.targetDate,
    recommendation: item.recommendation || null,
    doctorName: item.doctorName || null,
    specialty: item.specialty || null,
    clinicName: item.clinicName || null,
    patientName: item.patientName || null,
    url: item.url || "/appointments",
  }));
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
