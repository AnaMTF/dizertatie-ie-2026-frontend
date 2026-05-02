import { API_BASE, getToken } from "./auth";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function extractErrorMessage(error) {
  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error) && error[0]?.message) {
    return error[0].message;
  }

  if (error && typeof error === "object" && error.message) {
    return error.message;
  }

  return "Request failed";
}

function toSubscriptionPayload(subscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
    },
  };
}

async function getPushPublicKey() {
  const response = await fetch(`${API_BASE}/push/public-key`, {
    headers: getAuthHeaders(),
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(json?.error) || "Failed to fetch push public key",
    );
  }

  return json.data?.publicKey;
}

async function savePushSubscription(subscription) {
  const payload = toSubscriptionPayload(subscription);

  const response = await fetch(`${API_BASE}/push/subscriptions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(json?.error) || "Failed to save push subscription",
    );
  }
}

async function removePushSubscription(endpoint) {
  const response = await fetch(`${API_BASE}/push/subscriptions`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ endpoint }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(json?.error) || "Failed to remove push subscription",
    );
  }
}

export async function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function hasActivePushSubscription() {
  if (!(await isPushSupported())) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}

export async function enablePushNotifications() {
  if (!(await isPushSupported())) {
    throw new Error("Push notifications are not supported on this device");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Push notification permission was denied");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await getPushPublicKey();

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await savePushSubscription(subscription.toJSON());
}

export async function disablePushNotifications() {
  if (!(await isPushSupported())) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}
