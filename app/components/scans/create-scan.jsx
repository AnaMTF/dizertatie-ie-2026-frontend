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

function getVisibleScanOptions(scanOptions, initialRegionKey) {
  if (!initialRegionKey) {
    return [];
  }

  const filteredOptions = scanOptions.filter(
    (scanOption) => scanOption.region?.key === initialRegionKey,
  );

  return filteredOptions;
}

function getDefaultOptionId(scanOptions, initialRegionKey) {
  const visibleOptions = getVisibleScanOptions(scanOptions, initialRegionKey);

  if (visibleOptions.length === 1) {
    return visibleOptions[0].id;
  }

  return "";
}

function createInitialScanDetails(scanOptions, initialRegionKey = "") {
  return {
    scanOptionId: getDefaultOptionId(scanOptions, initialRegionKey),
  };
}

function getSelectedScanOption(scanOptions, scanOptionId) {
  return (
    scanOptions.find((scanOption) => scanOption.id === scanOptionId) || null
  );
}

function ScanContextBanner({ selectedOption, selectedRegionName }) {
  if (!selectedOption && !selectedRegionName) {
    return null;
  }

  return (
    <div className="bg-base-200 rounded-box border-base-300 flex flex-wrap items-center gap-2 border px-4 py-3">
      {selectedRegionName && (
        <span className="badge badge-outline">
          Region: {selectedRegionName}
        </span>
      )}
      {selectedOption && (
        <>
          <span className="badge badge-primary badge-outline">
            {selectedOption.imageType}
          </span>
          <span className="badge badge-outline">{selectedOption.bodyPart}</span>
          <span className="badge badge-outline">
            {selectedOption.modelKeys.length} model
            {selectedOption.modelKeys.length === 1 ? "" : "s"}
          </span>
        </>
      )}
    </div>
  );
}

