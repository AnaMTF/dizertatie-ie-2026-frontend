import { useCallback, useEffect, useRef, useState } from "react";
import { FaEye, FaPlus, FaRobot, FaSyncAlt } from "react-icons/fa";
import { Link, redirect, useSearchParams } from "react-router";
import CreateScan from "../components/scans/create-scan";
import { API_BASE, getToken, getUser } from "../utils/auth";
import { APP_DATA_REFRESH_EVENT } from "../utils/notifications";

const AUTO_REFRESH_INTERVAL_MS = 30000;

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "patient") return redirect("/");
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

function formatConfidence(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function getScanImageRows(scan) {
  const results = scan?.results;
  const resultImages =
    results && typeof results === "object" && Array.isArray(results.images)
      ? results.images
      : [];
  const resultErrors =
    results && typeof results === "object" && Array.isArray(results.errors)
      ? results.errors
      : [];
  const submittedImages = Array.isArray(scan?.images) ? scan.images : [];
  const submittedIndexByUuid = new Map();

  submittedImages.forEach((submittedImage, index) => {
    const imageUuid =
      submittedImage?.imageUuid || submittedImage?.uuid || submittedImage?.id;
    if (imageUuid) {
      submittedIndexByUuid.set(imageUuid, index + 1);
    }
  });

  if (resultImages.length > 0 || resultErrors.length > 0) {
    const byResultKey = new Map();

    function getResultKey(item, fallbackPrefix, index) {
      const imageUuid = item?.imageUuid || null;
      const modelKey = item?.modelKey || "unknown_model";
      const routeKey = item?.routeKey || "unknown_route";

      if (!imageUuid) {
        return `${fallbackPrefix}-${index + 1}::${modelKey}::${routeKey}`;
      }

      return `${imageUuid}::${modelKey}::${routeKey}`;
    }

    function getImageIndex(imageUuid, fallbackIndex) {
      if (imageUuid && submittedIndexByUuid.has(imageUuid)) {
        return submittedIndexByUuid.get(imageUuid);
      }

      return fallbackIndex + 1;
    }

    resultImages.forEach((item, index) => {
      const key = getResultKey(item, "result", index);
      byResultKey.set(key, {
        key,
        index: getImageIndex(item?.imageUuid || null, index),
        imageUuid: item?.imageUuid || null,
        modelKey: item?.modelKey || null,
        routeKey: item?.routeKey || null,
        label: item?.prediction?.label || null,
        confidence: item?.prediction?.confidence,
        error: null,
      });
    });

    resultErrors.forEach((item, index) => {
      const key = getResultKey(item, "error", index);
      const current = byResultKey.get(key);
      if (current) {
        current.error = item?.error || null;
      } else {
        byResultKey.set(key, {
          key,
          index: getImageIndex(item?.imageUuid || null, index),
          imageUuid: item?.imageUuid || null,
          modelKey: item?.modelKey || null,
          routeKey: item?.routeKey || null,
          label: null,
          confidence: null,
          error: item?.error || null,
        });
      }
    });

    return Array.from(byResultKey.values()).sort((left, right) => {
      if (left.index !== right.index) {
        return left.index - right.index;
      }

      return String(left.modelKey || "").localeCompare(
        String(right.modelKey || ""),
      );
    });
  }

  if (submittedImages.length > 0) {
    return submittedImages.map((submittedImage, index) => {
      const imageUuid =
        submittedImage?.imageUuid || submittedImage?.uuid || submittedImage?.id;

      return {
        key: imageUuid || `image-${index + 1}`,
        index: index + 1,
        imageUuid,
        modelKey: null,
        routeKey: null,
        label: null,
        confidence: null,
        error: null,
      };
    });
  }

  return [];
}

function getScanResultsSummary(scan) {
  const rows = getScanImageRows(scan);

  if (rows.length === 0) {
    return "Result available";
  }

  const predicted = rows.filter((row) => row.label).length;
  const failed = rows.filter((row) => row.error).length;

  if (predicted > 0 && failed > 0) {
    return `${predicted} predicted, ${failed} failed`;
  }

  if (predicted > 0) {
    return `${predicted} predictions ready`;
  }

  if (failed > 0) {
    return `${failed} failed`;
  }

  return "Processing";
}

function groupScanImageRowsByModel(imageRows) {
  const groups = new Map();

  imageRows.forEach((imageRow) => {
    const modelName = imageRow.modelKey || "unknown_model";
    if (!groups.has(modelName)) {
      groups.set(modelName, {
        modelKey: modelName,
        routeKey: imageRow.routeKey || null,
        images: [],
      });
    }

    groups.get(modelName).images.push(imageRow);
  });

  return Array.from(groups.values());
}

function formatProcessedAt(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildScanRegions(scanOptions) {
  const regionMap = new Map();

  scanOptions.forEach((scanOption) => {
    const region = scanOption.region;

    if (!region?.key || regionMap.has(region.key)) {
      return;
    }

    regionMap.set(region.key, {
      key: region.key,
      name: region.name || scanOption.bodyPart,
      description: region.description || scanOption.description,
    });
  });

  return Array.from(regionMap.values());
}

function resolveRecommendedSpecialty(scan, scanOptions) {
  if (!scan) {
    return "";
  }

  const matchedOption = scanOptions.find(
    (option) =>
      option.bodyPart === scan.bodyPart && option.imageType === scan.imageType,
  );

  return matchedOption?.recommendedSpecialty || "";
}

function getAuthToken() {
  return getToken();
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

function RegionSelector({ regions, selectedRegionKey, onSelectRegion }) {
  return (
    <div className="card bg-base-100 border-base-200 border shadow-sm">
      <div className="card-body gap-4 p-5">
        <div>
          <h2 className="text-xl font-bold">Choose an area</h2>
          <p className="text-base-content/60 text-sm">
            Pick the body area you want to analyze.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {regions.map((region) => {
            const isSelected = selectedRegionKey === region.key;

            return (
              <button
                key={region.key}
                type="button"
                onClick={() => onSelectRegion(region.key)}
                className={[
                  "rounded-box border p-4 text-left transition",
                  isSelected
                    ? "border-primary bg-primary text-primary-content shadow-sm"
                    : "border-base-300 bg-base-200 hover:border-base-content/30",
                ].join(" ")}
              >
                <p className="font-semibold">{region.name}</p>
                <p
                  className={[
                    "mt-1 text-sm",
                    isSelected
                      ? "text-primary-content/80"
                      : "text-base-content/60",
                  ].join(" ")}
                >
                  {region.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
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

function VerificationBadge({ verdict, verified }) {
  if (verdict === "accurate" && verified) {
    return <span className="badge badge-success">Accurate</span>;
  }

  if (verdict === "inaccurate") {
    return <span className="badge badge-error">Inaccurate</span>;
  }

  return <span className="badge badge-warning">Pending review</span>;
}

function TopBar() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Scans</h1>
        <p className="text-base-content/50 text-sm">
          Upload medical images for AI-powered analysis
        </p>
      </div>
    </div>
  );
}

function ScanConfigurator({
  scanOptions,
  selectedRegionKey,
  onSelectRegion,
  onStartScan,
  optionsLoading,
  optionsError,
}) {
  const regions = buildScanRegions(scanOptions);
  const selectedRegion = regions.find(
    (region) => region.key === selectedRegionKey,
  );
  const visibleOptions = selectedRegionKey
    ? scanOptions.filter(
        (scanOption) => scanOption.region?.key === selectedRegionKey,
      )
    : scanOptions;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
      <RegionSelector
        regions={regions}
        selectedRegionKey={selectedRegionKey}
        onSelectRegion={onSelectRegion}
      />

      <div className="card bg-base-100 border-base-200 border shadow-sm">
        <div className="card-body gap-5 p-6">
          <div>
            <h2 className="text-xl font-bold">Configure AI analysis</h2>
            <p className="text-base-content/60 text-sm">
              Choose an area, then select the type of scan you want to upload.
            </p>
          </div>

          <div className="stats stats-vertical bg-base-200 w-full shadow-none">
            <div className="stat px-4 py-3">
              <div className="stat-title">Selected region</div>
              <div className="stat-value text-lg">
                {selectedRegion?.name || "Select a region"}
              </div>
              <div className="stat-desc">
                {selectedRegion?.description ||
                  "Choose an area to view the scan types."}
              </div>
            </div>
            <div className="stat px-4 py-3">
              <div className="stat-title">Scan types</div>
              <div className="stat-value text-lg">{visibleOptions.length}</div>
              <div className="stat-desc">
                Each scan type matches one body area and one image method.
              </div>
            </div>
          </div>

          {optionsError && (
            <div className="alert alert-error">
              <span>{optionsError}</span>
            </div>
          )}

          {!optionsError && visibleOptions.length > 0 && (
            <div className="bg-base-200 rounded-box flex flex-wrap gap-2 p-3">
              {visibleOptions.map((scanOption) => (
                <span key={scanOption.id} className="badge badge-outline">
                  {scanOption.label}
                </span>
              ))}
            </div>
          )}

          <div className="alert alert-info">
            <FaRobot />
            <span>
              AI results support clinical workflows and still need professional
              interpretation.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onStartScan}
            disabled={optionsLoading || visibleOptions.length === 0}
          >
            <FaPlus />
            {optionsLoading
              ? "Loading scan types"
              : selectedRegion && visibleOptions.length === 1
                ? `Upload ${visibleOptions[0].label}`
                : selectedRegion
                  ? `Choose ${selectedRegion.name} study`
                  : "Upload scan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanResultsModal({ scan, scanOptions = [], onClose }) {
  const results = scan?.results;
  const hasStructuredResults = results && typeof results === "object";
  const imageRows = getScanImageRows(scan);
  const groupedImageRows = groupScanImageRowsByModel(imageRows);
  const [submittedImageSources, setSubmittedImageSources] = useState({});
  const recommendedSpecialty = resolveRecommendedSpecialty(scan, scanOptions);
  const favoriteClinicUuid = getUser()?.favoriteClinicUuid || "";
  const createAppointmentParams = new URLSearchParams({
    create: "true",
  });

  if (recommendedSpecialty) {
    createAppointmentParams.set("specialty", recommendedSpecialty);
  }

  if (favoriteClinicUuid) {
    createAppointmentParams.set("clinic", favoriteClinicUuid);
  }

  if (scan?.uuid) {
    createAppointmentParams.set("scanUuid", scan.uuid);
  }

  const createAppointmentUrl = `/appointments?${createAppointmentParams.toString()}`;

  useEffect(() => {
    const submittedImages = Array.isArray(scan?.images) ? scan.images : [];
    const scanUuid = scan?.uuid;
    const token = getAuthToken();

    if (!scanUuid || submittedImages.length === 0 || !token) {
      setSubmittedImageSources({});
      return;
    }

    const abortControllers = [];
    const objectUrls = [];

    setSubmittedImageSources(
      Object.fromEntries(
        submittedImages.map((image, index) => {
          const imageUuid =
            image?.uuid ||
            image?.imageUuid ||
            image?.id ||
            `image-${index + 1}`;

          return [
            imageUuid,
            {
              loading: true,
              url: null,
              error: null,
            },
          ];
        }),
      ),
    );

    submittedImages.forEach((image, index) => {
      const imageUuid =
        image?.uuid || image?.imageUuid || image?.id || `image-${index + 1}`;
      const abortController = new AbortController();
      abortControllers.push(abortController);

      fetch(buildOptimizedScanImageUrl(scanUuid, imageUuid), {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Unable to load image");
          }

          const imageBlob = await response.blob();
          const objectUrl = URL.createObjectURL(imageBlob);
          objectUrls.push(objectUrl);

          setSubmittedImageSources((currentSources) => ({
            ...currentSources,
            [imageUuid]: {
              loading: false,
              url: objectUrl,
              error: null,
            },
          }));
        })
        .catch((loadError) => {
          if (loadError?.name === "AbortError") {
            return;
          }

          setSubmittedImageSources((currentSources) => ({
            ...currentSources,
            [imageUuid]: {
              loading: false,
              url: null,
              error: loadError.message || "Unable to load image",
            },
          }));
        });
    });

    return () => {
      abortControllers.forEach((abortController) => abortController.abort());
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [scan?.images, scan?.uuid]);

  return (
    <dialog id="scan-results-modal" className="modal" onClose={onClose}>
      <div className="modal-box h-[90vh] max-h-[90vh] w-11/12 max-w-6xl overflow-y-auto">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>

        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-bold">Scan result</h3>
            <p className="text-base-content/60 text-sm">
              Prediction summary for each submitted image.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/50 text-xs uppercase">Status</p>
              <p className="mt-1">
                <StatusBadge status={scan?.status || "unknown"} />
              </p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/50 text-xs uppercase">Images</p>
              <p className="mt-1 font-semibold">{scan?.images?.length ?? 0}</p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/50 text-xs uppercase">
                Processed at
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatProcessedAt(results?.processedAt)}
              </p>
            </div>
            <div className="bg-base-200 rounded-box p-3">
              <p className="text-base-content/50 text-xs uppercase">Verified</p>
              <p className="mt-1">
                <VerificationBadge
                  verdict={scan?.verificationVerdict}
                  verified={scan?.verified}
                />
              </p>
            </div>
          </div>

          {scan?.verifiedByDoctor && (
            <div className="bg-base-200 rounded-box p-3 text-sm">
              Reviewed by Dr. {scan.verifiedByDoctor.firstName}{" "}
              {scan.verifiedByDoctor.lastName} on{" "}
              {formatProcessedAt(scan.verifiedAt)}
            </div>
          )}

          {hasStructuredResults && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-base-200 rounded-box p-3">
                <p className="text-base-content/50 text-xs uppercase">Total</p>
                <p className="mt-1 font-semibold">{results.total ?? "—"}</p>
              </div>
              <div className="bg-base-200 rounded-box p-3">
                <p className="text-base-content/50 text-xs uppercase">
                  Processed
                </p>
                <p className="mt-1 font-semibold">{results.count ?? "—"}</p>
              </div>
              <div className="bg-base-200 rounded-box p-3">
                <p className="text-base-content/50 text-xs uppercase">Failed</p>
                <p className="mt-1 font-semibold">
                  {results.failedCount ?? "—"}
                </p>
              </div>
            </div>
          )}

          {Array.isArray(scan?.images) && scan.images.length > 0 && (
            <div className="bg-base-200 rounded-box p-4">
              <div className="mb-3">
                <p className="text-base-content/50 text-xs uppercase">
                  Submitted images
                </p>
                <p className="text-base-content/70 text-sm">
                  Optimized previews of the original files used for this scan.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {scan.images.map((image, index) => {
                  const imageUuid =
                    image?.uuid ||
                    image?.imageUuid ||
                    image?.id ||
                    `image-${index + 1}`;
                  const source = submittedImageSources[imageUuid];

                  return (
                    <div
                      key={imageUuid}
                      className="bg-base-100 rounded-box p-3"
                    >
                      <p className="text-base-content/50 mb-2 text-xs uppercase">
                        Image {index + 1}
                      </p>

                      {source?.url ? (
                        <img
                          src={source.url}
                          alt={`Scan image ${index + 1}`}
                          className="bg-base-200 h-44 w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : source?.error ? (
                        <div className="bg-base-200 text-error flex h-44 items-center justify-center rounded-lg px-3 text-center text-sm">
                          {source.error}
                        </div>
                      ) : (
                        <div className="bg-base-200 h-44 w-full animate-pulse rounded-lg" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {results?.error && (
            <div className="alert alert-error">
              <span>{results.error}</span>
            </div>
          )}

          {results?.details && (
            <div className="bg-base-200 rounded-box p-4 text-sm">
              {results.details}
            </div>
          )}

          <div className="bg-primary/10 border-primary/20 rounded-box flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Book a follow-up appointment</p>
              <p className="text-base-content/70 text-sm">
                Use the scan result to prefill the most relevant specialty.
              </p>
            </div>
            <Link className="btn btn-primary" to={createAppointmentUrl}>
              <FaPlus />
              Create appointment
            </Link>
          </div>

          {groupedImageRows.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedImageRows.map((group) => {
                const predicted = group.images.filter(
                  (image) => image.label,
                ).length;
                const failed = group.images.filter(
                  (image) => image.error,
                ).length;

                return (
                  <div
                    key={group.modelKey}
                    className="bg-base-200 rounded-box p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base-content/50 text-xs uppercase">
                          Model
                        </p>
                        <p className="text-lg leading-tight font-bold">
                          {group.modelKey}
                        </p>
                        {group.routeKey && (
                          <p className="text-base-content/60 text-xs">
                            Route: {group.routeKey}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className="badge badge-outline">
                          {group.images.length} images
                        </span>
                        {predicted > 0 && (
                          <span className="badge badge-success">
                            {predicted} predicted
                          </span>
                        )}
                        {failed > 0 && (
                          <span className="badge badge-error">
                            {failed} failed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {group.images.map((imageRow) => (
                        <div
                          key={imageRow.key}
                          className="bg-base-100 rounded-box p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base-content/50 text-xs uppercase">
                                Image {imageRow.index}
                              </p>
                            </div>
                            {imageRow.error ? (
                              <span className="badge badge-error badge-sm">
                                Failed
                              </span>
                            ) : imageRow.label ? (
                              <span className="badge badge-success badge-sm">
                                Predicted
                              </span>
                            ) : (
                              <span className="badge badge-warning badge-sm">
                                Pending
                              </span>
                            )}
                          </div>

                          {imageRow.label ? (
                            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                              <div className="min-w-0">
                                <p className="text-base-content/50 text-xs uppercase">
                                  Label
                                </p>
                                <p className="text-xl leading-tight font-bold wrap-break-word">
                                  {imageRow.label}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-base-content/50 text-xs uppercase">
                                  Confidence
                                </p>
                                <p className="text-xl leading-tight font-bold whitespace-nowrap">
                                  {formatConfidence(imageRow.confidence)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base-content/60 mt-3 text-sm">
                              No prediction returned for this image yet.
                            </p>
                          )}

                          {imageRow.error && (
                            <p className="text-error mt-2 text-sm">
                              {imageRow.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="alert alert-warning">
              <span>No image-level result details are available yet.</span>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

function ScansTable({ scans, loading, error, onRefresh, onOpenResults }) {
  return (
    <div className="card bg-base-100 flex-1 shadow">
      <div className="card-body overflow-auto p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold">Past scans</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <table className="table-zebra [&_td]:text-base-content [&_th]:text-base-content table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Images</th>
              <th>Body part</th>
              <th>Image type</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {!loading && error && (
              <tr>
                <td colSpan={7} className="text-error px-4 py-6 text-center">
                  {error}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="text-base-content/40 text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && !error && scans.length === 0 && (
              <tr>
                <td colSpan={7} className="text-base-content/40 text-center">
                  No scans yet. Click &ldquo;New Scan&rdquo; to get started.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              scans.map((scan) => (
                <tr key={scan.uuid}>
                  <td className="whitespace-nowrap">
                    {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>{scan.images?.length ?? 0}</td>
                  <td>
                    {scan.bodyPart ? (
                      <span className="badge badge-outline badge-sm">
                        {scan.bodyPart}
                      </span>
                    ) : (
                      <span className="text-base-content/30 text-sm">—</span>
                    )}
                  </td>
                  <td>
                    {scan.imageType ? (
                      <span className="badge badge-outline badge-sm">
                        {scan.imageType}
                      </span>
                    ) : (
                      <span className="text-base-content/30 text-sm">—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={scan.status} />
                  </td>
                  <td>
                    <VerificationBadge
                      verdict={scan.verificationVerdict}
                      verified={scan.verified}
                    />
                  </td>
                  <td className="max-w-xs">
                    {scan.results &&
                    (scan.status === "completed" ||
                      scan.status === "failed") ? (
                      <div className="flex flex-col items-start gap-2">
                        <p className="text-base-content/70 w-full truncate text-sm">
                          {getScanResultsSummary(scan)}
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => onOpenResults(scan)}
                        >
                          <FaEye />
                          View result
                        </button>
                      </div>
                    ) : scan.status === "pending" ||
                      scan.status === "processing" ? (
                      <span className="text-base-content/60 text-sm">
                        Still processing...
                      </span>
                    ) : (
                      <span className="text-base-content/30 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar({ scans }) {
  const total = scans.length;
  const pending = scans.filter(
    (s) => s.status === "pending" || s.status === "processing",
  ).length;
  const completed = scans.filter((s) => s.status === "completed").length;

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
      <div className="card bg-base-200 shadow">
        <div className="card-body p-4">
          <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
            Summary
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Total</span>
              <span className="badge badge-neutral badge-sm">{total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Pending</span>
              <span className="badge badge-warning badge-sm">{pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Completed</span>
              <span className="badge badge-success badge-sm">{completed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body p-4">
          <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
            Tips
          </h2>
          <ul className="text-base-content/60 flex flex-col gap-2 text-xs">
            <li>
              <FaRobot className="mr-1 inline" />
              Results are generated by AI and are not a substitute for
              professional medical advice.
            </li>
            <li>Upload clear, high-quality images for best results.</li>
            <li>Each scan can include multiple files for one scan type.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AiScan() {
  const [searchParams] = useSearchParams();
  const [scans, setScans] = useState([]);
  const [scanOptions, setScanOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  const [selectedRegionKey, setSelectedRegionKey] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [deepLinkOpenedScanUuid, setDeepLinkOpenedScanUuid] = useState(null);
  const requestInFlightRef = useRef(false);

  const fetchScans = useCallback(async ({ silent = false } = {}) => {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;

    if (!silent) {
      setLoading(true);
    }

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      if (!json?.data || !Array.isArray(json.data)) {
        throw new Error("Invalid server response");
      }

      setScans(json.data);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load scans.");
    } finally {
      requestInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function refreshSilently() {
      void fetchScans({ silent: true });
    }

    function handleFocus() {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    }

    function handleDataRefreshEvent() {
      refreshSilently();
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshSilently();
    }, AUTO_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(APP_DATA_REFRESH_EVENT, handleDataRefreshEvent);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        APP_DATA_REFRESH_EVENT,
        handleDataRefreshEvent,
      );
    };
  }, [fetchScans]);

  useEffect(() => {
    async function fetchScanOptions() {
      setOptionsLoading(true);
      setOptionsError(null);

      try {
        const response = await fetch(`${API_BASE}/scan/options`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(extractErrorMessage(json?.error));
        }

        if (!json?.data || !Array.isArray(json.data)) {
          throw new Error("Invalid server response");
        }

        setScanOptions(json.data);

        const regions = buildScanRegions(json.data);
        if (regions.length > 0) {
          setSelectedRegionKey((previousRegionKey) => {
            if (
              previousRegionKey &&
              regions.some((region) => region.key === previousRegionKey)
            ) {
              return previousRegionKey;
            }

            return regions[0].key;
          });
        } else {
          setSelectedRegionKey("");
        }
      } catch (fetchOptionsError) {
        setOptionsError(
          fetchOptionsError.message || "Unable to load scan types.",
        );
      } finally {
        setOptionsLoading(false);
      }
    }

    fetchScanOptions();
  }, []);

  useEffect(() => {
    const scanUuid = searchParams.get("scan");
    if (
      !scanUuid ||
      scans.length === 0 ||
      deepLinkOpenedScanUuid === scanUuid
    ) {
      return;
    }

    const scan = scans.find((scanItem) => scanItem.uuid === scanUuid);
    if (!scan) {
      return;
    }

    if (scan.status === "completed" || scan.status === "failed") {
      setSelectedScan(scan);
      setDeepLinkOpenedScanUuid(scanUuid);
      setTimeout(() => {
        document.getElementById("scan-results-modal")?.showModal();
      }, 0);
    }
  }, [searchParams, scans, deepLinkOpenedScanUuid]);

  useEffect(() => {
    if (!selectedScan?.uuid) {
      return;
    }

    const refreshedSelectedScan = scans.find(
      (scanItem) => scanItem.uuid === selectedScan.uuid,
    );

    if (!refreshedSelectedScan) {
      setSelectedScan(null);
      return;
    }

    setSelectedScan(refreshedSelectedScan);
  }, [scans, selectedScan?.uuid]);

  function handleNewScan() {
    if (optionsLoading || scanOptions.length === 0 || !selectedRegionKey) {
      return;
    }

    document.getElementById("create-scan-modal").showModal();
  }

  function handleOpenResults(scan) {
    setSelectedScan(scan);
    document.getElementById("scan-results-modal")?.showModal();
  }

  function handleCloseResults() {
    setSelectedScan(null);
  }

  const selectedRegion = buildScanRegions(scanOptions).find(
    (region) => region.key === selectedRegionKey,
  );

  return (
    <div className="flex h-full flex-col gap-6 px-6 py-6 lg:px-9">
      <TopBar />
      <ScanConfigurator
        scanOptions={scanOptions}
        selectedRegionKey={selectedRegionKey}
        onSelectRegion={setSelectedRegionKey}
        onStartScan={handleNewScan}
        optionsLoading={optionsLoading}
        optionsError={optionsError}
      />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <ScansTable
          scans={scans}
          loading={loading}
          error={error}
          onRefresh={fetchScans}
          onOpenResults={handleOpenResults}
        />
        <Sidebar scans={scans} />
      </div>
      <ScanResultsModal
        scan={selectedScan}
        scanOptions={scanOptions}
        onClose={handleCloseResults}
      />
      <CreateScan
        onScanCreated={fetchScans}
        scanOptions={scanOptions}
        initialRegionKey={selectedRegionKey}
        selectedRegionName={selectedRegion?.name || ""}
      />
    </div>
  );
}
