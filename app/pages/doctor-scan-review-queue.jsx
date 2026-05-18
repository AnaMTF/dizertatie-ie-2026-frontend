import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaDownload, FaSearch, FaTimes } from "react-icons/fa";
import { redirect } from "react-router";
import { API_BASE, getToken, getUser } from "../utils/auth";

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "doctor") return redirect("/");
  return null;
}

function extractErrorMessage(error) {
  if (Array.isArray(error)) {
    return error[0]?.message || "Request validation failed";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function parseJsonResponse(response) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(json?.error));
  }

  return json;
}

function formatConfidence(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildOptimizedScanImageUrl(scanUuid, imageUuid) {
  const query = new URLSearchParams({
    w: "960",
    h: "960",
    q: "78",
    format: "webp",
  });

  return `${API_BASE}/scan/${encodeURIComponent(scanUuid)}/images/${encodeURIComponent(imageUuid)}?${query.toString()}`;
}

function getScanImageRows(scan) {
  const results = scan?.results;
  const resultImages =
    results && typeof results === "object" && Array.isArray(results.images)
      ? results.images
      : [];

  return resultImages.map((item, index) => ({
    key: `${item?.imageUuid || index}-${item?.modelKey || "model"}`,
    imageUuid: item?.imageUuid || null,
    modelKey: item?.modelKey || "unknown_model",
    routeKey: item?.routeKey || null,
    label: item?.prediction?.label || null,
    confidence: item?.prediction?.confidence,
    index: index + 1,
  }));
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: "badge-warning", label: "Pending" },
    processing: { cls: "badge-info", label: "Processing" },
    completed: { cls: "badge-success", label: "Completed" },
    failed: { cls: "badge-error", label: "Failed" },
  };

  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };

  return <span className={`badge ${cls}`}>{label}</span>;
}

function VerdictBadge({ verdict }) {
  const map = {
    pending: { cls: "badge-warning", label: "Pending review" },
    accurate: { cls: "badge-success", label: "Accurate" },
    inaccurate: { cls: "badge-error", label: "Inaccurate" },
  };

  const { cls, label } = map[verdict] || {
    cls: "badge-neutral",
    label: verdict || "Unknown",
  };

  return <span className={`badge ${cls}`}>{label}</span>;
}

