import { useEffect, useState } from "react";
import { API_BASE, getToken } from "../../utils/auth";

function extractErrorMessage(error) {
  if (Array.isArray(error)) {
    return error[0]?.message || "Request validation failed";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}

export default function DoctorUpdateAppointmentModal({
  appointment,
  onUpdated,
  shouldComplete = false,
}) {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [followUpRecommendation, setFollowUpRecommendation] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointment) {
      setDiagnosis("");
      setPrescription("");
      setFollowUpRecommendation("");
      setFollowUpDate("");
      setError("");
      return;
    }

    setDiagnosis(appointment.doctorDiagnosis || "");
    setPrescription(appointment.doctorPrescription || "");
    setFollowUpRecommendation(
      appointment.followUpReminder?.doctorFollowUpRecommendation || "",
    );
    setFollowUpDate(appointment.followUpReminder?.doctorFollowUpDate || "");
    setError("");
  }, [appointment]);

  async function handleUpdate(completeAppointment = false) {
    if (!appointment?.uuid) {
      return;
    }

    if (
      !diagnosis.trim() ||
      !prescription.trim() ||
      !followUpRecommendation.trim()
    ) {
      setError(
        "Diagnosis, prescription, and follow-up recommendation are required.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        doctorDiagnosis: diagnosis.trim(),
        doctorPrescription: prescription.trim(),
        doctorFollowUpRecommendation: followUpRecommendation.trim(),
        doctorFollowUpDate: followUpDate || null,
      };

      if (completeAppointment) {
        payload.status = "completed";
      }

      const response = await fetch(
        `${API_BASE}/appointment/${appointment.uuid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      document.getElementById("doctor-update-appointment-modal")?.close();
      onUpdated?.();
    } catch (requestError) {
      setError(requestError.message || "Failed to save consultation results");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog id="doctor-update-appointment-modal" className="modal">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">Consultation result</h3>
        <p className="text-base-content/60 mt-1 text-sm">
          Save your diagnosis, prescription, and follow-up recommendation.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Diagnosis</span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Write the clinical diagnosis"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Prescription</span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={5}
              value={prescription}
              onChange={(event) => setPrescription(event.target.value)}
              placeholder="Add medications, dosage, and treatment instructions"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Follow-up recommendation
            </span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              value={followUpRecommendation}
              onChange={(event) =>
                setFollowUpRecommendation(event.target.value)
              }
              placeholder="Describe follow-up steps and consultation needs"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Follow-up date (optional)
            </span>
            <input
              type="date"
              className="input input-bordered w-full"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <form method="dialog" className="flex-1">
            <button className="btn btn-ghost w-full">Close</button>
          </form>
          {shouldComplete ? (
            <button
              type="button"
              className="btn btn-accent flex-1"
              onClick={() => handleUpdate(true)}
              disabled={submitting}
            >
              {submitting ? "Completing..." : "Complete"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => handleUpdate(false)}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save result"}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
