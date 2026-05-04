const DEFAULT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentsTopBar({
  title,
  subtitle,
  statusFilter,
  onStatusFilterChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  showUpcomingOnly,
  onToggleUpcomingOnly,
  onRefresh,
  refreshing,
  onCreate,
  createLabel = "Create Appointment",
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-base-content/50 text-sm">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onStatusFilterChange ? (
          <select
            className="select select-bordered"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        {onToggleUpcomingOnly ? (
          <button
            className={`btn ${showUpcomingOnly ? "btn-secondary" : "btn-outline"}`}
            onClick={onToggleUpcomingOnly}
          >
            {showUpcomingOnly ? "Showing upcoming" : "Filter upcoming"}
          </button>
        ) : null}

        {onRefresh ? (
          <button
            className="btn btn-primary"
            onClick={onRefresh}
            disabled={Boolean(refreshing)}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        ) : null}

        {onCreate ? (
          <button className="btn btn-primary" onClick={onCreate}>
            {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
