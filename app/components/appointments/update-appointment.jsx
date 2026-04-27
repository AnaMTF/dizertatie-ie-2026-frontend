import { useEffect, useState } from "react";
import { API_BASE, getToken } from "../../utils/auth";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

function extractErrorMessage(error) {
  if (Array.isArray(error)) {
    return error[0]?.message || "Request validation failed";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}

export default function UpdateAppointmentModal({ appointment, onUpdated }) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointment) {
      setDate("");
      setTimeSlot("");
      setNotes("");
      setError("");
      return;
    }

    setDate(appointment.date || "");
    setTimeSlot(appointment.timeSlot || "");
    setNotes(appointment.notes || "");
    setError("");
  }, [appointment]);

  async function handleUpdate() {
    if (!appointment?.uuid) {
      return;
    }

    if (!date || !timeSlot) {
      setError("Choose date and time slot.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(`${API_BASE}/appointment/${appointment.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          date,
          timeSlot,
          status: "rescheduled",
          notes: notes || undefined,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      document.getElementById("update-appointment-modal")?.close();
      onUpdated?.();
    } catch (requestError) {
      setError(requestError.message || "Failed to update appointment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog id="update-appointment-modal" className="modal">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">Update appointment</h3>
        <p className="text-base-content/60 mt-1 text-sm">
          Choose a new date and slot for this appointment.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Date</span>
            <input
              type="date"
              className="input input-bordered w-full"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Time slot</span>
            <select
              className="select select-bordered w-full"
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value)}
            >
              <option value="">Select time slot</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              className="textarea textarea-bordered w-full"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={handleUpdate}
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