function StepScanType({
  scanOptions,
  scanOptionId,
  selectedRegionName,
  onScanDetailsChange,
  onNext,
}) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaListAlt /> Choose a supported scan type
        </h2>
        <p className="text-base-content/60 text-sm">
          Only scan types available for this region are listed here.
        </p>
      </div>

      {selectedRegionName && (
        <div className="alert alert-info">
          <FaRobot />
          <span>Showing supported studies for {selectedRegionName}.</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {scanOptions.map((scanOption) => {
          const isSelected = scanOptionId === scanOption.id;

          return (
            <button
              key={scanOption.id}
              type="button"
              onClick={() =>
                onScanDetailsChange({
                  scanOptionId: scanOption.id,
                })
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
                  <p className="font-semibold">{scanOption.label}</p>
                  <p
                    className={[
                      "mt-1 text-sm",
                      isSelected
                        ? "text-primary-content/80"
                        : "text-base-content/60",
                    ].join(" ")}
                  >
                    {scanOption.description}
                  </p>
                </div>
                {isSelected && (
                  <span className="badge badge-neutral">Selected</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge badge-outline">
                  {scanOption.bodyPart}
                </span>
                <span className="badge badge-outline">
                  {scanOption.imageType}
                </span>
                <span className="badge badge-outline">
                  {scanOption.modelKeys.length} model
                  {scanOption.modelKeys.length === 1 ? "" : "s"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <StepActions
        onNext={onNext}
        nextLabel="Continue to upload"
        disabled={!scanOptionId}
        tooltipMessage="Choose a supported scan type before continuing"
      />
    </div>
  );
}

function StepUpload({
  files,
  selectedOption,
  selectedRegionName,
  onFilesChange,
  onNext,
  onBack,
}) {
  const inputRef = useRef(null);

  function handleChange(event) {
    const pickedFiles = Array.from(event.target.files);
    if (!pickedFiles.length) {
      return;
    }

    onFilesChange((previousFiles) => {
      if (previousFiles.length >= MAX_IMAGES_PER_SCAN) {
        return previousFiles;
      }

      const existingNames = new Set(
        previousFiles.map((previousFile) => previousFile.file.name),
      );
      const freshFiles = pickedFiles
        .filter((pickedFile) => !existingNames.has(pickedFile.name))
        .slice(0, MAX_IMAGES_PER_SCAN - previousFiles.length)
        .map((pickedFile) => ({
          file: pickedFile,
          preview: URL.createObjectURL(pickedFile),
        }));

      return [...previousFiles, ...freshFiles];
    });

    event.target.value = "";
  }

  function removeFile(index) {
    onFilesChange((previousFiles) => {
      URL.revokeObjectURL(previousFiles[index].preview);
      return previousFiles.filter((_, fileIndex) => fileIndex !== index);
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaCloudUploadAlt /> Upload images
        </h2>
        <p className="text-base-content/60 text-sm">
          Add one or more files for <strong>{selectedOption?.label}</strong>.
          You can upload up to {MAX_IMAGES_PER_SCAN} images before continuing.
        </p>
      </div>

      <ScanContextBanner
        selectedOption={selectedOption}
        selectedRegionName={selectedRegionName}
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
          <span>Use Back to change the scan type</span>
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
            {files.map((item, index) => (
              <div key={index} className="bg-base-200 relative rounded-xl p-2">
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="bg-base-300 h-24 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="btn btn-xs btn-circle btn-error absolute top-1 right-1"
                  onClick={() => removeFile(index)}
                >
                  x
                </button>
                <div className="mt-2">
                  <p className="truncate text-xs font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-base-content/50 text-xs">
                    {selectedOption?.label}
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
  selectedOption,
  selectedRegionName,
  onBack,
  onSubmit,
  submitting,
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaRobot /> Review and submit
        </h2>
        <p className="text-base-content/60 text-sm">
          Confirm the supported study and submit the upload for AI analysis.
        </p>
      </div>

      <ScanContextBanner
        selectedOption={selectedOption}
        selectedRegionName={selectedRegionName}
      />

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
            {files.map((item, index) => (
              <div
                key={index}
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
                    {selectedOption?.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-base-200 rounded-box border-base-300 border p-4">
          <div>
            <h3 className="text-sm font-semibold">Study setup</h3>
            <p className="text-base-content/60 text-xs">
              This selection is fixed to an available analysis route.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="bg-base-100 rounded-box border-base-300 border p-3">
              <p className="text-base-content/60 text-xs uppercase">Study</p>
              <p className="mt-1 text-base font-semibold">
                {selectedOption?.label}
              </p>
              <p className="text-base-content/50 mt-2 text-xs">
                {selectedOption?.description}
              </p>
            </div>

            <div className="bg-base-100 rounded-box border-base-300 border p-3">
              <p className="text-base-content/60 text-xs uppercase">
                Body part
              </p>
              <p className="mt-1 text-base font-semibold">
                {selectedOption?.bodyPart}
              </p>
            </div>

            <div className="bg-base-100 rounded-box border-base-300 border p-3">
              <p className="text-base-content/60 text-xs uppercase">
                Image type
              </p>
              <p className="mt-1 text-base font-semibold">
                {selectedOption?.imageType}
              </p>
            </div>

            <div className="bg-base-100 rounded-box border-base-300 border p-3">
              <p className="text-base-content/60 text-xs uppercase">Models</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedOption?.modelKeys.map((modelKey) => (
                  <span key={modelKey} className="badge badge-outline">
                    {modelKey}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StepActions
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={submitting ? "Submitting..." : "Submit for analysis"}
        disabled={!selectedOption || submitting}
        tooltipMessage="Choose a supported scan type before submitting"
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
      const response = await fetch(`${API_BASE}/scan/${scan.uuid}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await response.json().catch(() => null);

      if (!response.ok && response.status !== 202) {
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
        <p className="text-center font-semibold">Waiting for AI analysis...</p>
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
          Leave - notify me later
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <FaCheckCircle className="text-success text-5xl" />
      <div>
        <h2 className="text-2xl font-bold">Scan submitted</h2>
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
          Leave - notify me later
        </button>
      </div>
    </div>
  );
}

function CreateScanForm({
  onScanCreated,
  scanOptions,
  initialRegionKey,
  selectedRegionName,
}) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [scanDetails, setScanDetails] = useState(() =>
    createInitialScanDetails(scanOptions, initialRegionKey),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdScan, setCreatedScan] = useState(null);

  const visibleScanOptions = getVisibleScanOptions(
    scanOptions,
    initialRegionKey,
  );
  const selectedOption = getSelectedScanOption(
    visibleScanOptions,
    scanDetails.scanOptionId,
  );

  useEffect(() => {
    const defaultOptionId = getDefaultOptionId(scanOptions, initialRegionKey);
    const nextVisibleOptions = getVisibleScanOptions(
      scanOptions,
      initialRegionKey,
    );

    setScanDetails((previousDetails) => {
      if (
        previousDetails.scanOptionId &&
        nextVisibleOptions.some(
          (scanOption) => scanOption.id === previousDetails.scanOptionId,
        )
      ) {
        return previousDetails;
      }

      return {
        scanOptionId: defaultOptionId,
      };
    });
  }, [scanOptions, initialRegionKey]);

  async function handleSubmit() {
    if (!selectedOption) {
      setError("Choose a supported scan type before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();

      files.forEach((item) => {
        formData.append("images", item.file);
      });
      formData.append(
        "metadata",
        JSON.stringify({
          bodyPart: selectedOption.bodyPart,
          imageType: selectedOption.imageType,
        }),
      );

      const response = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      if (!json?.data) {
        throw new Error("Invalid server response");
      }

      setCreatedScan(json.data);
      onScanCreated?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    files.forEach((item) => URL.revokeObjectURL(item.preview));
    setFiles([]);
    setScanDetails(createInitialScanDetails(scanOptions, initialRegionKey));
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

        {!visibleScanOptions.length ? (
          <div className="alert alert-warning">
            <FaTimesCircle />
            <span>No supported scan types are available right now.</span>
          </div>
        ) : null}

        {step === 0 && visibleScanOptions.length > 0 && (
          <StepScanType
            scanOptions={visibleScanOptions}
            scanOptionId={scanDetails.scanOptionId}
            selectedRegionName={selectedRegionName}
            onScanDetailsChange={setScanDetails}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && selectedOption && (
          <StepUpload
            files={files}
            selectedOption={selectedOption}
            selectedRegionName={selectedRegionName}
            onFilesChange={setFiles}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && selectedOption && (
          <StepReview
            files={files}
            selectedOption={selectedOption}
            selectedRegionName={selectedRegionName}
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
  scanOptions = [],
  initialRegionKey = "",
  selectedRegionName = "",
}) {
  return (
    <dialog id="create-scan-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 z-10">
            x
          </button>
        </form>
        <div className="min-h-160">
          <CreateScanForm
            onScanCreated={onScanCreated}
            scanOptions={scanOptions}
            initialRegionKey={initialRegionKey}
            selectedRegionName={selectedRegionName}
          />
        </div>
      </div>
    </dialog>
  );
}
