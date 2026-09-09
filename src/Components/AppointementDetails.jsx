import { formatAppointmentDate } from "../utils/dateUtils";

function AppointmentDetails({
  appointment,
  onBack,
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-medium text-[var(--color-ink)]"
      >
        ← Back to Dashboard
      </button>

      {/* Details card */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-level-1)] sm:p-8">

        {/* Heading */}
        <p className="mediform-mono-label">
          Appointment Details
        </p>

        <h1 className="mt-2 font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]">
          {appointment.doctorName}
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {appointment.reason}
        </p>

        {/* Date / Time */}
        <div className="mt-6 grid gap-5 border-t border-[rgba(14,22,38,0.08)] pt-5 sm:grid-cols-2">
          <div>
            <p className="mediform-mono-label">
              Date
            </p>

            <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
              {formatAppointmentDate(appointment.date)}
            </p>
          </div>

          <div>
            <p className="mediform-mono-label">
              Time
            </p>

            <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
              {appointment.time}
            </p>
          </div>
        </div>

        {/* Patient / ID */}
        <div className="mt-6 grid gap-5 border-t border-[rgba(14,22,38,0.08)] pt-5 sm:grid-cols-2">
          <div>
            <p className="mediform-mono-label">
              Patient
            </p>

            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {appointment.patientName}
            </p>
          </div>

          <div>
            <p className="mediform-mono-label">
              Appointment ID
            </p>

            <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
              {appointment.id}
            </p>
          </div>
        </div>

        {/* Media */}
        <div className="mt-6 border-t border-[rgba(14,22,38,0.08)] pt-5">
  <p className="mediform-mono-label">
    Attached Media
  </p>

  {appointment.mediaUrls?.length > 0 ? (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {appointment.mediaUrls.map((media, index) => {
        const isImage = media.type?.startsWith("image/");
        const isPdf = media.type === "application/pdf";

        return (
          <div
            key={`${media.name}-${index}`}
            className="overflow-hidden rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.1)] bg-[var(--color-surface)]"
          >
            {/* Image */}
            {isImage && media.url ? (
              <div>
                <img
                  src={media.url}
                  alt={media.name}
                  className="h-48 w-full object-cover"
                />

                <div className="border-t border-[rgba(14,22,38,0.08)] p-3">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                    {media.name}
                  </p>
                </div>
              </div>
            ) : isPdf ? (
              /* PDF */
              <a
                href={media.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="block p-4 transition-colors hover:border-[var(--color-primary)]"
              >
                <p className="font-[var(--font-mono)] text-xs text-[var(--color-alert)]">
                  PDF
                </p>

                <p className="mt-2 truncate text-sm font-medium text-[var(--color-ink)]">
                  {media.name}
                </p>

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Open document
                </p>
              </a>
            ) : (
              /* Unknown media */
              <div className="p-4">
                <p className="text-sm text-[var(--color-ink)]">
                  {media.name}
                </p>

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Unsupported preview
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <p className="mt-2 text-sm text-[var(--color-muted)]">
      No media attached.
    </p>
  )}
</div>
      </div>
    </main>
  );
}

export default AppointmentDetails;