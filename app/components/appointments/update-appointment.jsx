import { useEffect, useState } from "react";
import { FaFileMedical, FaTrash } from "react-icons/fa";
import { API_BASE, getToken } from "../../utils/auth";
import AppointmentAttachments from "./appointment-attachments";

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
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentAppointment, setCurrentAppointment] = useState(appointment);

  useEffect(() => {
    if (!appointment) {
      setDate("");
      setTimeSlot("");
      setNotes("");
      setDocuments([]);
      setError("");
      setCurrentAppointment(null);
      return;
    }

    setDate(appointment.date || "");
    setTimeSlot(appointment.timeSlot || "");
    setNotes(appointment.notes || "");
    setDocuments([]);
    setError("");
    setCurrentAppointment(appointment);
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

      const response = await fetch(
        `${API_BASE}/appointment/${appointment.uuid}`,
        {
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
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(json?.error));
      }

      // Upload new documents if any
      if (documents.length > 0) {
        const metadata = documents.map((file) => ({
          fileName: file.name,
        }));
        const documentsForm = new FormData();

        documents.forEach((file) => {
          documentsForm.append("documents", file);
        });

        documentsForm.append("metadata", JSON.stringify(metadata));

        const docsResponse = await fetch(
          `${API_BASE}/appointment/${appointment.uuid}/documents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            body: documentsForm,
          },
        );

        const docsJson = await docsResponse.json().catch(() => null);

        if (!docsResponse.ok) {
          throw new Error(extractErrorMessage(docsJson?.error));
        }
      }

      document.getElementById("update-appointment-modal")?.close();
      onUpdated?.();
    } catch (requestError) {
      setError(requestError.message || "Failed to update appointment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAttachmentRemoved(documentUuid) {
    setCurrentAppointment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: (prev.documents || []).filter(
          (doc) => doc.uuid !== documentUuid,
        ),
      };
    });
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setDocuments((prev) => [...prev, ...files]);
    event.target.value = "";
  }

  function removeDocument(index) {
    setDocuments((prev) => prev.filter((_, current) => current !== index));
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

          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <FaFileMedical /> Attach documents
            </span>
            <input
              type="file"
              className="file-input w-full"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {documents.length > 0 && (
              <div className="bg-base-200 rounded-box flex flex-col gap-2 p-3">
                {documents.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="truncate text-sm">{file.name}</p>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => removeDocument(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-base-content/40 text-xs">
              Accepted formats: PDF, JPG, PNG
            </p>
          </label>
        </div>

        {currentAppointment?.documents?.length > 0 && (
          <div className="mt-4">
            <AppointmentAttachments
              appointmentUuid={currentAppointment.uuid}
              attachments={currentAppointment.documents}
              isPatient={true}
              appointmentStatus={currentAppointment.status}
              onRemove={handleAttachmentRemoved}
            />
          </div>
        )}

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
