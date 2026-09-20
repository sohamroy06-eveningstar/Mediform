import { useEffect, useState } from "react";
import { X } from "lucide-react";

import MediaUploader from "./MediaUploader";

import { validateAppointment } from "../utils/validation";
import { fetchDoctors } from "../service/doctorService";

function AppointmentForm({
  onSubmit,
  onCancel,
  initialData = null,
}) {
  const [appointmentId] = useState(
    () =>
      initialData?.id ||
      `MED-${Date.now()}`,
  );

  /* =========================
     DOCTORS
  ========================= */

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] =
    useState(true);
  const [doctorsError, setDoctorsError] =
    useState("");

  /* =========================
     FORM
  ========================= */

  const [formFields, setFormFields] = useState({
    patientName:
      initialData?.patientName || "",

    doctorName:
      initialData?.doctorName || "",

    date:
      initialData?.date || "",

    time:
      initialData?.time || "",

    reason:
      initialData?.reason || "",

    notes:
      initialData?.notes || "",
  });

  const [errors, setErrors] = useState({});
  const [selectedMedia, setSelectedMedia] =
    useState([]);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
   * Preserve existing media when editing.
   */
  const existingMedia =
    initialData?.mediaUrls || [];

  /* =========================
     LOAD DOCTORS
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function loadDoctors() {
      try {
        setDoctorsLoading(true);
        setDoctorsError("");

        const response =
          await fetchDoctors();

        if (!mounted) {
          return;
        }

        setDoctors(
          Array.isArray(response.data)
            ? response.data
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to load doctors:",
          error,
        );

        if (mounted) {
          setDoctorsError(
            error.message ||
              "Unable to load doctors.",
          );
        }
      } finally {
        if (mounted) {
          setDoctorsLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * When editing an appointment,
   * the existing doctor may no longer
   * be in the active doctor list.
   *
   * Keep that doctor visible as the
   * current appointment value.
   */
  const hasCurrentDoctor =
    Boolean(
      formFields.doctorName &&
        doctors.some(
          (doctor) =>
            doctor.fullName ===
            formFields.doctorName,
        ),
    );

  const showCurrentDoctorOption =
    Boolean(
      initialData &&
        formFields.doctorName &&
        !hasCurrentDoctor,
    );

  /* =========================
     FORM HANDLERS
  ========================= */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    const updatedFields = {
      ...formFields,
      [name]: value,
    };

    setFormFields(updatedFields);

    const validationErrors =
      validateAppointment(
        updatedFields,
      );

    setErrors((currentErrors) => ({
      ...currentErrors,

      [name]:
        validationErrors[name] || "",

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

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validateAppointment(
        formFields,
      );

    setErrors(validationErrors);

    if (
      Object.keys(
        validationErrors,
      ).length > 0
    ) {
      return;
    }

    /*
     * Don't submit while doctor
     * data is still loading.
     */
    if (doctorsLoading) {
      setErrors({
        form:
          "Please wait until the doctor list finishes loading.",
      });

      return;
    }

    if (
      doctorsError &&
      !formFields.doctorName
    ) {
      setErrors({
        form:
          "Unable to load doctors. Please try again.",
      });

      return;
    }

    /*
     * New media selected in current form.
     */
  
    /*
     * Preserve existing media when editing.
     */
  const mediaUrls = [
  ...existingMedia,
];

const mediaFiles =
  selectedMedia
    .map((item) => item.file)
    .filter(Boolean);
   const appointmentData = {
  id: appointmentId,

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

  notes:
    formFields.notes.trim(),

  /*
   * Existing media stays in DB.
   */
  mediaUrls,

  /*
   * New File objects are NOT sent
   * to the API directly.
   *
   * Dashboard will upload them
   * after appointment creation.
   */
  mediaFiles,
};

    setIsSubmitting(true);

    try {
      await onSubmit(
        appointmentData,
      );
    } catch (error) {
      console.error(
        "Appointment submission failed:",
        error,
      );

      setErrors({
        form:
          error.message ||
          "Unable to save appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =========================
     DATE
  ========================= */

  const today = new Date()
    .toISOString()
    .split("T")[0];

  /* =========================
     UI
  ========================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,22,38,0.45)] p-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[var(--shadow-level-2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-form-title"
      >
        {/* =========================
            HEADER
        ========================= */}

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

        {/* =========================
            FORM
        ========================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {/* =========================
              PATIENT
          ========================= */}

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
              value={
                formFields.patientName
              }
              onChange={handleChange}
              placeholder="Enter patient name"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errors.patientName && (
              <p className="mt-1 text-xs text-[var(--color-alert)]">
                {
                  errors.patientName
                }
              </p>
            )}
          </div>

          {/* =========================
    DOCTOR
========================= */}

<div>
  <label
    htmlFor="doctorName"
    className="mediform-mono-label"
  >
    Doctor
  </label>

  {/* Doctor loader */}
  {doctorsLoading ? (
    <div className="mt-2 flex min-h-[48px] items-center justify-center rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
          aria-hidden="true"
        />

        <span>Loading doctors...</span>
      </div>
    </div>
  ) : (
    <select
      id="doctorName"
      name="doctorName"
      value={formFields.doctorName}
      onChange={handleChange}
      disabled={
        isSubmitting ||
        doctors.length === 0
      }
      className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="">
        Select a doctor
      </option>

      {/* Existing doctor during edit */}
      {showCurrentDoctorOption ? (
        <option
          value={formFields.doctorName}
        >
          {formFields.doctorName}{" "}
          (Current appointment)
        </option>
      ) : null}

      {/* Active doctors */}
      {doctors.map((doctor) => (
        <option
          key={doctor.id}
          value={doctor.fullName}
        >
          {doctor.fullName}

          {doctor.specialization
            ? ` — ${doctor.specialization}`
            : ""}
        </option>
      ))}
    </select>
  )}

  {/* API Error */}
  {doctorsError && (
    <div
      role="alert"
      className="mt-2 rounded-[var(--radius-input)] border border-[rgba(255,90,95,0.2)] bg-[rgba(255,90,95,0.06)] px-3 py-2 text-xs text-[var(--color-alert)]"
    >
      {doctorsError}
    </div>
  )}

  {/* No doctors */}
  {!doctorsLoading &&
    !doctorsError &&
    doctors.length === 0 && (
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        No active doctors are currently available.
      </p>
    )}

  {/* Validation error */}
  {errors.doctorName && (
    <p className="mt-1 text-xs text-[var(--color-alert)]">
      {errors.doctorName}
    </p>
  )}
</div>

          {/* =========================
              DATE + TIME
          ========================= */}

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
                value={
                  formFields.date
                }
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
                value={
                  formFields.time
                }
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

          {/* =========================
              REASON
          ========================= */}

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
              value={
                formFields.reason
              }
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

          {/* =========================
              NOTES
          ========================= */}

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
              value={
                formFields.notes
              }
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={3}
              disabled={isSubmitting}
              className="mt-2 w-full resize-y rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* =========================
              MEDICAL MEDIA
          ========================= */}

          <div>
            <p className="mediform-mono-label">
              Medical Documents
            </p>

            <div className="mt-2">
              <MediaUploader
                appointmentId={appointmentId}
                deferUpload={true}
                onFilesChange={handleMediaChange}
              />
            </div>
          </div>

          {/* =========================
              FORM ERROR
          ========================= */}

          {errors.form && (
            <div
              role="alert"
              className="rounded-[var(--radius-input)] border border-[rgba(255,90,95,0.2)] bg-[rgba(255,90,95,0.06)] px-4 py-3 text-sm text-[var(--color-alert)]"
            >
              {errors.form}
            </div>
          )}

          {/* =========================
              ACTIONS
          ========================= */}

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
              disabled={
                isSubmitting ||
                doctorsLoading ||
                doctors.length === 0
              }
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