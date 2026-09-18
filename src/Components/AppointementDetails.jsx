import { useEffect, useState } from "react";
import { formatAppointmentDate } from "../utils/dateUtils";

function getMediaPathname(media) {
  if (media?.pathname) {
    return media.pathname;
  }

  // Backward compatibility for records created
  // before pathname was saved.
  if (media?.url) {
    try {
      const url = new URL(media.url);

      if (url.hostname.includes(".private.blob.vercel-storage.com")) {
        return url.pathname.replace(/^\/+/, "");
      }
    } catch {
      return null;
    }
  }

  return null;
}

function AppointmentDetails({
  appointment,
  onBack,
   onEdit,
  onCancel,
}) {
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState({});
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMediaUrls() {
      const mediaItems = appointment.mediaUrls || [];

      if (mediaItems.length === 0) {
        setResolvedMediaUrls({});
        return;
      }

      setMediaLoading(true);
      setMediaError("");

      try {
        const resolvedEntries = await Promise.all(
          mediaItems.map(async (media, index) => {
            const pathname = getMediaPathname(media);

            // Legacy/public media fallback.
            if (!pathname) {
              return [index, media?.url || ""];
            }

            const response = await fetch(
              `/api/media?pathname=${encodeURIComponent(pathname)}`,
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Failed to load media.",
              );
            }

            return [index, data.data.url];
          }),
        );

        if (!cancelled) {
          setResolvedMediaUrls(
            Object.fromEntries(resolvedEntries),
          );
        }
      } catch (error) {
        console.error("Media loading failed:", error);

        if (!cancelled) {
          setMediaError("Unable to load attached media.");
        }
      } finally {
        if (!cancelled) {
          setMediaLoading(false);
        }
      }
    }

    loadMediaUrls();

    return () => {
      cancelled = true;
    };
  }, [appointment.id, appointment.mediaUrls]);

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

          {mediaLoading && (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Loading attached media...
            </p>
          )}

          {mediaError && (
            <p
              role="alert"
              className="mt-3 text-sm text-[var(--color-alert)]"
            >
              {mediaError}
            </p>
          )}

          {!mediaLoading &&
          !mediaError &&
          appointment.mediaUrls?.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {appointment.mediaUrls.map((media, index) => {
                const mediaUrl = resolvedMediaUrls[index];

                const isImage =
                  media.type?.startsWith("image/");

                const isPdf =
                  media.type === "application/pdf";

                return (
                  <div
                    key={`${media.name}-${index}`}
                    className="overflow-hidden rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.1)] bg-[var(--color-surface)]"
                  >
                    {/* Image */}
                    {isImage && mediaUrl ? (
                      <div>
                        <img
                          src={mediaUrl}
                          alt={media.name}
                          className="h-48 w-full object-cover"
                        />

                        <div className="border-t border-[rgba(14,22,38,0.08)] p-3">
                          <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                            {media.name}
                          </p>
                        </div>
                      </div>
                    ) : isPdf && mediaUrl ? (
                      /* PDF */
                      <a
                        href={mediaUrl}
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
                      /* Unsupported / unavailable */
                      <div className="p-4">
                        <p className="text-sm text-[var(--color-ink)]">
                          {media.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Preview unavailable
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !mediaLoading &&
            !mediaError &&
            (!appointment.mediaUrls ||
              appointment.mediaUrls.length === 0) && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                No media attached.
              </p>
            )
          )}
        </div>
        {/* Actions */}
{(onEdit || onCancel) && (
  <div className="mt-8 flex flex-col gap-3 border-t border-[rgba(14,22,38,0.08)] pt-6 sm:flex-row">
    {onEdit && (
      <button
        type="button"
        onClick={() => onEdit(appointment)}
        className="rounded-lg border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-gray-50"
      >
        Edit Appointment
      </button>
    )}

    {onCancel && (
      <button
        type="button"
        onClick={() => onCancel(appointment)}
        className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
      >
        Cancel Appointment
      </button>
    )}
  </div>
)}
      </div>
    </main>
  );
}

export default AppointmentDetails;