import {
  CalendarDays,
  Clock3,
  ChevronRight,
} from "lucide-react";

function ConsultationHistoryItem({
  appointment,
  onSelect,
}) {
  return (
    <article className="border-b border-[rgba(14,22,38,0.08)] py-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Appointment info */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(14,22,38,0.04)]">
            <CalendarDays
              size={18}
              strokeWidth={1.8}
              className="text-[var(--color-muted)]"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-[var(--font-brand)] text-base font-semibold text-[var(--color-ink)]">
              {appointment.doctorName}
            </h3>

            <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
              {appointment.reason}
            </p>
          </div>
        </div>

        {/* Date / time / status */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={15}
              strokeWidth={1.8}
              className="text-[var(--color-muted)]"
              aria-hidden="true"
            />

            <span className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
              {appointment.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock3
              size={15}
              strokeWidth={1.8}
              className="text-[var(--color-muted)]"
              aria-hidden="true"
            />

            <span className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
              {appointment.time}
            </span>
          </div>

          <span className="rounded-[var(--radius-pill)] bg-[rgba(0,217,166,0.12)] px-3 py-1 font-[var(--font-mono)] text-[10px] font-medium tracking-[0.08em] text-[var(--color-ink)]">
            COMPLETED
          </span>

          <button
            type="button"
            onClick={() => onSelect(appointment)}
            aria-label={`View ${appointment.doctorName} appointment`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[rgba(14,22,38,0.04)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            <ChevronRight
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ConsultationHistoryItem;