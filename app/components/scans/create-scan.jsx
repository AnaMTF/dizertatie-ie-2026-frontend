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

const MAX_IMAGES_PER_SCAN = 4;

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24;

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

function StepUpload({ files, onFilesChange, onNext, initialBodyPart }) {
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
          bodyPart: initialBodyPart,
          imageType: "",
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
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaCloudUploadAlt /> Upload images
      </h2>
      <p className="text-base-content/60 text-sm">
        Select one or more medical images to analyse. You can add more before
        submitting, up to {MAX_IMAGES_PER_SCAN} images.
      </p>

      <button
        type="button"
        className="btn btn-outline w-full"
        onClick={() => inputRef.current?.click()}
      >
        <FaCloudUploadAlt /> Choose images
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 overflow-y-auto">
          {files.map((item, i) => (
            <div key={i} className="relative">
              <img
                src={item.preview}
                alt={item.file.name}
                className="bg-base-300 h-20 w-full rounded object-cover"
              />
              <button
                type="button"
                className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                onClick={() => removeFile(i)}
              >
                ✕
              </button>
              <p className="text-base-content/60 truncate text-xs">
                {item.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <StepActions
        onNext={onNext}
        disabled={files.length === 0}
        tooltipMessage="Upload at least one image to continue"
      />
    </div>
  );
}

function StepCategorize({ files, onFilesChange, onNext, onBack }) {
  function handleFieldChange(index, field, value) {
    onFilesChange((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  const allCategorized = files.every((f) => f.bodyPart && f.imageType);

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaListAlt /> Categorise images
      </h2>
      <p className="text-base-content/60 text-sm">
        For each image, select the body part and type of scan.
      </p>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {files.map((item, i) => (
          <div
            key={i}
            className="bg-base-200 flex items-center gap-3 rounded-xl p-3"
          >
            <img
              src={item.preview}
              alt={item.file.name}
              className="bg-base-300 h-14 w-14 shrink-0 rounded object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="truncate text-sm font-medium">{item.file.name}</p>
              <div className="flex gap-2">
                <select
                  className="select select-sm flex-1"
                  value={item.bodyPart}
                  onChange={(e) =>
                    handleFieldChange(i, "bodyPart", e.target.value)
                  }
                >
                  <option value="">Body part…</option>
                  {BODY_PARTS.map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-sm flex-1"
                  value={item.imageType}
                  onChange={(e) =>
                    handleFieldChange(i, "imageType", e.target.value)
                  }
                >
                  <option value="">Image type…</option>
                  {IMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!allCategorized}
        tooltipMessage="All images must have a body part and image type"
      />
    </div>
  );
}

function StepReview({ files, onBack, onSubmit, submitting }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaRobot /> Review &amp; submit
      </h2>
      <p className="text-base-content/60 text-sm">
        Check your images before sending them for AI analysis.
      </p>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {files.map((item, i) => (
          <div
            key={i}
            className="bg-base-200 flex items-center gap-3 rounded-xl px-3 py-2"
          >
            <img
              src={item.preview}
              alt={item.file.name}
              className="bg-base-300 h-10 w-10 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.file.name}</p>
              <p className="text-base-content/50 text-xs">
                {item.bodyPart} &mdash; {item.imageType}
              </p>
            </div>
          </div>
        ))}
      </div>

      <StepActions
        onNext={onSubmit}
        onBack={onBack}
        nextLabel={submitting ? "Submitting…" : "Submit for analysis"}
        disabled={submitting}
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdScan, setCreatedScan] = useState(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const metadata = files.map((item) => ({
        fileName: item.file.name,
        bodyPart: item.bodyPart,
        imageType: item.imageType,
      }));
      const formData = new FormData();

      files.forEach((item) => {
        formData.append("images", item.file);
      });
      formData.append("metadata", JSON.stringify(metadata));

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
        <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Upload</li>
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>
          Categorise
        </li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Review</li>
      </ul>

      <div className="flex flex-1 flex-col">
        {selectedRegionName && (
          <div className="alert alert-info mb-2">
            <FaRobot />
            <span>
              Starting from <strong>{selectedRegionName}</strong>. New uploads
              will be prefilled with <strong>{initialBodyPart}</strong>.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-2">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <StepUpload
            files={files}
            onFilesChange={setFiles}
            initialBodyPart={initialBodyPart}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepCategorize
            files={files}
            onFilesChange={setFiles}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepReview
            files={files}
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
      <div className="modal-box relative max-w-3xl overflow-hidden p-0">
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
