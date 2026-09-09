import { ArrowRight } from "lucide-react";

function BookingCTA({ onBook }) {
  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-ink)] p-6 text-white shadow-[var(--shadow-level-1)] sm:p-8">
      <p className="mediform-mono-label text-[rgba(255,255,255,0.55)]">
        New Consultation
      </p>

      <h2 className="mt-3 font-[var(--font-brand)] text-2xl font-semibold">
        Need to see a specialist?
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-[rgba(255,255,255,0.7)]">
        Schedule a new consultation or follow-up with our network of
        professionals.
      </p>

      <button
        type="button"
        onClick={onBook}
        className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-primary)] px-5 py-3 font-[var(--font-ui)] text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
      >
        Book Appointment
        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </section>
  );
}

export default BookingCTA;