import { useMemo, useState } from "react";
import { X } from "lucide-react";

import MediaUploader from "./MediaUploader";
import useAppointments from "../hooks/useAppointments";
import { validateAppointment } from "../utils/validation";

function AppointmentForm({
  onSubmit,
  onCancel,
  initialData = null,
}) {
  const { appointments } = useAppointments();

  const doctors = useMemo(() => {
    return [
      ...new Set(
        appointments.map(
          (appointment) => appointment.doctorName,
        ),
      ),
    ];
  }, [appointments]);

  const [formFields, setFormFields] = useState({
    patientName: initialData?.patientName || "",
    doctorName: initialData?.doctorName || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    reason: initialData?.reason || "",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState({});
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preserve existing media when editing.
  const existingMedia = initialData?.mediaUrls || [];

  function handleChange(event) {
    const { name, value } = event.target;

    const updatedFields = {
      ...formFields,
      [name]: value,
    };

    setFormFields(updatedFields);

    const validationErrors = validateAppointment(updatedFields);

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validationErrors[name] || "",
      form: "",
    }));
  }

  function handleMediaChange(files) {
    setSelectedMedia(files);

    setErrors((currentErrors) => ({
      ...currentErrors,
      form: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateAppointment(formFields);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // New media selected in the current form.
      const newMedia = selectedMedia.map((item) => ({
        url: item.previewUrl || "",
        name: item.file.name,
        type: item.file.type,
      }));

      // Keep existing media when editing.
      const mediaUrls = [
        ...existingMedia,
        ...newMedia,
      ];

      const appointmentData = {
        id:
          initialData?.id ||
          `MED-${Date.now()}`,

        patientName:
          formFields.patientName.trim(),

        doctorName:
          formFields.doctorName,

        date:
          formFields.date,

        time:
          formFields.time,

        reason:
          formFields.reason.trim(),

        mediaUrls,
      };

      await onSubmit(appointmentData);
    } catch (error) {
      console.error(
        "Appointment submission failed:",
        error,
      );

      setErrors({
        form: "Unable to save appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,22,38,0.45)] p-4">

      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[var(--shadow-level-2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-form-title"
      >

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(14,22,38,0.08)] px-6 py-5">

          <div>
            <p className="mediform-mono-label">
              Appointment
            </p>

            <h2
              id="appointment-form-title"
              className="mt-1 font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]"
            >
              {initialData
                ? "Edit Appointment"
                : "Book Appointment"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close appointment form"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[rgba(14,22,38,0.04)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            <X
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >

          {/* Patient */}
          <div>
            <label
              htmlFor="patientName"
              className="mediform-mono-label"
            >
              Patient Name
            </label>

            <input
              id="patientName"
              name="patientName"
              type="text"
              value={formFields.patientName}
              onChange={handleChange}
              placeholder="Enter patient name"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errors.patientName && (
              <p className="mt-1 text-xs text-[var(--color-alert)]">
                {errors.patientName}
              </p>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label
              htmlFor="doctorName"
              className="mediform-mono-label"
            >
              Doctor
            </label>

            <select
              id="doctorName"
              name="doctorName"
              value={formFields.doctorName}
              onChange={handleChange}
              disabled={isSubmitting}
              className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                Select a doctor
              </option>

              {doctors.map((doctor) => (
                <option
                  key={doctor}
                  value={doctor}
                >
                  {doctor}
                </option>
              ))}
            </select>

            {errors.doctorName && (
              <p className="mt-1 text-xs text-[var(--color-alert)]">
                {errors.doctorName}
              </p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="mediform-mono-label"
              >
                Date
              </label>

              <input
                id="date"
                name="date"
                type="date"
                min={today}
                value={formFields.date}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              />

              {errors.date && (
                <p className="mt-1 text-xs text-[var(--color-alert)]">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label
                htmlFor="time"
                className="mediform-mono-label"
              >
                Time
              </label>

              <input
                id="time"
                name="time"
                type="time"
                value={formFields.time}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              />

              {errors.time && (
                <p className="mt-1 text-xs text-[var(--color-alert)]">
                  {errors.time}
                </p>
              )}
            </div>

          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="mediform-mono-label"
            >
              Reason
            </label>

            <textarea
              id="reason"
              name="reason"
              value={formFields.reason}
              onChange={handleChange}
              placeholder="Describe the reason for this appointment"
              rows={4}
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errors.reason && (
              <p className="mt-1 text-xs text-[var(--color-alert)]">
                {errors.reason}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mediform-mono-label"
            >
              Notes · Optional
            </label>

            <textarea
              id="notes"
              name="notes"
              value={formFields.notes}
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={3}
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Media */}
          <div>
            <p className="mediform-mono-label">
              Medical Documents
            </p>

            <div className="mt-2">
              <MediaUploader
                onFilesChange={handleMediaChange}
              />
            </div>
          </div>

          {/* Form-level error */}
          {errors.form && (
            <div
              role="alert"
              className="rounded-[var(--radius-input)] border border-[rgba(255,90,95,0.2)] bg-[rgba(255,90,95,0.06)] px-4 py-3 text-sm text-[var(--color-alert)]"
            >
              {errors.form}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[rgba(14,22,38,0.08)] pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[rgba(14,22,38,0.04)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[var(--radius-input)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : "Book Appointment"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default AppointmentForm;