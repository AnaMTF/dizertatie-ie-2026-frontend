import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, redirect, useSearchParams } from "react-router";
import AppointmentAttachments from "../components/appointments/appointment-attachments";
import AppointmentsSidebar from "../components/appointments/appointments-sidebar";
import AppointmentsTopBar from "../components/appointments/appointments-top-bar";
import CancelAppointmentModal from "../components/appointments/cancel-appointment";
import DoctorUpdateAppointmentModal from "../components/appointments/doctor-update-appointment";
import { API_BASE, getToken, getUser } from "../utils/auth";
import { APP_DATA_REFRESH_EVENT } from "../utils/notifications";

const AUTO_REFRESH_INTERVAL_MS = 30000;

const DOCTOR_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "actionRequired", label: "Action required" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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
                {appointment.patient?.uuid ? (
                  <div className="mt-3">
                    <Link
                      to={`/doctor/patients/${appointment.patient.uuid}`}
                      className="btn btn-primary btn-sm"
                    >
                      View patient profile
                    </Link>
                  </div>
                ) : null}
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
                <p className="text-base-content/60 text-xs">Patient notes</p>
                <p className="text-sm whitespace-pre-wrap">
                  {appointment.notes?.trim() ||
                    "No notes for this appointment."}
                </p>
              </div>
            </div>

            <div className="card bg-base-200 sm:col-span-2">
              <div className="card-body p-4">
                <p className="text-base-content/60 text-xs">
                  Consultation result
                </p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-base-content/60 text-xs">Diagnosis</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorDiagnosis?.trim() || "Not provided."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">Prescription</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorPrescription?.trim() ||
                        "Not provided."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">
                      Follow-up recommendation
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.doctorFollowUpRecommendation?.trim() ||
                        "Not provided."}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 text-xs">
                      Follow-up date
                    </p>
                    <p className="text-sm">
                      {appointment.doctorFollowUpDate || "Not set."}
                    </p>
                  </div>
                </div>
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
  onEditResult,
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
                          onClick={() => onEditResult(appointment, true)}
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

