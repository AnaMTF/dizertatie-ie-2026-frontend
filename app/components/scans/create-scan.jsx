import { useEffect, useRef, useState } from "react";
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaHourglassHalf,
  FaListAlt,
  FaRobot,
  FaTimesCircle,
} from "react-icons/fa";
import { API_BASE, getToken } from "../../utils/auth";
import StepActions from "../common/step-actions";

const BODY_PARTS = [
  "Head / Brain",
  "Eyes",
  "Neck",
  "Chest",
  "Abdomen",
  "Pelvis",
  "Spine",
  "Shoulder",
  "Arm",
  "Elbow",
  "Wrist / Hand",
  "Hip",
  "Knee",
  "Ankle / Foot",
];

const IMAGE_TYPES = [
  "X-Ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "PET Scan",
  "Mammography",
];

const IMAGE_TYPE_DESCRIPTIONS = {
  "X-Ray": "Fast capture for chest studies, fractures, and routine screening.",
  "CT Scan": "Cross-sectional imaging used for deeper structural review.",
  MRI: "Soft-tissue focused imaging for brain, spine, and organ detail.",
  Ultrasound: "Real-time imaging often used for abdomen and pelvic studies.",
  "PET Scan": "Metabolic imaging used for advanced diagnostic assessment.",
  Mammography: "Breast imaging workflow for screening and focused evaluation.",
};

const MAX_IMAGES_PER_SCAN = 4;

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24;

function createInitialScanDetails(initialBodyPart = "") {
  return {
    bodyPart: initialBodyPart,
    imageType: "",
  };
}

