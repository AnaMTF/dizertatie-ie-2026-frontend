import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaRobot, FaSyncAlt } from "react-icons/fa";
import { redirect } from "react-router";
import CreateScan from "../components/scans/create-scan";
import { getToken, getUser } from "../utils/auth";

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "patient") return redirect("/");
  return null;
}

const API_BASE = "http://localhost:9000/api/v1";

function getAuthToken() {
  return getToken();
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

function TopBar({ onNewScan }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Scans</h1>
        <p className="text-base-content/50 text-sm">
          Upload medical images for AI-powered analysis
        </p>
      </div>
      <button className="btn btn-primary" onClick={onNewScan}>
        <FaPlus /> New Scan
      </button>
    </div>
  );
}

function ScansTable({ scans, loading, onRefresh }) {
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
              <th>Body parts</th>
              <th>Status</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-base-content/40 text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && scans.length === 0 && (
              <tr>
                <td colSpan={5} className="text-base-content/40 text-center">
                  No scans yet. Click &ldquo;New Scan&rdquo; to get started.
                </td>
              </tr>
            )}
            {!loading &&
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
                    <div className="flex flex-wrap gap-1">
                      {[
                        ...new Set(
                          scan.images?.map((img) => img.bodyPart) ?? [],
                        ),
                      ].map((bp) => (
                        <span key={bp} className="badge badge-outline badge-sm">
                          {bp}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="max-w-xs">
                    {scan.results ? (
                      <p className="text-base-content/70 truncate text-sm">
                        {scan.results}
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
            <li>You can upload multiple images per scan session.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AiScan() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await res.json();
      if (res.ok) setScans(json.data ?? []);
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

  return (
    <div className="flex h-full flex-col gap-4 px-9 pt-6">
      <TopBar onNewScan={handleNewScan} />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <ScansTable scans={scans} loading={loading} onRefresh={fetchScans} />
        <Sidebar scans={scans} />
      </div>
      <CreateScan onScanCreated={fetchScans} />
    </div>
  );
}
