import { useEffect, useState } from "react";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { Link, redirect, useParams } from "react-router";
import { API_BASE, getToken, getUser } from "../utils/auth";

function formatDate(value) {
  if (!value) {
    return "-";
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

function formatMaybeNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${value}${suffix}`;
}

function formatLifestyle(value) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "-";
}

function formatAlcoholFrequency(value) {
  const labels = {
    never: "Never",
    less_than_monthly: "Less than monthly",
    monthly: "Monthly",
    weekly: "Weekly",
    daily_or_almost_daily: "Daily or almost daily",
  };

  return labels[value] || "-";
}

function InfoRow({ label, value }) {
  return (
    <div className="border-base-300 flex justify-between border-b py-2 last:border-0">
      <span className="text-base-content/60 text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
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

export default function DoctorPatientProfilePage() {
  const { uuid } = useParams();
  const [patient, setPatient] = useState(null);
  const [favoriteClinicName, setFavoriteClinicName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPatient() {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();

        if (!token) {
          throw new Error("You are no longer logged in. Please sign in again.");
        }

        const response = await fetch(`${API_BASE}/patient/${uuid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            json?.error ||
              `Failed to load patient profile (HTTP ${response.status}).`,
          );
        }

        if (!isMounted) {
          return;
        }

        setPatient(json?.data ?? null);

        if (json?.data?.favoriteClinicUuid) {
          try {
            const clinicResponse = await fetch(
              `${API_BASE}/clinic/${json.data.favoriteClinicUuid}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const clinicJson = await clinicResponse.json().catch(() => null);

            if (clinicResponse.ok && isMounted) {
              setFavoriteClinicName(clinicJson?.data?.name || null);
            }
          } catch {
            if (isMounted) {
              setFavoriteClinicName(null);
            }
          }
        } else if (isMounted) {
          setFavoriteClinicName(null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Failed to load patient profile");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      isMounted = false;
    };
  }, [uuid]);

  if (loading) {
    return (
      <div className="px-9 pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
          <Link to="/doctor/appointments" className="btn btn-ghost w-fit gap-2">
            <FaArrowLeft />
            Back to appointments
          </Link>
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="text-primary animate-spin text-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="px-9 pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
          <Link to="/doctor/appointments" className="btn btn-ghost w-fit gap-2">
            <FaArrowLeft />
            Back to appointments
          </Link>
          <div className="alert alert-error">
            <span>{error || "Patient profile not found."}</span>
          </div>
        </div>
      </div>
    );
  }

  const fullName =
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
    "Patient profile";

  return (
    <div className="px-9 pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
        <div className="flex flex-col gap-3">
          <Link to="/doctor/appointments" className="btn btn-ghost w-fit gap-2">
            <FaArrowLeft />
            Back to appointments
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-base-content/50 text-sm">
              Read-only patient profile visible to doctors with an appointment
              relationship.
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
                <InfoRow label="Full name" value={fullName} />
                <InfoRow label="Email" value={patient.email} />
                <InfoRow label="Sex" value={patient.sex} />
                <InfoRow
                  label="Date of birth"
                  value={formatDate(patient.dateOfBirth)}
                />
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Measurements
                </h2>
                <InfoRow
                  label="Height"
                  value={formatMaybeNumber(patient.height, " cm")}
                />
                <InfoRow
                  label="Weight"
                  value={formatMaybeNumber(patient.weight, " kg")}
                />
                <InfoRow
                  label="Favorite clinic"
                  value={
                    favoriteClinicName || patient.favoriteClinicUuid || "-"
                  }
                />
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Medical notes
                </h2>
                <p className="text-sm whitespace-pre-wrap">
                  {patient.additionalMedicalInfo?.trim() ||
                    "No medical notes provided."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Lifestyle
                </h2>
                <InfoRow
                  label="Smoker"
                  value={formatLifestyle(patient.smoker)}
                />
                <InfoRow
                  label="Alcohol"
                  value={formatAlcoholFrequency(
                    patient.alcoholConsumptionFrequency,
                  )}
                />
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                  Profile status
                </h2>
                <p className="text-base-content/70 text-sm">
                  This profile is retrieved through the existing patient
                  authorization checks and is read-only from the doctor view.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