function getAuthToken() {
  return getToken();
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

function formatScanResults(results) {
  if (!results) {
    return "Results are not available yet.";
  }

  if (typeof results === "string") {
    return results;
  }

  if (typeof results.summary === "string" && results.summary.trim()) {
    return results.summary;
  }

  const entries = Object.entries(results)
    .map(([key, value]) => {
      if (value == null) {
        return null;
      }

      if (typeof value === "string") {
        return `${key}: ${value}`;
      }

      return `${key}: ${JSON.stringify(value)}`;
    })
    .filter(Boolean);

  if (!entries.length) {
    return "Analysis complete.";
  }

  return entries.join("\n");
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

function ScanContextBanner({ imageType, selectedRegionName, initialBodyPart }) {
  if (!imageType && !selectedRegionName && !initialBodyPart) {
    return null;
  }

  return (
    <div className="bg-base-200 rounded-box border-base-300 flex flex-wrap items-center gap-2 border px-4 py-3">
      {imageType && (
        <span className="badge badge-primary badge-outline">{imageType}</span>
      )}
      {selectedRegionName && (
        <span className="badge badge-outline">
          Region: {selectedRegionName}
        </span>
      )}
      {initialBodyPart && (
        <span className="badge badge-outline">
          Suggested area: {initialBodyPart}
        </span>
      )}
    </div>
  );
}

function StepImageType({ imageType, onScanDetailsChange, onNext }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaListAlt /> Choose image type first
        </h2>
        <p className="text-base-content/60 text-sm">
          This scan can contain multiple files, but they must all use the same
          imaging modality. Pick that first, then move to upload.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {IMAGE_TYPES.map((type) => {
          const isSelected = imageType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() =>
                onScanDetailsChange((prev) => ({
                  ...prev,
                  imageType: type,
                }))
              }
              className={[
                "rounded-box border p-4 text-left transition",
                isSelected
                  ? "border-primary bg-primary text-primary-content shadow-sm"
                  : "border-base-300 bg-base-200 hover:border-base-content/30",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{type}</p>
                  <p
                    className={[
                      "mt-1 text-sm",
                      isSelected
                        ? "text-primary-content/80"
                        : "text-base-content/60",
                    ].join(" ")}
                  >
                    {IMAGE_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
                {isSelected && (
                  <span className="badge badge-neutral">Selected</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="alert alert-info">
        <FaRobot />
        <span>
          Upload stays locked until an image type is selected. Once chosen, the
          next step is file upload.
        </span>
      </div>

      <StepActions
        onNext={onNext}
        nextLabel="Continue to upload"
        disabled={!imageType}
        tooltipMessage="Choose the image type before continuing"
      />
    </div>
  );
}

function StepUpload({
  files,
  imageType,
  initialBodyPart,
  selectedRegionName,
  onFilesChange,
  onNext,
  onBack,
}) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;
    onFilesChange((prev) => {
      if (prev.length >= MAX_IMAGES_PER_SCAN) {
        return prev;
      }

      const existing = new Set(prev.map((f) => f.file.name));
      const fresh = picked
        .filter((f) => !existing.has(f.name))
        .slice(0, MAX_IMAGES_PER_SCAN - prev.length)
        .map((f) => ({
          file: f,
          preview: URL.createObjectURL(f),
        }));
      return [...prev, ...fresh];
    });
    e.target.value = "";
  }

  function removeFile(index) {
    onFilesChange((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaCloudUploadAlt /> Upload images
        </h2>
        <p className="text-base-content/60 text-sm">
          Add one or more files for this <strong>{imageType}</strong> scan. You
          can upload up to {MAX_IMAGES_PER_SCAN} images before continuing.
        </p>
      </div>

      <ScanContextBanner
        imageType={imageType}
        selectedRegionName={selectedRegionName}
        initialBodyPart={initialBodyPart}
      />

      <div className="bg-base-200 rounded-box border-base-300 flex flex-col gap-4 border p-4">
        <button
          type="button"
          className="rounded-box border-base-300 hover:border-primary hover:bg-base-100 flex min-h-40 w-full flex-col items-center justify-center gap-3 border border-dashed px-6 py-8 text-center transition"
          onClick={() => inputRef.current?.click()}
        >
          <span className="bg-base-100 rounded-full p-4 text-xl">
            <FaCloudUploadAlt />
          </span>
          <div>
            <p className="text-lg font-semibold">Choose images</p>
            <p className="text-base-content/60 text-sm">
              Image files only. Duplicate file names are ignored automatically.
            </p>
          </div>
        </button>

        <div className="text-base-content/60 flex items-center justify-between text-xs">
          <span>
            {files.length} of {MAX_IMAGES_PER_SCAN} files selected
          </span>
          <span>Use Back to change the image type</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Selected files</h3>
            <span className="badge badge-outline">{files.length} files</span>
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
            {files.map((item, i) => (
              <div key={i} className="bg-base-200 relative rounded-xl p-2">
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="bg-base-300 h-24 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                  onClick={() => removeFile(i)}
                >
                  ✕
                </button>
                <div className="mt-2">
                  <p className="truncate text-xs font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-base-content/50 text-[0.7rem]">
                    {imageType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StepActions
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to review"
        disabled={files.length === 0}
        tooltipMessage="Upload at least one image to continue"
      />
    </div>
  );
}

function StepReview({
  files,
  scanDetails,
  initialBodyPart,
  selectedRegionName,
  onScanDetailsChange,
  onBack,
  onSubmit,
  submitting,
}) {
  const isReady = Boolean(scanDetails.bodyPart && scanDetails.imageType);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaRobot /> Review &amp; submit
        </h2>
        <p className="text-base-content/60 text-sm">
          Confirm the scan setup, choose the body area, and submit the upload
          for AI analysis.
        </p>
      </div>

      <ScanContextBanner
        imageType={scanDetails.imageType}
        selectedRegionName={selectedRegionName}
        initialBodyPart={initialBodyPart}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="bg-base-200 rounded-box border-base-300 border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Files ready for analysis
                </h3>
                <p className="text-base-content/60 text-xs">
                  Review the uploaded images before submitting.
                </p>
              </div>
              <span className="badge badge-outline">{files.length} files</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {files.map((item, i) => (
                <div
                  key={i}
                  className="bg-base-100 rounded-box border-base-300 flex items-center gap-3 border p-2"
                >
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="bg-base-300 h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.file.name}
                    </p>
                    <p className="text-base-content/50 text-xs">
                      {scanDetails.imageType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-base-200 rounded-box border-base-300 border p-4">
            <div>
              <h3 className="text-sm font-semibold">Scan setup</h3>
              <p className="text-base-content/60 text-xs">
                The image type is fixed. Choose the body area for the full scan.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="bg-base-100 rounded-box border-base-300 border p-3">
                <p className="text-base-content/60 text-xs uppercase">
                  Image type
                </p>
                <p className="mt-1 text-base font-semibold">
                  {scanDetails.imageType}
                </p>
                <p className="text-base-content/50 mt-2 text-xs">
                  If this is wrong, go back before submitting.
                </p>
              </div>

              <label className="form-control gap-2">
                <span className="label-text text-sm font-medium">
                  Body area
                </span>
                <select
                  className="select w-full"
                  value={scanDetails.bodyPart}
                  onChange={(e) =>
                    onScanDetailsChange((prev) => ({
                      ...prev,
                      bodyPart: e.target.value,
                    }))
                  }
                >
                  <option value="">Select body area…</option>
                  {BODY_PARTS.map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
                {selectedRegionName &&
                  initialBodyPart &&
                  scanDetails.bodyPart === initialBodyPart && (
                    <p className="text-base-content/60 text-xs">
                      Suggested from {selectedRegionName}.
                    </p>
                  )}
              </label>

              <div className="bg-base-100 rounded-box border-base-300 border p-3">
                <p className="text-base-content/60 text-xs uppercase">
                  Submission summary
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {files.length} image{files.length === 1 ? "" : "s"} will be
                  processed as <strong>{scanDetails.imageType}</strong>
                  {scanDetails.bodyPart ? (
                    <>
                      {" "}
                      for <strong>{scanDetails.bodyPart}</strong>
                    </>
                  ) : (
                    <> after you choose a body area</>
                  )}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StepActions
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={submitting ? "Submitting…" : "Submit for analysis"}
        disabled={!isReady || submitting}
        tooltipMessage="Choose the body area before submitting"
      />
    </div>
  );
}

function PostSubmitPanel({ scan, onClose }) {
  const [currentScan, setCurrentScan] = useState(scan);
  const [waiting, setWaiting] = useState(false);
  const [pollError, setPollError] = useState(null);
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  async function pollScanStatus() {
    try {
      const res = await fetch(`${API_BASE}/scan/${scan.uuid}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok && res.status !== 202) {
        throw new Error(extractErrorMessage(json?.error));
      }

      if (!json?.data) {
        throw new Error("Invalid server response");
      }

      setCurrentScan(json.data);

      if (
        json.data.status === "completed" ||
        json.data.status === "failed" ||
        attemptsRef.current >= MAX_POLL_ATTEMPTS
      ) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (
        attemptsRef.current >= MAX_POLL_ATTEMPTS &&
        json.data.status === "processing"
      ) {
        setPollError(
          "Analysis is taking longer than expected. You can close this window and check back later.",
        );
      }
    } catch (error) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPollError(error.message || "Unable to refresh scan status.");
    }
  }

  function startWaiting() {
    clearInterval(intervalRef.current);
    setWaiting(true);
    setPollError(null);
    attemptsRef.current = 0;

    pollScanStatus();

    intervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPollError(
          "Analysis is taking longer than expected. You can close this window and check back later.",
        );
        return;
      }

      await pollScanStatus();
    }, POLL_INTERVAL_MS);
  }

  if (waiting && currentScan.status === "completed") {
    return (
      <div className="flex h-full flex-col gap-4">
        <h2 className="text-success flex items-center gap-2 text-2xl font-bold">
          <FaCheckCircle /> Analysis complete
        </h2>
        <div className="bg-base-200 flex-1 overflow-y-auto rounded-xl p-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {formatScanResults(currentScan.results)}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    );
  }

  if (waiting && currentScan.status === "failed") {
    return (
      <div className="flex h-full flex-col gap-4">
        <h2 className="text-error flex items-center gap-2 text-2xl font-bold">
          <FaTimesCircle /> Analysis failed
        </h2>
        <p className="text-base-content/60 text-sm">
          Something went wrong processing your scan. Please try again later.
        </p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <FaHourglassHalf className="text-primary animate-spin text-5xl" />
        <p className="text-center font-semibold">Waiting for AI analysis…</p>
        <p className="text-base-content/50 text-center text-sm">
          This usually takes about 15 seconds. You can leave and check back
          later.
        </p>
        {pollError && (
          <div className="alert alert-warning w-full max-w-lg">
            <FaTimesCircle />
            <span>{pollError}</span>
          </div>
        )}
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Leave &mdash; notify me later
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <FaCheckCircle className="text-success text-5xl" />
      <div>
        <h2 className="text-2xl font-bold">Scan submitted!</h2>
        <p className="text-base-content/60 mt-1 text-sm">
          Your images have been sent for AI analysis.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={startWaiting}
        >
          <FaHourglassHalf /> Wait here for results
        </button>
        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={onClose}
        >
          Leave &mdash; notify me later
        </button>
      </div>
    </div>
  );
}

function CreateScanForm({
  onScanCreated,
  initialBodyPart,
  selectedRegionName,
}) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [scanDetails, setScanDetails] = useState(() =>
    createInitialScanDetails(initialBodyPart),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdScan, setCreatedScan] = useState(null);

  useEffect(() => {
    setScanDetails((prev) => {
      if (prev.bodyPart || !initialBodyPart) {
        return prev;
      }

      return {
        ...prev,
        bodyPart: initialBodyPart,
      };
    });
  }, [initialBodyPart]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();

      files.forEach((item) => {
        formData.append("images", item.file);
      });
      formData.append("metadata", JSON.stringify(scanDetails));

      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      if (!json?.data) {
        throw new Error("Invalid server response");
      }

      setCreatedScan(json.data);
      onScanCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setScanDetails(createInitialScanDetails(initialBodyPart));
    setStep(0);
    setError(null);
    setCreatedScan(null);
  }

  function handleClose() {
    reset();
    document.getElementById("create-scan-modal")?.close();
  }

  if (createdScan) {
    return (
      <div className="bg-base-100 text-base-content flex h-full flex-col gap-4 p-10">
        <PostSubmitPanel scan={createdScan} onClose={handleClose} />
      </div>
    );
  }

  return (
    <div className="bg-base-100 text-base-content flex h-full flex-col gap-4 p-10">
      <ul className="steps mb-2 w-full">
        <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Type</li>
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Upload</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Review</li>
      </ul>

      <div className="flex flex-1 flex-col">
        {error && (
          <div className="alert alert-error mb-2">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <StepImageType
            imageType={scanDetails.imageType}
            onScanDetailsChange={setScanDetails}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepUpload
            files={files}
            imageType={scanDetails.imageType}
            initialBodyPart={initialBodyPart}
            selectedRegionName={selectedRegionName}
            onFilesChange={setFiles}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepReview
            files={files}
            scanDetails={scanDetails}
            initialBodyPart={initialBodyPart}
            selectedRegionName={selectedRegionName}
            onScanDetailsChange={setScanDetails}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

export default function CreateScan({
  onScanCreated,
  initialBodyPart = "",
  selectedRegionName = "",
}) {
  return (
    <dialog id="create-scan-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 z-10">
            ✕
          </button>
        </form>
        <div className="min-h-160">
          <CreateScanForm
            onScanCreated={onScanCreated}
            initialBodyPart={initialBodyPart}
            selectedRegionName={selectedRegionName}
          />
        </div>
      </div>
    </dialog>
  );
}
