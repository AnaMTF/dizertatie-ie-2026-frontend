import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaRobot, FaSyncAlt } from "react-icons/fa";
import { redirect } from "react-router";
import CreateScan from "../components/scans/create-scan";
import { API_BASE, getToken, getUser } from "../utils/auth";

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

function formatScanResults(results) {
  if (!results) {
    return "—";
  }

  if (typeof results === "string") {
    return results;
  }

  if (typeof results.summary === "string" && results.summary.trim()) {
    return results.summary;
  }

  const firstEntry = Object.entries(results).find(([, value]) => value != null);

  if (!firstEntry) {
    return "Analysis complete";
  }

  const [key, value] = firstEntry;
  return typeof value === "string"
    ? `${key}: ${value}`
    : `${key}: ${JSON.stringify(value)}`;
}

const ANATOMICAL_REGIONS = [
  {
    id: "eyes",
    name: "Eyes & Vision",
    desc: "Retinal imaging and orbital examinations.",
  },
  {
    id: "brain",
    name: "Brain & Nervous System",
    desc: "Neurological scans and MRI.",
  },
  {
    id: "lungs",
    name: "Lungs & Respiratory",
    desc: "Chest X-rays and pulmonary scans.",
  },
  {
    id: "heart",
    name: "Heart & Cardiovascular",
    desc: "Echocardiograms and cardiac MRI.",
  },
  {
    id: "liver",
    name: "Liver & Gallbladder",
    desc: "Hepatic ultrasound and CT.",
  },
  {
    id: "stomach",
    name: "Stomach & Spleen",
    desc: "Upper GI endoscopy and imaging.",
  },
  {
    id: "intestines",
    name: "Intestines & Bowel",
    desc: "Lower GI and abdominal scans.",
  },
  {
    id: "kidneys",
    name: "Kidneys & Urinary",
    desc: "Renal ultrasound and urinary imaging.",
  },
  {
    id: "pelvis",
    name: "Pelvic & Reproductive",
    desc: "Pelvic, uterine, and prostate exams.",
  },
];

const REGION_BODY_PART_MAP = {
  eyes: "Eyes",
  brain: "Head / Brain",
  lungs: "Chest",
  heart: "Chest",
  liver: "Abdomen",
  stomach: "Abdomen",
  intestines: "Abdomen",
  kidneys: "Abdomen",
  pelvis: "Pelvis",
};

function getAuthToken() {
  return getToken();
}

