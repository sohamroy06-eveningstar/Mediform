import {
  CalendarDays,
  Clock3,
  Video,
  ExternalLink,
} from "lucide-react";

import { formatAppointmentDate } from "../utils/dateUtils";

function UpcomingAppointment({
  appointment,
  onSelect,
}) {
  const canJoinTelehealth =
    appointment.telehealthEnabled &&
    appointment.telehealthUrl;

  function handleJoinTelehealth() {
    if (!canJoinTelehealth) {
      return;
    }

    try {
      const url = new URL(
        appointment.telehealthUrl,
      );

      /*
       * Only allow Google Meet links.
       */
      if (
        url.protocol !== "https:" ||
        url.hostname !== "meet.google.com"
      ) {
        console.error(
          "Invalid telehealth URL.",
        );

        return;
      }

      window.open(
        url.toString(),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      console.error(
        "Failed to open telehealth:",
        error,
      );
    }
  }

  return (
    <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)] shadow-[var(--shadow-level-1)]">
      {/* Signal accent */}
      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--color-primary)]" />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mediform-mono-label">
              Upcoming
            </p>

            <h2 className="mt-2 font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]">
              {appointment.doctorName}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {appointment.reason}
            </p>
          </div>

          <span className="shrink-0 font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
            ID: {appointment.id}
          </span>
        </div>

        {/* Date / Time */}
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
                {formatAppointmentDate(
                  appointment.date,
                )}
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
          {/* View Details */}
          <button
            type="button"
            onClick={() =>
              onSelect(appointment)
            }
            className="inline-flex items-center gap-2 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            View Details
          </button>

          {/* Join Telehealth */}
          <button
            type="button"
            onClick={handleJoinTelehealth}
            disabled={!canJoinTelehealth}
            aria-disabled={!canJoinTelehealth}
            title={
              canJoinTelehealth
                ? "Join Google Meet"
                : "Telehealth is not available for this appointment"
            }
            className="inline-flex items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            <Video
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            {canJoinTelehealth
              ? "Join Telehealth"
              : "Telehealth Unavailable"}

            {canJoinTelehealth && (
              <ExternalLink
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default UpcomingAppointment;