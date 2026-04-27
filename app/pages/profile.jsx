import { useEffect, useState } from "react";
import { FaCalendarPlus, FaRobot, FaUserEdit } from "react-icons/fa";
import { Link, redirect, useLoaderData } from "react-router";
import { API_BASE, getToken, getUser } from "../utils/auth";

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  return { user: getUser() };
}

function getAuthToken() {
  return getToken();
}

function toAppointmentDateTime(appointment) {
  if (appointment.dateTime) {
    return new Date(appointment.dateTime);
  }

  if (appointment.date && appointment.timeSlot) {
    return new Date(`${appointment.date}T${appointment.timeSlot}:00`);
  }

  return null;
}

function InfoRow({ label, value }) {
  return (
    <div className="border-base-300 flex justify-between border-b py-2 last:border-0">
      <span className="text-base-content/60 text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: "badge-warning", label: "Pending" },
    processing: { cls: "badge-info", label: "Processing" },
    completed: { cls: "badge-success", label: "Completed" },
    failed: { cls: "badge-error", label: "Failed" },
    scheduled: { cls: "badge-info", label: "Scheduled" },
    rescheduled: { cls: "badge-warning", label: "Rescheduled" },
    cancelled: { cls: "badge-neutral", label: "Cancelled" },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };
  return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

function RecentScans() {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/scan`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        if (res.ok) setScans((json.data ?? []).slice(0, 3));
      } catch {
        // silently fail — profile should still render
      }
    }
    load();
  }, []);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Recent scans
          </h2>
          {scans.length > 0 && (
            <span className="badge badge-neutral badge-sm">{scans.length}</span>
          )}
        </div>

        {scans.length === 0 ? (
          <p className="text-base-content/40 text-sm">No scans yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {scans.map((scan) => (
              <div
                key={scan.uuid}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-base-content/70 text-xs">
                  {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <StatusBadge status={scan.status} />
              </div>
            ))}
          </div>
        )}

        <Link
          to="/ai-scan"
          className="btn btn-ghost btn-sm mt-2 justify-start px-0"
        >
          View all scans →
        </Link>
      </div>
    </div>
  );
}

function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/appointment`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        if (!res.ok) return;

        const upcoming = (json.data ?? [])
          .filter((appointment) => {
            const date = toAppointmentDateTime(appointment);

            if (!date || Number.isNaN(date.getTime())) {
              return false;
            }

            return (
              date.getTime() > Date.now() && appointment.status !== "cancelled"
            );
          })
          .sort(
            (a, b) =>
              toAppointmentDateTime(a).getTime() -
              toAppointmentDateTime(b).getTime(),
          )
          .slice(0, 3);

        setAppointments(upcoming);
      } catch {
        // silently fail — profile should still render
      }
    }

    load();
  }, []);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Upcoming appointments
          </h2>
          {appointments.length > 0 && (
            <span className="badge badge-neutral badge-sm">
              {appointments.length}
            </span>
          )}
        </div>

        {appointments.length === 0 ? (
          <p className="text-base-content/40 text-sm">
            No upcoming appointments.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.uuid}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-base-content/70 truncate text-xs">
                    {appointment.doctor
                      ? `Dr. ${appointment.doctor.lastName}`
                      : "Assigned doctor"}
                  </p>
                  {(() => {
                    const appointmentDate = toAppointmentDateTime(appointment);

                    if (
                      !appointmentDate ||
                      Number.isNaN(appointmentDate.getTime())
                    ) {
                      return (
                        <p className="text-base-content/50 text-xs">
                          Date unavailable
                        </p>
                      );
                    }

                    return (
                      <p className="text-base-content/50 text-xs">
                        {appointmentDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {appointmentDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    );
                  })()}
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        )}

        <Link
          to="/appointments"
          className="btn btn-ghost btn-sm mt-2 justify-start px-0"
        >
          View all appointments →
        </Link>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useLoaderData();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="px-9 pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-base-content/50 text-sm">
              Keep your personal details and medical notes up to date
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Personal
                </h2>
                <InfoRow label="Name" value={fullName} />
                <InfoRow label="Date of Birth" value={user.dateOfBirth} />
                <InfoRow
                  label="Height"
                  value={user.height ? `${user.height} cm` : null}
                />
                <InfoRow
                  label="Weight"
                  value={user.weight ? `${user.weight} kg` : null}
                />
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Notes for doctor
                </h2>
                <p className="text-base-content/70 text-sm">
                  {user.additionalInfo || "No additional information provided."}
                </p>
              </div>
            </div>

            <div className="card bg-base-200 w-full shadow">
              <div className="card-body p-4">
                <h2 className="text-base-content/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                  Quick actions
                </h2>
                <p className="text-base-content/60 mb-3 text-sm">
                  Jump to the tools you use most often.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Link to="/appointments" className="btn btn-primary w-full">
                    <FaCalendarPlus />
                    Create Appointment
                  </Link>
                  <Link to="/ai-scan" className="btn btn-secondary w-full">
                    <FaRobot />
                    AI Scan
                  </Link>
                  <button className="btn btn-outline w-full">
                    <FaUserEdit />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="card bg-base-200 shadow">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">Appointment insights</h2>
                <p className="text-base-content/60 text-sm">
                  Upcoming appointments and recent scans are synced from backend
                  data.
                </p>
              </div>
            </div>

            <RecentScans />

            <UpcomingAppointments />
          </div>
        </div>
      </div>
    </div>
  );
}
