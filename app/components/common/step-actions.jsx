import { FaExclamationTriangle } from "react-icons/fa";

export default function StepActions({
  onNext,
  onBack,
  nextLabel = "Continue",
  disabled = false,
  tooltipMessage,
}) {
  return (
    <div className="mt-auto flex gap-2">
      {onBack && (
        <button type="button" className="btn btn-ghost flex-1" onClick={onBack}>
          Back
        </button>
      )}
      <div
        className={["flex-1", disabled && "tooltip tooltip-warning"]
          .filter(Boolean)
          .join(" ")}
      >
        {disabled && tooltipMessage && (
          <div className="tooltip-content flex items-center gap-2">
            <FaExclamationTriangle />
            <strong>{tooltipMessage}</strong>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onNext}
          disabled={disabled}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
