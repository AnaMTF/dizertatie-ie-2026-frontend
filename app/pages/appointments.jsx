import { useCallback, useEffect, useMemo, useState } from "react";
import { redirect, useSearchParams } from "react-router";
import AppointmentAttachments from "../components/appointments/appointment-attachments";
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

function formatDoctorName(doctor) {
  if (!doctor) {
    return "Assigned doctor";
  }

  return `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
}

function AppointmentDetailsModal({ appointment, onBookFollowUp }) {
  return (
    <dialog id="patient-appointment-details-modal" className="modal">
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
                <p className="text-base-content/60 text-xs">Doctor</p>
                <p className="font-semibold">{formatDoctorName(appointment.doctor)}</p>
                <p className="text-base-content/70 text-sm">
                  {appointment.doctor?.specialization || "-"}
                </p>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Clinic</p>
                <p className="font-semibold">{appointment.clinic?.name || "-"}</p>
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
                <p className="text-base-content/60 text-xs">Your notes</p>
                <p className="text-sm whitespace-pre-wrap">
                  {appointment.notes?.trim() || "No notes for this appointment."}
                </p>
              </div>
            </div>

            <div className="card bg-base-200 sm:col-span-2">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">Consultation result</p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-base-content/60 text-xs">Diagnosis</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorDiagnosis?.trim() || "Not available yet."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">Prescription</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorPrescription?.trim() ||
                        "Not available yet."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">
                      Follow-up recommendation
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorFollowUpRecommendation?.trim() ||
                        "Not available yet."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">Follow-up date</p>
                    <p className="text-sm">
                      {appointment.doctorFollowUpDate || "Not set."}
                    </p>
                  </div>
                  {appointment.doctorFollowUpDate && appointment.doctor?.uuid ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onBookFollowUp?.(appointment)}
                    >
                      Book follow-up with same doctor
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {appointment.documents?.length > 0 ? (
              <div className="sm:col-span-2">
                <AppointmentAttachments
                  appointmentUuid={appointment.uuid}
                  attachments={appointment.documents}
                  isPatient={false}
                  appointmentStatus={appointment.status}
                />
              </div>
            ) : null}

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
                        className="btn btn-xs btn-ghost"
                        onClick={() => onView(appointment)}
                      >
                        View
                      </button>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [createAppointmentDraft, setCreateAppointmentDraft] = useState(null);

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

  useEffect(() => {
    if (searchParams.get("create") !== "true") {
      return;
    }

    openCreateModal();

    setSearchParams((previous) => {
      const next = Object.fromEntries(previous);
      delete next.create;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

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

  function openCreateModal(draft = null) {
    setCreateAppointmentDraft(draft);
    document.getElementById("create-appointment-modal")?.showModal();
  }

  function openUpdateModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("update-appointment-modal")?.showModal();
  }

  function openDetailsModal(appointment) {
    setDetailsAppointment(appointment);
    document.getElementById("patient-appointment-details-modal")?.showModal();
  }

  function bookFollowUpWithSameDoctor(appointment) {
    const doctorUuid = appointment.doctor?.uuid;
    const clinicUuid = appointment.clinic?.uuid || appointment.doctor?.clinicUuid;
    const followUpDate = appointment.doctorFollowUpDate;

    if (!doctorUuid || !clinicUuid || !followUpDate) {
      return;
    }

    document.getElementById("patient-appointment-details-modal")?.close();

    openCreateModal({
      seed: Date.now(),
      specialty: appointment.doctor?.specialization || "",
      doctorUuid,
      clinicUuid,
      date: followUpDate,
    });
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
          onView={openDetailsModal}
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
          getSecondaryText={(appointment) =>
            appointment.doctor?.specialization || "Specialization unavailable"
          }
          getTertiaryText={(appointment) =>
            appointment.clinic?.name || "Clinic unavailable"
          }
          renderStatusBadge={(status) => <StatusBadge status={status} />}
          nextTitle="Next appointment"
          emptyNextText="No upcoming appointment."
        />
      </div>
      <CreateAppointment
        onCreated={loadAppointments}
        initialDraft={createAppointmentDraft}
      />
      <UpdateAppointmentModal
        appointment={activeAppointment}
        onUpdated={loadAppointments}
      />
      <AppointmentDetailsModal
        appointment={detailsAppointment}
        onBookFollowUp={bookFollowUpWithSameDoctor}
      />
      <CancelAppointmentModal
        appointment={activeAppointment}
        onCancelled={loadAppointments}
      />
    </div>
  );
}
