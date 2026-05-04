const STATUS_COUNT_TEMPLATE = {
  scheduled: 0,
  rescheduled: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
};

export default function AppointmentsSidebar({
  appointments,
  toDateTime,
  formatDateTime,
  getPrimaryText,
  renderStatusBadge,
  nextTitle = "Next appointment",
  emptyNextText = "No upcoming appointment.",
}) {
  const now = Date.now();

  const upcoming = appointments.filter((appointment) => {
    const date = toDateTime(appointment);

    if (!date || Number.isNaN(date.getTime())) {
      return false;
    }

    return date.getTime() > now && appointment.status === "confirmed";
  });

  const nextAppointment = upcoming
    .slice()
    .sort((a, b) => toDateTime(a).getTime() - toDateTime(b).getTime())[0];

  const statusCounts = appointments.reduce((acc, item) => {
    const key = item.status || "scheduled";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { ...STATUS_COUNT_TEMPLATE });

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-88">
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h2 className="card-title text-sm">{nextTitle}</h2>
          {nextAppointment ? (
            <>
              <p className="text-sm font-medium">
                {getPrimaryText(nextAppointment)}
              </p>
              <p className="text-base-content/60 text-sm">
                {formatDateTime(nextAppointment)}
              </p>
              {renderStatusBadge(nextAppointment.status)}
            </>
          ) : (
            <p className="text-base-content/50 text-sm">{emptyNextText}</p>
          )}
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h2 className="card-title text-sm">Overview</h2>
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <strong>{appointments.length}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Upcoming</span>
            <strong>{upcoming.length}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Scheduled</span>
            <strong>{statusCounts.scheduled || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Rescheduled</span>
            <strong>{statusCounts.rescheduled || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Confirmed</span>
            <strong>{statusCounts.confirmed || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Completed</span>
            <strong>{statusCounts.completed || 0}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Cancelled</span>
            <strong>{statusCounts.cancelled || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
