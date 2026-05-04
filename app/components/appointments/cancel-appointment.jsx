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

export default function CancelAppointmentModal({ appointment, onCancelled }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReason("");
    setError("");
  }, [appointment]);

  async function handleCancel() {
    if (!appointment?.uuid) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/appointment/${appointment.uuid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status: "cancelled",
            cancellationReason: reason || undefined,
          }),
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      document.getElementById("cancel-appointment-modal")?.close();
      onCancelled?.();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel appointment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog id="cancel-appointment-modal" className="modal">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">Cancel appointment</h3>
        <p className="text-base-content/60 mt-1 text-sm">
          This action will mark the appointment as cancelled.
        </p>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-sm font-medium">
            Cancellation reason (optional)
          </span>
          <textarea
            className="textarea textarea-bordered w-full"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

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
            className="btn btn-error flex-1"
            onClick={handleCancel}
            disabled={submitting}
          >
            {submitting ? "Cancelling..." : "Cancel appointment"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
