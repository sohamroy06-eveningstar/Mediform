import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  UserRound,
  Trash2,
} from "lucide-react";

import Swal from "sweetalert2";

import MediaUploader from "./MediaUploader";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const GENDERS = [
  "Male",
  "Female",
  "Other",
];

const EMPTY_FORM = {
  fullName: "",
  specialization: "",
  qualification: "",
  experienceYears: "",
  gender: "",
  phone: "",
  email: "",
  hospitalName: "",
  department: "",
  location: "",
  consultationFee: "",
  languages: "",
  bio: "",
  availableDays: [],
  availableFrom: "",
  availableTo: "",
  telehealthEnabled: false,
  telehealthUrl: "",
  status: "ACTIVE",
};

function createDoctorId() {
  return `DOC-${Date.now()}`;
}

function DoctorForm({
  initialData = null,
  onSubmit,
  onCancel,
  onDelete,
}) {
  const isEditing =
    Boolean(initialData?.id);

  const [doctorId] = useState(
    () =>
      initialData?.id ||
      createDoctorId(),
  );

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [selectedMedia, setSelectedMedia] =
    useState([]);

  const [
    existingProfileImage,
    setExistingProfileImage,
  ] = useState(
    initialData?.profileImage || null,
  );

  const [
    existingImageUrl,
    setExistingImageUrl,
  ] = useState("");

  const [
    existingImageLoading,
    setExistingImageLoading,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState("");

  /*
   * =========================
   * LOAD EDIT DATA
   * =========================
   */
  useEffect(() => {
    if (!initialData) {
      setForm({
        ...EMPTY_FORM,
      });

      setExistingProfileImage(null);
      setExistingImageUrl("");

      return;
    }

    setForm({
      fullName:
        initialData.fullName || "",

      specialization:
        initialData.specialization || "",

      qualification:
        initialData.qualification || "",

      experienceYears:
        initialData.experienceYears ??
        "",

      gender:
        initialData.gender || "",

      phone:
        initialData.phone || "",

      email:
        initialData.email || "",

      hospitalName:
        initialData.hospitalName || "",

      department:
        initialData.department || "",

      location:
        initialData.location || "",

      consultationFee:
        initialData.consultationFee ??
        "",

      languages:
        Array.isArray(
          initialData.languages,
        )
          ? initialData.languages.join(
              ", ",
            )
          : "",

      bio:
        initialData.bio || "",

      availableDays:
        Array.isArray(
          initialData.availableDays,
        )
          ? initialData.availableDays
          : [],

      availableFrom:
        initialData.availableFrom ||
        "",

      availableTo:
        initialData.availableTo || "",

      telehealthEnabled:
        Boolean(
          initialData.telehealthEnabled,
        ),

      telehealthUrl:
        initialData.telehealthUrl || "",

      status:
        initialData.status ||
        "ACTIVE",
    });

    setExistingProfileImage(
      initialData.profileImage || null,
    );

    setSelectedMedia([]);
    setValidationError("");
  }, [initialData]);

  /*
   * =========================
   * LOAD EXISTING PROFILE IMAGE
   * =========================
   */
  useEffect(() => {
    let cancelled = false;

    async function loadExistingImage() {
      const pathname =
        existingProfileImage?.pathname;

      if (!pathname) {
        setExistingImageUrl(
          existingProfileImage?.url ||
            "",
        );

        setExistingImageLoading(false);

        return;
      }

      setExistingImageLoading(true);

      try {
        const response = await fetch(
          `/api/media?pathname=${encodeURIComponent(
            pathname,
          )}`,
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load image.",
          );
        }

        if (!cancelled) {
          setExistingImageUrl(
            data?.data?.url || "",
          );
        }
      } catch (error) {
        console.error(
          "Doctor profile image loading failed:",
          error,
        );

        if (!cancelled) {
          setExistingImageUrl("");
        }
      } finally {
        if (!cancelled) {
          setExistingImageLoading(
            false,
          );
        }
      }
    }

    loadExistingImage();

    return () => {
      cancelled = true;
    };
  }, [existingProfileImage]);

  /*
   * =========================
   * FORM HANDLERS
   * =========================
   */
  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setValidationError("");
  }

  function handleDayChange(day) {
    setForm((current) => {
      const exists =
        current.availableDays.includes(
          day,
        );

      return {
        ...current,

        availableDays: exists
          ? current.availableDays.filter(
              (item) => item !== day,
            )
          : [
              ...current.availableDays,
              day,
            ],
      };
    });

    setValidationError("");
  }

  function handleProfileImageChange(
    files,
  ) {
    setSelectedMedia(files);

    if (files.length > 0) {
      setExistingProfileImage(null);
      setExistingImageUrl("");
    }

    setValidationError("");
  }

  /*
   * =========================
   * VALIDATION
   * =========================
   */
  function validateForm() {
    if (!form.fullName.trim()) {
      return "Full name is required.";
    }

    if (
      !form.specialization.trim()
    ) {
      return "Specialization is required.";
    }

    if (
      !form.qualification.trim()
    ) {
      return "Qualification is required.";
    }

    const experience =
      Number(form.experienceYears);

    if (
      form.experienceYears === "" ||
      !Number.isInteger(experience) ||
      experience < 0
    ) {
      return "Experience must be a valid non-negative number.";
    }

    if (
      form.consultationFee !==
        "" &&
      (Number.isNaN(
        Number(
          form.consultationFee,
        ),
      ) ||
        Number(
          form.consultationFee,
        ) < 0)
    ) {
      return "Consultation fee must be a valid non-negative number.";
    }

    /*
     * Availability validation
     */
    if (
      form.availableFrom &&
      form.availableTo &&
      form.availableFrom >=
        form.availableTo
    ) {
      return "Available end time must be later than start time.";
    }

    /*
     * Telehealth validation
     */
    if (
      form.telehealthEnabled &&
      !form.telehealthUrl.trim()
    ) {
      return "Google Meet link is required when telehealth is enabled.";
    }

    if (
      form.telehealthUrl.trim() &&
      !/^https:\/\/meet\.google\.com\/[A-Za-z0-9_-]+/i.test(
        form.telehealthUrl.trim(),
      )
    ) {
      return "Please enter a valid Google Meet link.";
    }

    /*
     * If doctor is available but no day
     * selected, stop submission.
     */
    if (
      (form.availableFrom ||
        form.availableTo) &&
      form.availableDays.length ===
        0
    ) {
      return "Please select at least one available day.";
    }

    return "";
  }

  /*
   * =========================
   * PROFILE PREVIEW
   * =========================
   */
  const profilePreview =
    useMemo(() => {
      if (
        selectedMedia[0]?.previewUrl
      ) {
        return selectedMedia[0]
          .previewUrl;
      }

      return existingImageUrl;
    }, [
      selectedMedia,
      existingImageUrl,
    ]);

  /*
   * =========================
   * SUBMIT
   * =========================
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const error =
      validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      /*
       * New uploaded profile image
       */
      const profileImage =
        selectedMedia.length > 0
          ? {
              pathname:
                selectedMedia[0]
                  .pathname || "",

              name:
                selectedMedia[0].name ||
                selectedMedia[0].file
                  ?.name ||
                "",

              type:
                selectedMedia[0].type ||
                selectedMedia[0].file
                  ?.type ||
                "",
            }
          : existingProfileImage;

      /*
       * Doctor payload
       */
      const doctorData = {
        id: doctorId,

        fullName:
          form.fullName.trim(),

        specialization:
          form.specialization.trim(),

        qualification:
          form.qualification.trim(),

        experienceYears:
          Number(
            form.experienceYears,
          ),

        gender:
          form.gender.trim(),

        phone:
          form.phone.trim(),

        email:
          form.email.trim(),

        hospitalName:
          form.hospitalName.trim(),

        department:
          form.department.trim(),

        location:
          form.location.trim(),

        consultationFee:
          form.consultationFee === ""
            ? null
            : Number(
                form.consultationFee,
              ),

        languages:
          form.languages
            .split(",")
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean),

        bio:
          form.bio.trim(),

        availableDays:
          form.availableDays,

        availableFrom:
          form.availableFrom,

        availableTo:
          form.availableTo,

        telehealthEnabled:
          Boolean(
            form.telehealthEnabled,
          ),

        telehealthUrl:
          form.telehealthUrl.trim(),

        profileImage,

        status:
          form.status,
      };

      await onSubmit(
        doctorData,
      );
    } catch (error) {
      console.error(
        "Doctor form submission failed:",
        error,
      );

      setValidationError(
        error.message ||
          "Unable to save doctor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * =========================
   * DELETE
   * =========================
   */
  async function handleDelete() {
    if (
      !isEditing ||
      !onDelete
    ) {
      return;
    }

    const result =
      await Swal.fire({
        title: "Delete doctor?",
        text: `Delete ${form.fullName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          "Yes, delete",
        cancelButtonText:
          "Keep doctor",
        reverseButtons: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsSubmitting(true);

      await onDelete(
        initialData,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title:
          "Doctor deleted successfully.",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(
        "Delete doctor failed:",
        error,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title:
          "Unable to delete doctor.",
        text: error.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-[var(--color-surface)] shadow-2xl">
        {/* =========================
            HEADER
        ========================= */}

        <div className="flex items-start justify-between border-b border-[rgba(14,22,38,0.08)] px-6 py-5 sm:px-8">
          <div>
            <p className="mediform-mono-label">
              {isEditing
                ? "Edit Doctor"
                : "Doctor Management"}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {isEditing
                ? form.fullName ||
                  "Edit Doctor"
                : "Add New Doctor"}
            </h2>

            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Add professional details,
              availability and telehealth
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close doctor form"
          >
            ×
          </button>
        </div>

        {/* =========================
            FORM
        ========================= */}

        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 sm:px-8"
        >
          {/* =========================
              PROFILE IMAGE
          ========================= */}

          <section>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {existingImageLoading &&
                !selectedMedia.length ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />

                    <span className="text-[10px] text-gray-400">
                      Loading
                    </span>
                  </div>
                ) : profilePreview ? (
                  <img
                    src={profilePreview}
                    alt={
                      form.fullName ||
                      "Doctor profile"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    size={38}
                    className="text-gray-400"
                  />
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Profile Photo
                </p>

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Upload a JPG, PNG or WebP
                  image. Maximum 5MB.
                </p>

                <div className="mt-4 max-w-md">
                  <MediaUploader
                    resourceId={
                      doctorId
                    }
                    folder="doctors"
                    multiple={false}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                    ]}
                    onFilesChange={
                      handleProfileImageChange
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =========================
              BASIC INFORMATION
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Basic Information
            </SectionTitle>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={
                  handleChange
                }
                placeholder="Dr. Sarah Jenkins"
                required
              />

              <Field
                label="Specialization"
                name="specialization"
                value={
                  form.specialization
                }
                onChange={
                  handleChange
                }
                placeholder="Cardiology"
                required
              />

              <Field
                label="Qualification"
                name="qualification"
                value={
                  form.qualification
                }
                onChange={
                  handleChange
                }
                placeholder="MBBS, MD"
                required
              />

              <Field
                label="Experience"
                name="experienceYears"
                type="number"
                min="0"
                value={
                  form.experienceYears
                }
                onChange={
                  handleChange
                }
                placeholder="8"
                suffix="years"
                required
              />

              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={
                  handleChange
                }
                options={
                  GENDERS
                }
              />

              <Field
                label="Department"
                name="department"
                value={
                  form.department
                }
                onChange={
                  handleChange
                }
                placeholder="Cardiology Department"
              />
            </div>
          </section>

          {/* =========================
              CONTACT
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Contact Information
            </SectionTitle>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={
                  handleChange
                }
                placeholder="+91 9876543210"
              />

              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={
                  handleChange
                }
                placeholder="doctor@example.com"
              />

              <Field
                label="Hospital / Clinic"
                name="hospitalName"
                value={
                  form.hospitalName
                }
                onChange={
                  handleChange
                }
                placeholder="Mediform Healthcare"
              />

              <Field
                label="Location"
                name="location"
                value={
                  form.location
                }
                onChange={
                  handleChange
                }
                placeholder="Kolkata, West Bengal"
              />
            </div>
          </section>

          {/* =========================
              PROFESSIONAL DETAILS
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Professional Details
            </SectionTitle>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Consultation Fee"
                name="consultationFee"
                type="number"
                min="0"
                step="0.01"
                value={
                  form.consultationFee
                }
                onChange={
                  handleChange
                }
                placeholder="800"
                prefix="₹"
              />

              <Field
                label="Languages"
                name="languages"
                value={
                  form.languages
                }
                onChange={
                  handleChange
                }
                placeholder="English, Hindi, Bengali"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-[var(--color-ink)]"
              >
                Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={form.bio}
                onChange={
                  handleChange
                }
                placeholder="Write a short professional biography..."
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </section>

          {/* =========================
              AVAILABILITY
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Availability
            </SectionTitle>

            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Available Days
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS.map((day) => {
                  const checked =
                    form.availableDays.includes(
                      day,
                    );

                  return (
                    <label
                      key={day}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        checked
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          handleDayChange(
                            day,
                          )
                        }
                        disabled={
                          isSubmitting
                        }
                        className="h-4 w-4"
                      />

                      <span>
                        {day}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                label="Available From"
                name="availableFrom"
                type="time"
                value={
                  form.availableFrom
                }
                onChange={
                  handleChange
                }
              />

              <Field
                label="Available To"
                name="availableTo"
                type="time"
                value={
                  form.availableTo
                }
                onChange={
                  handleChange
                }
              />
            </div>
          </section>

          {/* =========================
              TELEHEALTH
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Telehealth
            </SectionTitle>

            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Telehealth available
                </p>

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Allow patients to use online
                  consultation for this doctor.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.telehealthEnabled
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      telehealthEnabled:
                        event.target
                          .checked,
                    }),
                  )
                }
                disabled={
                  isSubmitting
                }
                className="h-5 w-5"
              />
            </label>

            {/* Google Meet Link */}
            {form.telehealthEnabled && (
              <div className="mt-4">
                <label
                  htmlFor="telehealthUrl"
                  className="block text-sm font-medium text-[var(--color-ink)]"
                >
                  Google Meet Link
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="telehealthUrl"
                  name="telehealthUrl"
                  type="url"
                  value={
                    form.telehealthUrl
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="https://meet.google.com/abc-defg-hij"
                  disabled={
                    isSubmitting
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Patients will use this Google Meet
                  link to join the consultation.
                </p>
              </div>
            )}
          </section>

          {/* =========================
              STATUS
          ========================= */}

          <section className="mt-8">
            <SectionTitle>
              Status
            </SectionTitle>

            <div className="mt-4 max-w-xs">
              <SelectField
                label="Doctor Status"
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
                options={[
                  "ACTIVE",
                  "INACTIVE",
                ]}
              />
            </div>
          </section>

          {/* =========================
              ERROR
          ========================= */}

          {validationError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {validationError}
            </div>
          )}

          {/* =========================
              FOOTER
          ========================= */}

          <div className="mt-8 flex flex-col gap-3 border-t border-[rgba(14,22,38,0.08)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {isEditing &&
                onDelete && (
                  <button
                    type="button"
                    onClick={
                      handleDelete
                    }
                    disabled={
                      isSubmitting
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2
                      size={16}
                    />

                    Delete Doctor
                  </button>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={
                  isSubmitting
                }
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Doctor"
                    : "Add Doctor"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================
   SECTION TITLE
========================================= */

function SectionTitle({
  children,
}) {
  return (
    <h3 className="text-base font-semibold text-[var(--color-ink)]">
      {children}
    </h3>
  );
}

/* =========================================
   FIELD
========================================= */

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  suffix,
  prefix,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[var(--color-ink)]"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative mt-2">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {prefix}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={`h-11 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 ${
            prefix
              ? "pl-8 pr-3"
              : "px-3"
          } ${
            suffix
              ? "pr-16"
              : ""
          }`}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================
   SELECT
========================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[var(--color-ink)]"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
      >
        <option value="">
          Select {label}
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

export default DoctorForm;