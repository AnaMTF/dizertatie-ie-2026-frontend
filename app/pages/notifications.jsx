import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBellSlash,
  FaCheck,
  FaCheckDouble,
  FaTrash,
} from "react-icons/fa";
import { redirect, useNavigate } from "react-router";
import { getToken, getUser } from "../utils/auth";
import {
  deleteNotificationByUuid,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../utils/notifications";
import {
  disablePushNotifications,
  enablePushNotifications,
  hasActivePushSubscription,
  isPushSupported,
} from "../utils/push";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "patient") return redirect("/");
  return null;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong";
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isPushAvailable, setIsPushAvailable] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items],
  );

  const loadNotifications = useCallback(
    async (page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) => {
      setLoading(true);
      setError("");

      try {
        const result = await listNotifications({ page, limit });
        setItems(result.items);
        setPagination((current) => ({
          ...current,
          ...result.pagination,
        }));
      } catch (requestError) {
        setError(extractErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadNotifications(DEFAULT_PAGE);
  }, [loadNotifications]);

  useEffect(() => {
    async function loadPushState() {
      const supported = await isPushSupported();
      setIsPushAvailable(supported);

      if (!supported) {
        return;
      }

      const active = await hasActivePushSubscription();
      setIsPushEnabled(active);
    }

    loadPushState();
  }, []);

  async function handleEnablePush() {
    setIsPushLoading(true);
    setError("");

    try {
      await enablePushNotifications();
      setIsPushEnabled(true);
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    } finally {
      setIsPushLoading(false);
    }
  }

  async function handleDisablePush() {
    setIsPushLoading(true);
    setError("");

    try {
      await disablePushNotifications();
      setIsPushEnabled(false);
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    } finally {
      setIsPushLoading(false);
    }
  }

  async function handleMarkAsRead(notification) {
    setError("");

    try {
      await markNotificationAsRead(notification.uuid);
      setItems((current) =>
        current.map((item) =>
          item.uuid === notification.uuid
            ? {
                ...item,
                readAt: item.readAt || new Date().toISOString(),
              }
            : item,
        ),
      );

      if (notification.data?.url) {
        navigate(notification.data.url);
      }
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    }
  }

  async function handleDeleteNotification(uuid) {
    setError("");

    try {
      await deleteNotificationByUuid(uuid);
      setItems((current) => current.filter((item) => item.uuid !== uuid));
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    }
  }

  async function handleMarkAllAsRead() {
    if (isBulkActionLoading) {
      return;
    }

    setIsBulkActionLoading(true);
    setError("");

    try {
      await markAllNotificationsAsRead();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
    } catch (requestError) {
      setError(extractErrorMessage(requestError));
    } finally {
      setIsBulkActionLoading(false);
    }
  }

  function handlePreviousPage() {
    const nextPage = Math.max(DEFAULT_PAGE, pagination.page - 1);
    loadNotifications(nextPage, pagination.limit);
  }

  function handleNextPage() {
    const nextPage = Math.min(pagination.totalPages, pagination.page + 1);
    loadNotifications(nextPage, pagination.limit);
  }

  function handleLimitChange(event) {
    const nextLimit = toPositiveInt(event.target.value, DEFAULT_LIMIT);
    loadNotifications(DEFAULT_PAGE, nextLimit);
  }

  const paginationControls = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-base-content/70 flex min-w-max items-center gap-2 text-sm">
        <span className="whitespace-nowrap">Notifications per page</span>
        <select
          className="select select-bordered select-sm"
          value={pagination.limit}
          onChange={handleLimitChange}
          disabled={loading}
        >
          {PAGE_SIZE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={handlePreviousPage}
          disabled={pagination.page <= DEFAULT_PAGE || loading}
        >
          Previous
        </button>

        <p className="text-base-content/60 text-sm">
          Page {pagination.page} / {Math.max(1, pagination.totalPages)}
        </p>

        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={handleNextPage}
          disabled={pagination.page >= pagination.totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-9 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-base-content/60 text-sm">
              Review updates from scans, reminders, and appointments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPushAvailable ? (
              isPushEnabled ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleDisablePush}
                  disabled={isPushLoading}
                >
                  <FaBellSlash />
                  Disable push
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleEnablePush}
                  disabled={isPushLoading}
                >
                  <FaBell />
                  Enable push
                </button>
              )
            ) : (
              <span className="badge badge-warning badge-sm">
                Push unsupported
              </span>
            )}

            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleMarkAllAsRead}
              disabled={!items.length || isBulkActionLoading}
            >
              <FaCheckDouble />
              Mark all read
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error alert-soft">
            <span>{error}</span>
          </div>
        )}

        <div>{paginationControls}</div>

        <div className="card bg-base-200 shadow">
          <div className="card-body p-0">
            <div className="border-base-300 border-b p-4">
              <p className="text-sm">
                Unread in this page:{" "}
                <span className="font-semibold">{unreadCount}</span>
              </p>
            </div>

            {loading ? (
              <div className="p-6">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6">
                <p className="text-base-content/60 text-sm">
                  No notifications yet.
                </p>
              </div>
            ) : (
              <ul className="divide-base-300 divide-y">
                {items.map((notification) => (
                  <li key={notification.uuid} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 font-semibold">
                          {notification.title}
                        </p>
                        <p className="text-base-content/70 text-sm">
                          {notification.body}
                        </p>
                        <p className="text-base-content/50 mt-2 text-xs">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {!notification.readAt && (
                          <span className="badge badge-info badge-sm h-8 px-3">
                            Unread
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleMarkAsRead(notification)}
                        >
                          <FaCheck />
                          Open
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() =>
                            handleDeleteNotification(notification.uuid)
                          }
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>{paginationControls}</div>
      </div>
    </div>
  );
}
