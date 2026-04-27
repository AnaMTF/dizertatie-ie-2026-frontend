import { useCallback, useEffect, useMemo, useState } from "react";
import { redirect } from "react-router";
import CreateAppointment from "../components/appointments/create-appointment";
import UpdateAppointmentModal from "../components/appointments/update-appointment";
import CancelAppointmentModal from "../components/appointments/cancel-appointment";
import { API_BASE, getToken } from "../utils/auth";

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
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

function toDateTime(appointment) {
  if (appointment.dateTime) {
    return new Date(appointment.dateTime);
  }

  if (appointment.date && appointment.timeSlot) {
    return new Date(`${appointment.date}T${appointment.timeSlot}:00`);
  }

  return null;
}

function formatDateTime(appointment) {
  const date = toDateTime(appointment);

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function StatusBadge({ status }) {
  const map = {
    scheduled: { cls: "badge-info", label: "Scheduled" },
    rescheduled: { cls: "badge-warning", label: "Rescheduled" },
    cancelled: { cls: "badge-neutral", label: "Cancelled" },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };

  return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

function TopBar({ onOpenCreateModal, onToggleUpcomingOnly, showUpcomingOnly }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-base-content/50 text-sm">
          Manage and track your medical appointments
        </p>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
        <button
          className={`btn ${showUpcomingOnly ? "btn-secondary" : "btn-outline"}`}
          onClick={onToggleUpcomingOnly}
        >
          {showUpcomingOnly ? "Showing upcoming" : "Filter upcoming"}
        </button>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          Create Appointment
        </button>
      </div>
    </div>
  );
}

function AppointmentsTable({ appointments, loading, error, onUpdate, onCancel }) {
  if (loading) {
    return (
      <div className="card bg-base-100 flex-1 shadow">
        <div className="card-body items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 flex-1 shadow">
        <div className="card-body">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 flex-1 shadow">
      <div className="card-body overflow-auto p-0">
        <table className="table-zebra [&_th]:text-base-content [&_td]:text-base-content table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Doctor</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Clinic</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-base-content/40 text-center">
                  No appointments yet.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.uuid}>
                  <td className="max-w-xs">
                    <p className="truncate">
                      {appointment.notes?.trim() || "Medical consultation"}
                    </p>
                  </td>
                  <td>
                    {appointment.doctor
                      ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                      : "Assigned doctor"}
                  </td>
                  <td>{formatDateTime(appointment)}</td>
                  <td>
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td>{appointment.clinic?.name || "—"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => onUpdate(appointment)}
                        disabled={appointment.status === "cancelled"}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        onClick={() => onCancel(appointment)}
                        disabled={appointment.status === "cancelled"}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar({ appointments }) {
  const now = Date.now();

  const upcoming = appointments.filter((appointment) => {
    const date = toDateTime(appointment);

    if (!date || Number.isNaN(date.getTime())) {
      return false;
    }

    return date.getTime() > now && appointment.status !== "cancelled";
  });

  const nextAppointment = upcoming
    .slice()
    .sort((a, b) => toDateTime(a).getTime() - toDateTime(b).getTime())[0];

  const statusCounts = appointments.reduce(
    (acc, item) => {
      const key = item.status || "scheduled";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { scheduled: 0, rescheduled: 0, cancelled: 0 },
  );

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-88">
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h2 className="card-title text-sm">Next appointment</h2>
          {nextAppointment ? (
            <>
              <p className="text-sm font-medium">
                {nextAppointment.doctor
                  ? `Dr. ${nextAppointment.doctor.lastName}`
                  : "Assigned doctor"}
              </p>
              <p className="text-base-content/60 text-sm">
                {formatDateTime(nextAppointment)}
              </p>
              <StatusBadge status={nextAppointment.status} />
            </>
          ) : (
            <p className="text-base-content/50 text-sm">
              No upcoming appointment.
            </p>
          )}
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h2 className="card-title text-sm">Overview</h2>
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <strong>{appointments.length}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Upcoming</span>
            <strong>{upcoming.length}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Scheduled</span>
            <strong>{statusCounts.scheduled || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Rescheduled</span>
            <strong>{statusCounts.rescheduled || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Cancelled</span>
            <strong>{statusCounts.cancelled || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/appointment`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      setAppointments(json?.data ?? []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const visibleAppointments = useMemo(() => {
    if (!showUpcomingOnly) {
      return appointments;
    }

    const now = Date.now();

    return appointments.filter((appointment) => {
      const date = toDateTime(appointment);

      if (!date || Number.isNaN(date.getTime())) {
        return false;
      }

      return date.getTime() > now && appointment.status !== "cancelled";
    });
  }, [appointments, showUpcomingOnly]);

  function openCreateModal() {
    document.getElementById("create-appointment-modal")?.showModal();
  }

  function openUpdateModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("update-appointment-modal")?.showModal();
  }

  function openCancelModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("cancel-appointment-modal")?.showModal();
  }

  return (
    <div className="flex h-full flex-col gap-4 px-9 pt-6">
      <TopBar
        onOpenCreateModal={openCreateModal}
        onToggleUpcomingOnly={() => setShowUpcomingOnly((prev) => !prev)}
        showUpcomingOnly={showUpcomingOnly}
      />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <AppointmentsTable
          appointments={visibleAppointments}
          loading={loading}
          error={error}
          onUpdate={openUpdateModal}
          onCancel={openCancelModal}
        />
        <Sidebar appointments={appointments} />
      </div>
      <CreateAppointment onCreated={loadAppointments} />
      <UpdateAppointmentModal
        appointment={activeAppointment}
        onUpdated={loadAppointments}
      />
      <CancelAppointmentModal
        appointment={activeAppointment}
        onCancelled={loadAppointments}
      />
    </div>
  );
}