function QueueTable({ scans, loading, error, onOpenScan, onRefresh }) {
  return (
    <div className="card bg-base-100 border-base-300 border shadow-sm">
      <div className="card-body p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold">Scans pending review</h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-zebra table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Body part</th>
                <th>Image type</th>
                <th>AI status</th>
                <th>Verified</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="text-error text-center">
                    {error}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="text-base-content/60 text-center">
                    Loading queue...
                  </td>
                </tr>
              )}
              {!loading && !error && scans.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-base-content/60 text-center">
                    No scans in your review queue.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                scans.map((scan) => (
                  <tr key={scan.uuid}>
                    <td>{formatDateTime(scan.createdAt)}</td>
                    <td>
                      {scan.patient
                        ? `${scan.patient.firstName} ${scan.patient.lastName}`
                        : "Patient"}
                    </td>
                    <td>{scan.bodyPart}</td>
                    <td>{scan.imageType}</td>
                    <td>
                      <StatusBadge status={scan.status} />
                    </td>
                    <td>
                      <VerdictBadge verdict={scan.verificationVerdict} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => onOpenScan(scan)}
                      >
                        <FaSearch />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ scan, loadingAction, actionError, onClose, onVerify }) {
  const [imageSources, setImageSources] = useState({});
  const [downloadError, setDownloadError] = useState("");
  const [downloadingImageUuid, setDownloadingImageUuid] = useState("");

  const imageRows = useMemo(() => getScanImageRows(scan), [scan]);

  useEffect(() => {
    const submittedImages = Array.isArray(scan?.images) ? scan.images : [];
    const scanUuid = scan?.uuid;
    const token = getToken();

    if (!scanUuid || submittedImages.length === 0 || !token) {
      setImageSources({});
      return;
    }

    const controllers = [];
    const objectUrls = [];

    setImageSources(
      Object.fromEntries(
        submittedImages.map((image, index) => {
          const imageUuid =
            image?.uuid || image?.imageUuid || `image-${index + 1}`;
          return [imageUuid, { loading: true, url: null, error: null }];
        }),
      ),
    );

    submittedImages.forEach((image, index) => {
      const imageUuid = image?.uuid || image?.imageUuid || `image-${index + 1}`;
      const controller = new AbortController();
      controllers.push(controller);

      fetch(buildOptimizedScanImageUrl(scanUuid, imageUuid), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Unable to load image");
          }

          const imageBlob = await response.blob();
          const objectUrl = URL.createObjectURL(imageBlob);
          objectUrls.push(objectUrl);

          setImageSources((current) => ({
            ...current,
            [imageUuid]: { loading: false, url: objectUrl, error: null },
          }));
        })
        .catch((error) => {
          if (error?.name === "AbortError") {
            return;
          }

          setImageSources((current) => ({
            ...current,
            [imageUuid]: {
              loading: false,
              url: null,
              error: error.message || "Unable to load image",
            },
          }));
        });
    });

    return () => {
      controllers.forEach((controller) => controller.abort());
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [scan]);

  if (!scan) {
    return null;
  }

  async function handleDownloadOriginal(image) {
    const imageUuid = image?.uuid || image?.imageUuid;

    if (!scan?.uuid || !imageUuid) {
      return;
    }

    try {
      setDownloadError("");
      setDownloadingImageUuid(imageUuid);

      const response = await fetch(
        `${API_BASE}/scan/${scan.uuid}/images/${imageUuid}/download`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(extractErrorMessage(json?.error));
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `scan-${scan.uuid}-image-${imageUuid}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setDownloadError(requestError.message || "Failed to download image");
    } finally {
      setDownloadingImageUuid("");
    }
  }

  return (
    <dialog id="doctor-scan-review-modal" className="modal modal-open">
      <div className="modal-box flex h-[90vh] max-h-[90vh] w-11/12 max-w-6xl flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Review AI Scan</h3>
              <p className="text-base-content/60 text-sm">
                Confirm whether this AI result is accurate.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-circle btn-sm btn-ghost"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/60 text-xs uppercase">Patient</p>
              <p className="font-semibold">
                {scan.patient
                  ? `${scan.patient.firstName} ${scan.patient.lastName}`
                  : "Patient"}
              </p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/60 text-xs uppercase">
                Body part
              </p>
              <p className="font-semibold">{scan.bodyPart}</p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/60 text-xs uppercase">
                Image type
              </p>
              <p className="font-semibold">{scan.imageType}</p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/60 text-xs uppercase">
                Processed at
              </p>
              <p className="font-semibold">
                {formatDateTime(scan?.results?.processedAt)}
              </p>
            </div>
          </div>

          {Array.isArray(scan.images) && scan.images.length > 0 && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {scan.images.map((image, index) => {
                const imageUuid =
                  image?.uuid || image?.imageUuid || `image-${index + 1}`;
                const source = imageSources[imageUuid];

                return (
                  <div key={imageUuid} className="bg-base-200 rounded-box p-3">
                    <p className="mb-2 text-sm font-semibold">
                      Image {index + 1}
                    </p>
                    {source?.url ? (
                      <img
                        src={source.url}
                        alt={`Scan ${index + 1}`}
                        className="bg-base-100 h-40 w-full rounded-lg object-cover"
                      />
                    ) : source?.error ? (
                      <div className="bg-base-100 text-error flex h-40 items-center justify-center rounded-lg text-sm">
                        {source.error}
                      </div>
                    ) : (
                      <div className="bg-base-100 h-40 animate-pulse rounded-lg" />
                    )}

                    <button
                      type="button"
                      className="btn btn-outline btn-sm mt-3 w-full"
                      onClick={() => handleDownloadOriginal(image)}
                      disabled={downloadingImageUuid === imageUuid}
                    >
                      <FaDownload />
                      {downloadingImageUuid === imageUuid
                        ? "Downloading..."
                        : "Download original"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {downloadError && (
            <div className="alert alert-error mb-4">
              <span>{downloadError}</span>
            </div>
          )}

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {imageRows.length > 0 ? (
              imageRows.map((row) => (
                <div key={row.key} className="bg-base-200 rounded-box p-3">
                  <p className="text-base-content/60 text-xs uppercase">
                    Image {row.index} - {row.modelKey}
                  </p>
                  {row.routeKey && (
                    <p className="text-base-content/60 text-xs">
                      Route: {row.routeKey}
                    </p>
                  )}
                  <p className="mt-2 text-lg font-semibold">
                    {row.label || "No label"}
                  </p>
                  <p className="text-base-content/70 text-sm">
                    Confidence: {formatConfidence(row.confidence)}
                  </p>
                </div>
              ))
            ) : (
              <div className="alert alert-warning md:col-span-2">
                <span>No image-level AI predictions were returned.</span>
              </div>
            )}
          </div>
        </div>

        {actionError && (
          <div className="alert alert-error mt-3">
            <span>{actionError}</span>
          </div>
        )}

        <div className="modal-action mt-3 justify-end">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loadingAction}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => onVerify("inaccurate")}
            disabled={loadingAction}
          >
            <FaTimes />
            Mark Inaccurate
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => onVerify("accurate")}
            disabled={loadingAction}
          >
            <FaCheck />
            Mark Accurate
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

export default function DoctorScanReviewQueuePage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/scan/review-queue`, {
        headers: getAuthHeaders(),
      });

      const json = await parseJsonResponse(response);
      setScans(Array.isArray(json?.data) ? json.data : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load scan review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  async function openScan(scan) {
    setActionError("");

    try {
      const response = await fetch(
        `${API_BASE}/scan/review-queue/${scan.uuid}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const json = await parseJsonResponse(response);
      setSelectedScan(json?.data || null);
    } catch (requestError) {
      setActionError(requestError.message || "Failed to open scan");
    }
  }

  function closeModal() {
    if (loadingAction) {
      return;
    }

    setSelectedScan(null);
    setActionError("");
  }

  async function handleVerify(verdict) {
    if (!selectedScan || loadingAction) {
      return;
    }

    setLoadingAction(true);
    setActionError("");

    try {
      const endpoint =
        verdict === "accurate"
          ? `${API_BASE}/scan/${selectedScan.uuid}/verify-accurate`
          : `${API_BASE}/scan/${selectedScan.uuid}/verify-inaccurate`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });

      await parseJsonResponse(response);
      setSelectedScan(null);
      await fetchQueue();
    } catch (requestError) {
      setActionError(requestError.message || "Failed to submit verification");
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div className="px-6 py-6 lg:px-9">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Scan Review Queue</h1>
          <p className="text-base-content/60 text-sm">
            Review completed AI scans that match your specialization.
          </p>
        </div>

        <QueueTable
          scans={scans}
          loading={loading}
          error={error}
          onOpenScan={openScan}
          onRefresh={fetchQueue}
        />
      </div>

      {selectedScan && (
        <ReviewModal
          scan={selectedScan}
          loadingAction={loadingAction}
          actionError={actionError}
          onClose={closeModal}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}
