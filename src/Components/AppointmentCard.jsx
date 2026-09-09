import {
  CalendarDays,
  ChevronRight,
  Clock3,
} from "lucide-react";

function AppointmentCard({
  appointment,
  status,
  onSelect,
  onEdit,
  onCancel,
}) {
  const isUpcoming = status === "UPCOMING";

  return (
    <article
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)] shadow-[var(--shadow-level-1)] ${
        isUpcoming ? "pl-1" : ""
      }`}
    >
      {/* Primary signal accent */}
      {isUpcoming && (
        <div
          className="absolute inset-y-0 left-0 w-1 bg-[var(--color-primary)]"
          aria-hidden="true"
        />
      )}

      <div className="p-6 sm:p-7">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mediform-mono-label">
              {status}
            </p>

            <h3 className="mt-2 font-[var(--font-brand)] text-xl font-semibold leading-tight text-[var(--color-ink)]">
              {appointment.doctorName}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              {appointment.reason}
            </p>
          </div>

          <span className="shrink-0 font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
            ID: {appointment.id}
          </span>
        </div>

        {/* Date and time */}
        <div className="mt-6 grid gap-5 border-t border-[rgba(14,22,38,0.08)] pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays
              size={18}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-[var(--color-muted)]"
              aria-hidden="true"
            />

            <div>
              <p className="mediform-mono-label">
                Date
              </p>

              <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
                {appointment.date}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock3
              size={18}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-[var(--color-muted)]"
              aria-hidden="true"
            />

            <div>
              <p className="mediform-mono-label">
                Time
              </p>

              <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
                {appointment.time}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[rgba(14,22,38,0.08)] pt-5">
          <button
            type="button"
            onClick={() => onSelect(appointment)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            View Details
            <ChevronRight
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onEdit(appointment)}
            className="rounded-[var(--radius-input)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[rgba(14,22,38,0.04)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onCancel(appointment)}
            className="rounded-[var(--radius-input)] px-4 py-2.5 text-sm font-medium text-[var(--color-alert)] transition-colors hover:bg-[rgba(255,90,95,0.06)] focus-visible:outline-2 focus-visible:outline-[var(--color-alert)] focus-visible:outline-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </article>
  );
}

export default AppointmentCard;