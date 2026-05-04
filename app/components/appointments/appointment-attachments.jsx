import { useState } from "react";
import {
  FaFile,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaPaperclip,
} from "react-icons/fa";
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

function getFileIcon(mimeType) {
  if (!mimeType) return <FaFile className="text-base-content/60" />;
  if (mimeType.startsWith("image/"))
    return <FaFileImage className="text-blue-500" />;
  if (mimeType.includes("pdf")) return <FaFilePdf className="text-red-500" />;
  if (mimeType.includes("word"))
    return <FaFileWord className="text-blue-600" />;
  return <FaPaperclip className="text-base-content/60" />;
}

export default function AppointmentAttachments({
  appointmentUuid,
  attachments = [],
  isPatient = false,
  appointmentStatus,
  onRemove,
}) {
  const [removingUuid, setRemovingUuid] = useState(null);
  const [error, setError] = useState("");
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState(null);

  const canRemove =
    isPatient &&
    appointmentStatus !== "confirmed" &&
    appointmentStatus !== "completed";

  async function handleRemove(documentUuid) {
    try {
      setError("");
      setRemovingUuid(documentUuid);

      const response = await fetch(
        `${API_BASE}/appointment/${appointmentUuid}/documents/${documentUuid}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(extractErrorMessage(json?.error));
      }

      setConfirmDeleteUuid(null);
      onRemove?.(documentUuid);
    } catch (requestError) {
      setError(requestError.message || "Failed to remove attachment");
    } finally {
      setRemovingUuid(null);
    }
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <p className="text-base-content/60 text-xs">Attachments</p>
        <div className="mt-2 flex flex-col gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.uuid}
              className="bg-base-100 flex items-center justify-between gap-2 rounded p-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex items-center text-lg">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <a
                  href={`${API_BASE}/appointment/${appointmentUuid}/documents/${attachment.uuid}`}
                  download={attachment.fileName}
                  className="link link-primary min-w-0 flex-1 truncate text-sm"
                  title={attachment.fileName}
                >
                  {attachment.fileName}
                </a>
              </div>
              {canRemove && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setConfirmDeleteUuid(attachment.uuid)}
                  disabled={removingUuid === attachment.uuid}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mt-3">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {confirmDeleteUuid && (
        <dialog id="remove-attachment-modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Remove attachment?</h3>
            <p className="text-base-content/60 mt-2 text-sm">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => setConfirmDeleteUuid(null)}
              >
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-error flex-1"
                onClick={() => handleRemove(confirmDeleteUuid)}
                disabled={removingUuid === confirmDeleteUuid}
              >
                {removingUuid === confirmDeleteUuid ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