function ConsultationsCalendar({ appointments }) {
  const now = new Date();
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const totalCells = 42;

  const appointmentsInCurrentMonth = appointments.filter((appointment) => {
    const date = toDateTime(appointment);
    return (
      date &&
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month
    );
  });

  const dayAppointmentsMap = appointmentsInCurrentMonth.reduce(
    (acc, appointment) => {
      const date = toDateTime(appointment);
      const day = date.getDate();

      if (!acc[day]) {
        acc[day] = [];
      }

      acc[day].push(appointment);
      return acc;
    },
    {},
  );

  const defaultSelectedDay =
    year === now.getFullYear() && month === now.getMonth() ? now.getDate() : 1;
  const [selectedDay, setSelectedDay] = useState(defaultSelectedDay);

  useEffect(() => {
    setSelectedDay(defaultSelectedDay);
  }, [defaultSelectedDay]);

  const safeSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDayAppointments = dayAppointmentsMap[safeSelectedDay] || [];

  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dateNumber = index - firstWeekday + 1;

    if (dateNumber <= 0) {
      return {
        key: `prev-${index}`,
        inMonth: false,
        dateNumber: daysInPreviousMonth + dateNumber,
      };
    }

    if (dateNumber > daysInMonth) {
      return {
        key: `next-${index}`,
        inMonth: false,
        dateNumber: dateNumber - daysInMonth,
      };
    }

    return {
      key: `current-${dateNumber}`,
      inMonth: true,
      dateNumber,
      dotCount: dayAppointmentsMap[dateNumber]?.length || 0,
      isSelected: dateNumber === safeSelectedDay,
    };
  });

  const monthLabel = displayedMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const highlightedAppointment = selectedDayAppointments
    .filter((appointment) => appointment.status !== "cancelled")
    .sort((a, b) => toDateTime(a).getTime() - toDateTime(b).getTime())[0];

  function showPreviousMonth() {
    setDisplayedMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function showNextMonth() {
    setDisplayedMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  return (
    <div className="card bg-base-100 border-base-200 border shadow">
      <div className="card-body p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-base-content/60 text-xs">Calendar</p>
            <h3 className="text-base font-semibold capitalize">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={showPreviousMonth}
              aria-label="Show previous month"
            >
              &lt;
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={showNextMonth}
              aria-label="Show next month"
            >
              &gt;
            </button>
            <span className="badge badge-outline">
              {appointmentsInCurrentMonth.length} consultations
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {weekdays.map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-base-content/50 py-1 text-xs font-semibold"
            >
              {day}
            </div>
          ))}

          {calendarCells.map((cell) => (
            <button
              type="button"
              key={cell.key}
              disabled={!cell.inMonth}
              onClick={() => cell.inMonth && setSelectedDay(cell.dateNumber)}
              className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-medium ${
                cell.inMonth
                  ? "bg-base-200 text-base-content"
                  : "text-base-content/35"
              } ${
                cell.isSelected ? "bg-primary text-primary-content" : ""
              } ${cell.inMonth ? "cursor-pointer" : "cursor-default"}`}
            >
              {cell.dateNumber}
              {cell.inMonth && cell.dotCount > 0 ? (
                <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {Array.from({ length: cell.dotCount }, (_, index) => (
                    <span
                      key={`${cell.key}-dot-${index}`}
                      className={`h-1.5 w-1.5 rounded-full ${
                        cell.isSelected ? "bg-primary-content" : "bg-primary"
                      }`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="bg-primary/10 mt-5 rounded-xl p-4">
          <p className="text-primary text-xs font-semibold">Selected day</p>
          <p className="mt-1 font-semibold">
            {new Date(year, month, safeSelectedDay).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              },
            )}
          </p>
          <p className="text-base-content/70 mt-1 text-sm">
            {highlightedAppointment
              ? selectedDayAppointments.length === 1
                ? `1 consultation at ${toDateTime(
                    highlightedAppointment,
                  ).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : `${selectedDayAppointments.length} consultations, earliest at ${toDateTime(
                    highlightedAppointment,
                  ).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
              : "No consultations for the selected day."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(
    searchParams.get("upcoming") === "true",
  );
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [shouldCompleteAppointment, setShouldCompleteAppointment] =
    useState(false);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [actionLoadingUuid, setActionLoadingUuid] = useState("");
  const requestInFlightRef = useRef(false);

  const loadAppointments = useCallback(async ({ silent = false } = {}) => {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;

    try {
      if (!silent) {
        setLoading(true);
      }
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
      requestInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function refreshSilently() {
      void loadAppointments({ silent: true });
    }

    function handleFocus() {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    }

    function handleDataRefreshEvent() {
      refreshSilently();
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshSilently();
    }, AUTO_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(APP_DATA_REFRESH_EVENT, handleDataRefreshEvent);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        APP_DATA_REFRESH_EVENT,
        handleDataRefreshEvent,
      );
    };
  }, [loadAppointments]);

  useEffect(() => {
    const appointmentUuid = searchParams.get("appointment");

    if (!appointmentUuid || loading) {
      return;
    }

    const appointment = appointments.find(
      (item) => item.uuid === appointmentUuid,
    );

    if (!appointment) {
      return;
    }

    openDetailsModal(appointment);

    setSearchParams((previous) => {
      const next = Object.fromEntries(previous);
      delete next.appointment;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, loading, searchParams, setSearchParams]);

  const visibleAppointments = useMemo(() => {
    const now = Date.now();

    return appointments.filter((appointment) => {
      // Handle status filtering
      if (statusFilter !== "all") {
        if (statusFilter === "actionRequired") {
          // Show scheduled and rescheduled appointments
          if (
            appointment.status !== "scheduled" &&
            appointment.status !== "rescheduled"
          ) {
            return false;
          }
        } else if (appointment.status !== statusFilter) {
          return false;
        }
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

  function openUpdateModal(appointment, forCompletion = false) {
    setActiveAppointment(appointment);
    setShouldCompleteAppointment(forCompletion);
    document.getElementById("doctor-update-appointment-modal")?.showModal();
  }

  function openCancelModal(appointment) {
    setActiveAppointment(appointment);
    document.getElementById("cancel-appointment-modal")?.showModal();
  }

  function handleStatusFilterChange(newStatus) {
    setStatusFilter(newStatus);
    setSearchParams((previous) => {
      const next = Object.fromEntries(previous);

      if (newStatus === "all") {
        delete next.status;
      } else {
        next.status = newStatus;
      }

      return next;
    });
  }

  function handleToggleUpcomingOnly() {
    const newValue = !showUpcomingOnly;
    setShowUpcomingOnly(newValue);
    if (newValue) {
      setSearchParams((prev) => ({
        ...Object.fromEntries(prev),
        upcoming: "true",
      }));
    } else {
      setSearchParams((prev) => {
        const newParams = Object.fromEntries(prev);
        delete newParams.upcoming;
        return newParams;
      });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 px-9 pt-6">
      <AppointmentsTopBar
        title="My consultations"
        subtitle="Confirm, complete, cancel, and manage consultation results."
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        statusOptions={DOCTOR_STATUS_OPTIONS}
        showUpcomingOnly={showUpcomingOnly}
        onToggleUpcomingOnly={handleToggleUpcomingOnly}
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
          onEditResult={openUpdateModal}
          onCancel={openCancelModal}
          onConfirm={(appointment) => updateStatus(appointment, "confirmed")}
          onComplete={(appointment) => updateStatus(appointment, "completed")}
          actionLoadingUuid={actionLoadingUuid}
        />
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-88">
          <ConsultationsCalendar appointments={visibleAppointments} />
          <AppointmentsSidebar
            appointments={appointments}
            toDateTime={toDateTime}
            formatDateTime={formatDateTime}
            getPrimaryText={(appointment) =>
              formatPatientName(appointment.patient)
            }
            getSecondaryText={(appointment) =>
              appointment.doctor?.specialization || "Specialization unavailable"
            }
            getTertiaryText={(appointment) =>
              appointment.clinic?.name || "Clinic unavailable"
            }
            renderStatusBadge={(status) => <StatusBadge status={status} />}
            nextTitle="Next consultation"
            emptyNextText="No upcoming consultation."
          />
        </div>
      </div>

      <AppointmentDetailsModal appointment={detailsAppointment} />
      <DoctorUpdateAppointmentModal
        appointment={activeAppointment}
        onUpdated={loadAppointments}
        shouldComplete={shouldCompleteAppointment}
      />
      <CancelAppointmentModal
        appointment={activeAppointment}
        onCancelled={loadAppointments}
      />
    </div>
  );
}
