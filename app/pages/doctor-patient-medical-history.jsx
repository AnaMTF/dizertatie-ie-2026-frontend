import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaRegClock, FaSpinner } from "react-icons/fa";
import { Link, redirect, useSearchParams } from "react-router";
import AppointmentAttachments from "../components/appointments/appointment-attachments";
import { API_BASE, getToken, getUser } from "../utils/auth";

function extractErrorMessage(error) {
  if (Array.isArray(error)) {
    return error[0]?.message || "Request validation failed";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}

function formatDateTime(appointment) {
  if (!appointment?.date || !appointment?.timeSlot) {
    return "-";
  }

  const date = new Date(`${appointment.date}T${appointment.timeSlot}:00`);

  if (Number.isNaN(date.getTime())) {
    return `${appointment.date} ${appointment.timeSlot}`;
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

function formatDateLabel(value) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PatientSummary({ patient, appointmentsCount }) {
  const fullName =
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
    "Patient";

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-4">
        <p className="text-base-content/60 text-xs tracking-widest uppercase">
          Medical history
        </p>
        <h1 className="text-xl font-bold">{fullName}</h1>
        <p className="text-base-content/70 text-sm">{patient?.email || "-"}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="bg-base-100 rounded-box p-3">
            <p className="text-base-content/60 text-xs">
              Completed consultations
            </p>
            <p className="text-lg font-semibold">{appointmentsCount}</p>
          </div>
          <div className="bg-base-100 rounded-box p-3">
            <p className="text-base-content/60 text-xs">Date of birth</p>
            <p className="text-sm font-semibold">
              {formatDateLabel(patient?.dateOfBirth)}
            </p>
          </div>
          <div className="bg-base-100 rounded-box p-3">
            <p className="text-base-content/60 text-xs">Favorite clinic</p>
            <p className="text-sm font-semibold">
              {patient?.favoriteClinicUuid || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");

  const user = getUser();

  if (user?.role !== "doctor") {
    return redirect("/");
  }

  return null;
}

export default function DoctorPatientMedicalHistoryPage() {
  const [searchParams] = useSearchParams();
  const patientUuid = (searchParams.get("user") || "").trim();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!patientUuid) {
        setError("Missing patient identifier in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error("You are no longer logged in. Please sign in again.");
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [patientResponse, appointmentsResponse] = await Promise.all([
          fetch(`${API_BASE}/patient/${patientUuid}`, { headers }),
          fetch(
            `${API_BASE}/appointment?status=completed&patientUuid=${encodeURIComponent(patientUuid)}`,
            { headers },
          ),
        ]);

        const patientJson = await patientResponse.json().catch(() => null);
        const appointmentsJson = await appointmentsResponse
          .json()
          .catch(() => null);

        if (!patientResponse.ok) {
          throw new Error(extractErrorMessage(patientJson?.error));
        }

        if (!appointmentsResponse.ok) {
          throw new Error(extractErrorMessage(appointmentsJson?.error));
        }

        if (!mounted) {
          return;
        }

        const completedAppointments = (appointmentsJson?.data || []).filter(
          (appointment) => appointment.status === "completed",
        );

        setPatient(patientJson?.data || null);
        setAppointments(completedAppointments);
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || "Failed to load medical history");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [patientUuid]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const first = new Date(`${a.date}T${a.timeSlot || "00:00"}:00`).getTime();
      const second = new Date(
        `${b.date}T${b.timeSlot || "00:00"}:00`,
      ).getTime();
      return second - first;
    });
  }, [appointments]);

  return (
    <div className="px-9 pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/doctor/appointments"
            className="btn btn-ghost btn-sm gap-2"
          >
            <FaArrowLeft />
            Back to appointments
          </Link>

          {patientUuid ? (
            <Link
              to={`/doctor/patients/${patientUuid}`}
              className="btn btn-ghost btn-sm"
            >
              Patient profile
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center justify-center py-16">
              <FaSpinner className="text-primary animate-spin text-3xl" />
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        ) : (
          <>
            <PatientSummary
              patient={patient}
              appointmentsCount={sortedAppointments.length}
            />

            {sortedAppointments.length === 0 ? (
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <p className="text-base-content/70 text-sm">
                    This patient does not have completed consultations yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sortedAppointments.map((appointment) => (
                  <div
                    key={appointment.uuid}
                    className="card bg-base-100 border-base-300 border shadow"
                  >
                    <div className="card-body gap-4 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-base-content/60 text-xs tracking-widest uppercase">
                            Consultation
                          </p>
                          <p className="text-lg font-semibold">
                            {formatDateTime(appointment)}
                          </p>
                        </div>

                        <div className="badge badge-success">Completed</div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="bg-base-200 rounded-box p-3">
                          <p className="text-base-content/60 text-xs">Clinic</p>
                          <p className="text-sm font-medium">
                            {appointment.clinic?.name || "-"}
                          </p>
                        </div>
                        <div className="bg-base-200 rounded-box p-3">
                          <p className="text-base-content/60 text-xs">
                            Follow-up date
                          </p>
                          <p className="text-sm font-medium">
                            {formatDateLabel(
                              appointment.followUpReminder?.doctorFollowUpDate,
                            )}
                          </p>
                        </div>
                        <div className="bg-base-200 rounded-box p-3">
                          <p className="text-base-content/60 text-xs">
                            Results updated
                          </p>
                          <p className="text-sm font-medium">
                            {formatDateLabel(
                              appointment.doctorResultsUpdatedAt,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="bg-base-200 rounded-box p-3">
                          <p className="text-base-content/60 text-xs">
                            Diagnosis
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {appointment.doctorDiagnosis?.trim() ||
                              "Not provided."}
                          </p>
                        </div>

                        <div className="bg-base-200 rounded-box p-3">
                          <p className="text-base-content/60 text-xs">
                            Prescription
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {appointment.doctorPrescription?.trim() ||
                              "Not provided."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-base-200 rounded-box p-3">
                        <p className="text-base-content/60 text-xs">
                          Follow-up recommendation
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {appointment.followUpReminder?.doctorFollowUpRecommendation?.trim() ||
                            "Not provided."}
                        </p>
                      </div>

                      <div className="text-base-content/60 flex items-center gap-2 text-xs">
                        <FaRegClock />
                        Consultation UUID: {appointment.uuid}
                      </div>

                      {appointment.documents?.length > 0 ? (
                        <AppointmentAttachments
                          appointmentUuid={appointment.uuid}
                          attachments={appointment.documents}
                          isPatient={false}
                          appointmentStatus={appointment.status}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
