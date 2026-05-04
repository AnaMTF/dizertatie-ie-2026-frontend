import { useCallback, useEffect, useMemo, useState } from "react";
import { redirect } from "react-router";
import AppointmentAttachments from "../components/appointments/appointment-attachments";
import AppointmentsSidebar from "../components/appointments/appointments-sidebar";
import AppointmentsTopBar from "../components/appointments/appointments-top-bar";
import CancelAppointmentModal from "../components/appointments/cancel-appointment";
import DoctorUpdateAppointmentModal from "../components/appointments/doctor-update-appointment";
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

function toDateTime(appointment) {
  if (appointment.date && appointment.timeSlot) {
    return new Date(`${appointment.date}T${appointment.timeSlot}:00`);
  }

  return null;
}

function formatDateTime(appointment) {
  const date = toDateTime(appointment);

  if (!date || Number.isNaN(date.getTime())) {
    return "-";
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

function formatPatientName(patient) {
  if (!patient) {
    return "-";
  }

  return `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "-";
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

function AppointmentDetailsModal({ appointment }) {
  return (
    <dialog id="doctor-appointment-details-modal" className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold">Appointment details</h3>

        {!appointment ? (
          <p className="text-base-content/60 mt-3 text-sm">
            No appointment selected.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Patient</p>
                <p className="font-semibold">
                  {formatPatientName(appointment.patient)}
                </p>
                <p className="text-base-content/70 text-sm">
                  {appointment.patient?.email || "-"}
                </p>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Clinic</p>
                <p className="font-semibold">
                  {appointment.clinic?.name || "-"}
                </p>
                <p className="text-base-content/70 text-sm">
                  {appointment.clinic?.address || "No clinic address available"}
                </p>
              </div>
            </div>

            <div className="card bg-base-200 sm:col-span-2">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Schedule</p>
                <p className="font-semibold">{formatDateTime(appointment)}</p>
                <div className="mt-2">
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            </div>

            <div className="card bg-base-200 sm:col-span-2">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Notes</p>
                <p className="text-sm whitespace-pre-wrap">
                  {appointment.notes?.trim() ||
                    "No notes for this appointment."}
                </p>
              </div>
            </div>

            {appointment.documents?.length > 0 && (
              <div className="sm:col-span-2">
                <AppointmentAttachments
                  appointmentUuid={appointment.uuid}
                  attachments={appointment.documents}
                  isPatient={false}
                  appointmentStatus={appointment.status}
                />
              </div>
            )}

            {appointment.cancellationReason ? (
              <div className="card bg-base-200 sm:col-span-2">
                <div className="card-body p-4">
                  <p className="text-base-content/60 text-xs">
                    Cancellation reason
                  </p>
                  <p className="text-sm">{appointment.cancellationReason}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <form method="dialog">
            <button className="btn btn-ghost">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

function AppointmentsTable({
  appointments,
  loading,
  error,
  onView,
  onUpdate,
  onCancel,
  onConfirm,
  onComplete,
  actionLoadingUuid,
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
              <th>Patient</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Clinic</th>
              <th className="w-max">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-base-content/40 text-center">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => {
                const isFinalized =
                  appointment.status === "cancelled" ||
                  appointment.status === "completed";
                const canConfirm =
                  appointment.status === "scheduled" ||
                  appointment.status === "rescheduled";
                const canComplete =
                  appointment.status === "confirmed" ||
                  appointment.status === "rescheduled";

                return (
                  <tr key={appointment.uuid}>
                    <td className="max-w-xs">
                      <p className="truncate">
                        {appointment.notes?.trim() || "Medical consultation"}
                      </p>
                    </td>
                    <td>{formatPatientName(appointment.patient)}</td>
                    <td>{formatDateTime(appointment)}</td>
                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td>{appointment.clinic?.name || "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => onView(appointment)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={() => onUpdate(appointment)}
                          disabled={isFinalized}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-success"
                          onClick={() => onConfirm(appointment)}
                          disabled={
                            !canConfirm ||
                            actionLoadingUuid === appointment.uuid
                          }
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-accent"
                          onClick={() => onComplete(appointment)}
                          disabled={
                            !canComplete ||
                            actionLoadingUuid === appointment.uuid
                          }
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-error"
                          onClick={() => onCancel(appointment)}
                          disabled={isFinalized}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [actionLoadingUuid, setActionLoadingUuid] = useState("");

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

  async function updateStatus(appointment, status) {
    try {
      setActionLoadingUuid(appointment.uuid);
      setError("");

      const response = await fetch(
        `${API_BASE}/appointment/${appointment.uuid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      await loadAppointments();
    } catch (requestError) {
      setError(requestError.message || "Failed to update appointment status");
    } finally {
      setActionLoadingUuid("");
    }
  }

  function openDetailsModal(appointment) {
    setDetailsAppointment(appointment);
    document.getElementById("doctor-appointment-details-modal")?.showModal();
  }

  function openUpdateModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("doctor-update-appointment-modal")?.showModal();
  }

  function openCancelModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("cancel-appointment-modal")?.showModal();
  }

  return (
    <div className="flex h-full flex-col gap-4 px-9 pt-6">
      <AppointmentsTopBar
        title="My consultations"
        subtitle="Confirm, complete, update, and cancel your consultations."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showUpcomingOnly={showUpcomingOnly}
        onToggleUpcomingOnly={() => setShowUpcomingOnly((prev) => !prev)}
        onRefresh={loadAppointments}
        refreshing={loading}
      />

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <AppointmentsTable
          appointments={visibleAppointments}
          loading={loading}
          error={error}
          onView={openDetailsModal}
          onUpdate={openUpdateModal}
          onCancel={openCancelModal}
          onConfirm={(appointment) => updateStatus(appointment, "confirmed")}
          onComplete={(appointment) => updateStatus(appointment, "completed")}
          actionLoadingUuid={actionLoadingUuid}
        />
        <AppointmentsSidebar
          appointments={appointments}
          toDateTime={toDateTime}
          formatDateTime={formatDateTime}
          getPrimaryText={(appointment) =>
            formatPatientName(appointment.patient)
          }
          renderStatusBadge={(status) => <StatusBadge status={status} />}
          nextTitle="Next consultation"
          emptyNextText="No upcoming consultation."
        />
      </div>

      <AppointmentDetailsModal appointment={detailsAppointment} />
      <DoctorUpdateAppointmentModal
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