function InteractiveAnatomyMap({ selectedOrgan, onSelectOrgan }) {
  const [hoveredOrgan, setHoveredOrgan] = useState(null);

  function getOrganStyle(id) {
    const isSelected = selectedOrgan === id;
    const isHovered = hoveredOrgan === id;

    if (isSelected) {
      return "fill-primary stroke-primary cursor-pointer transition-all duration-300";
    }

    if (isHovered) {
      return "fill-secondary stroke-secondary cursor-pointer transition-all duration-200";
    }

    return "fill-base-300 stroke-base-content/20 cursor-pointer transition-all duration-300 hover:fill-base-content/30";
  }

  return (
    <div className="card bg-base-100 border-base-200 border shadow-sm">
      <div className="card-body gap-6 p-5 lg:flex-row">
        <div className="bg-base-200/60 border-base-300 rounded-box flex w-full items-center justify-center border p-4 lg:w-1/2">
          <svg
            viewBox="0 0 400 800"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto max-h-136 w-full"
          >
            <path
              d="M 200 20 C 170 20 150 50 150 90 C 150 110 160 120 170 130 C 130 140 90 160 80 200 C 60 280 60 400 60 400 L 90 400 C 90 400 100 250 120 200 C 120 300 110 450 110 450 C 120 600 130 750 130 750 L 180 750 L 190 480 L 210 480 L 220 750 L 270 750 C 270 750 280 600 290 450 C 290 450 280 300 280 200 C 300 250 310 400 310 400 L 340 400 C 340 400 340 280 320 200 C 310 160 270 140 230 130 C 240 120 250 110 250 90 C 250 50 230 20 200 20 Z"
              className="fill-base-100 stroke-base-300 stroke-[3px]"
            />

            <g>
              <path
                d="M 160 60 C 160 30 240 30 240 60 C 240 85 160 85 160 60 Z"
                className={getOrganStyle("brain")}
                onClick={() => onSelectOrgan("brain")}
                onMouseEnter={() => setHoveredOrgan("brain")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />

              <g
                className={getOrganStyle("eyes")}
                onClick={() => onSelectOrgan("eyes")}
                onMouseEnter={() => setHoveredOrgan("eyes")}
                onMouseLeave={() => setHoveredOrgan(null)}
              >
                <ellipse cx="178" cy="60" rx="14" ry="7" />
                <ellipse cx="222" cy="60" rx="14" ry="7" />
              </g>

              <g
                className={getOrganStyle("lungs")}
                onClick={() => onSelectOrgan("lungs")}
                onMouseEnter={() => setHoveredOrgan("lungs")}
                onMouseLeave={() => setHoveredOrgan(null)}
              >
                <path d="M 140 160 C 120 200 130 250 160 260 C 180 260 170 180 160 160 Z" />
                <path d="M 260 160 C 280 200 270 250 240 260 C 220 260 230 180 240 160 Z" />
              </g>

              <path
                d="M 185 190 C 185 190 170 210 185 230 C 210 240 220 210 200 190 C 190 180 185 190 185 190 Z"
                className={getOrganStyle("heart")}
                onClick={() => onSelectOrgan("heart")}
                onMouseEnter={() => setHoveredOrgan("heart")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />

              <path
                d="M 140 270 C 140 250 220 260 240 290 C 240 310 170 300 140 270 Z"
                className={getOrganStyle("liver")}
                onClick={() => onSelectOrgan("liver")}
                onMouseEnter={() => setHoveredOrgan("liver")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />

              <path
                d="M 210 270 C 240 270 260 290 250 310 C 230 320 200 300 210 270 Z"
                className={getOrganStyle("stomach")}
                onClick={() => onSelectOrgan("stomach")}
                onMouseEnter={() => setHoveredOrgan("stomach")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />

              <g
                className={getOrganStyle("kidneys")}
                onClick={() => onSelectOrgan("kidneys")}
                onMouseEnter={() => setHoveredOrgan("kidneys")}
                onMouseLeave={() => setHoveredOrgan(null)}
              >
                <ellipse cx="160" cy="310" rx="15" ry="25" />
                <ellipse cx="240" cy="310" rx="15" ry="25" />
              </g>

              <path
                d="M 140 330 C 130 380 270 380 260 330 C 250 360 150 360 140 330 Z"
                className={getOrganStyle("intestines")}
                onClick={() => onSelectOrgan("intestines")}
                onMouseEnter={() => setHoveredOrgan("intestines")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />

              <path
                d="M 160 390 C 160 370 240 370 240 390 C 220 420 180 420 160 390 Z"
                className={getOrganStyle("pelvis")}
                onClick={() => onSelectOrgan("pelvis")}
                onMouseEnter={() => setHoveredOrgan("pelvis")}
                onMouseLeave={() => setHoveredOrgan(null)}
              />
            </g>
          </svg>
        </div>

        <div className="flex w-full flex-col justify-center gap-3 lg:w-1/2">
          <div>
            <h2 className="text-xl font-bold">Select target region</h2>
            <p className="text-base-content/60 text-sm">
              Choose the anatomical area first so the upload flow starts with a
              sensible category.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {ANATOMICAL_REGIONS.map((region) => {
              const isSelected = selectedOrgan === region.id;
              const isHovered = hoveredOrgan === region.id;

              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => onSelectOrgan(region.id)}
                  onMouseEnter={() => setHoveredOrgan(region.id)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                  className={[
                    "rounded-box flex items-center justify-between border p-4 text-left transition",
                    isSelected &&
                      "border-primary bg-primary text-primary-content shadow-sm",
                    !isSelected && isHovered && "border-secondary bg-base-200",
                    !isSelected &&
                      !isHovered &&
                      "border-base-300 hover:border-base-content/30 bg-transparent",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>
                    <span className="block font-semibold">{region.name}</span>
                    <span
                      className={[
                        "block text-sm",
                        isSelected
                          ? "text-primary-content/80"
                          : "text-base-content/60",
                      ].join(" ")}
                    >
                      {region.desc}
                    </span>
                  </span>
                  <span
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      isSelected ? "border-primary-content" : "border-base-300",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <span className="bg-primary-content h-2.5 w-2.5 rounded-full" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
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

function ScanConfigurator({ selectedOrgan, onSelectOrgan, onStartScan }) {
  const selectedRegion = ANATOMICAL_REGIONS.find(
    (region) => region.id === selectedOrgan,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
      <InteractiveAnatomyMap
        selectedOrgan={selectedOrgan}
        onSelectOrgan={onSelectOrgan}
      />

      <div className="card bg-base-100 border-base-200 border shadow-sm">
        <div className="card-body gap-5 p-6">
          <div>
            <h2 className="text-xl font-bold">Configure AI analysis</h2>
            <p className="text-base-content/60 text-sm">
              Start with a target region, then upload one or more medical images
              for AI-assisted review.
            </p>
          </div>

          <div className="stats stats-vertical bg-base-200 w-full shadow-none">
            <div className="stat px-4 py-3">
              <div className="stat-title">Target region</div>
              <div className="stat-value text-lg">
                {selectedRegion?.name || "Choose a region"}
              </div>
              <div className="stat-desc">
                {selectedRegion?.desc ||
                  "The upload wizard can still be opened without a preset."}
              </div>
            </div>
            <div className="stat px-4 py-3">
              <div className="stat-title">Upload support</div>
              <div className="stat-value text-lg">Up to 4 images</div>
              <div className="stat-desc">
                Every image in one scan shares the same body area and image
                type.
              </div>
            </div>
          </div>

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
          >
            <FaPlus />
            {selectedRegion
              ? `Upload ${selectedRegion.name} scan`
              : "Upload scan images"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScansTable({ scans, loading, error, onRefresh }) {
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
              <th>Body area</th>
              <th>Image type</th>
              <th>Status</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {!loading && error && (
              <tr>
                <td colSpan={6} className="text-error px-4 py-6 text-center">
                  {error}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="text-base-content/40 text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && !error && scans.length === 0 && (
              <tr>
                <td colSpan={6} className="text-base-content/40 text-center">
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
                  <td className="max-w-xs">
                    {scan.results ? (
                      <p className="text-base-content/70 truncate text-sm">
                        {formatScanResults(scan.results)}
                      </p>
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
              <span className="font-semibold">{total}</span>
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
            <li>
              Each scan can include multiple files under one shared category.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AiScan() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState("");

  const fetchScans = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  function handleNewScan() {
    document.getElementById("create-scan-modal").showModal();
  }

  const selectedRegion = ANATOMICAL_REGIONS.find(
    (region) => region.id === selectedOrgan,
  );

  return (
    <div className="flex h-full flex-col gap-6 px-6 py-6 lg:px-9">
      <TopBar />
      <ScanConfigurator
        selectedOrgan={selectedOrgan}
        onSelectOrgan={setSelectedOrgan}
        onStartScan={handleNewScan}
      />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <ScansTable
          scans={scans}
          loading={loading}
          error={error}
          onRefresh={fetchScans}
        />
        <Sidebar scans={scans} />
      </div>
      <CreateScan
        onScanCreated={fetchScans}
        initialBodyPart={REGION_BODY_PART_MAP[selectedOrgan] || ""}
        selectedRegionName={selectedRegion?.name || ""}
      />
    </div>
  );
}
