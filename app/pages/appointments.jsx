import { useCallback, useEffect, useMemo, useState } from "react";
import { redirect } from "react-router";
import AppointmentsSidebar from "../components/appointments/appointments-sidebar";
import AppointmentsTopBar from "../components/appointments/appointments-top-bar";
import CancelAppointmentModal from "../components/appointments/cancel-appointment";
import CreateAppointment from "../components/appointments/create-appointment";
import UpdateAppointmentModal from "../components/appointments/update-appointment";
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
    confirmed: { cls: "badge-primary", label: "Confirmed" },
    rescheduled: { cls: "badge-warning", label: "Rescheduled" },
    completed: { cls: "badge-success", label: "Completed" },
    cancelled: { cls: "badge-neutral", label: "Cancelled" },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };

  return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

function AppointmentsTable({
  appointments,
  loading,
  error,
  onUpdate,
  onCancel,
}) {
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
                        disabled={
                          appointment.status === "cancelled" ||
                          appointment.status === "completed"
                        }
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        onClick={() => onCancel(appointment)}
                        disabled={
                          appointment.status === "cancelled" ||
                          appointment.status === "completed"
                        }
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

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    const now = Date.now();

    return appointments.filter((appointment) => {
      if (statusFilter !== "all" && appointment.status !== statusFilter) {
        return false;
      }

      if (!showUpcomingOnly) {
        return true;
      }

      const date = toDateTime(appointment);

      if (!date || Number.isNaN(date.getTime())) {
        return false;
      }

      return date.getTime() > now && appointment.status !== "cancelled";
    });
  }, [appointments, showUpcomingOnly, statusFilter]);

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
      <AppointmentsTopBar
        title="Appointments"
        subtitle="Manage and track your medical appointments"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onToggleUpcomingOnly={() => setShowUpcomingOnly((prev) => !prev)}
        showUpcomingOnly={showUpcomingOnly}
        onRefresh={loadAppointments}
        refreshing={loading}
        onCreate={openCreateModal}
        createLabel="Create Appointment"
      />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <AppointmentsTable
          appointments={visibleAppointments}
          loading={loading}
          error={error}
          onUpdate={openUpdateModal}
          onCancel={openCancelModal}
        />
        <AppointmentsSidebar
          appointments={appointments}
          toDateTime={toDateTime}
          formatDateTime={formatDateTime}
          getPrimaryText={(appointment) =>
            appointment.doctor
              ? `Dr. ${appointment.doctor.lastName}`
              : "Assigned doctor"
          }
          renderStatusBadge={(status) => <StatusBadge status={status} />}
          nextTitle="Next appointment"
          emptyNextText="No upcoming appointment."
        />
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
