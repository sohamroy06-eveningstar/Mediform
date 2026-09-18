import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppointmentCard from "./AppointmentCard";

import useAppointments from "../hooks/useAppointments";
import { getAppointmentStatus } from "../utils/dateUtils";

import { fetchDoctors } from "../service/doctorService";

function getAppointmentTimestamp(
  appointment,
) {
  const date = appointment?.date;

  if (!date) {
    return 0;
  }

  const rawTime = String(
    appointment?.time || "00:00",
  )
    .trim()
    .toUpperCase();

  let hours = 0;
  let minutes = 0;

  /*
   * 12-hour format:
   * 09:00 AM
   * 10:30 PM
   */
  const twelveHourMatch =
    rawTime.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/,
    );

  if (twelveHourMatch) {
    hours = Number(
      twelveHourMatch[1],
    );

    minutes = Number(
      twelveHourMatch[2],
    );

    const period =
      twelveHourMatch[3];

    if (period === "AM") {
      if (hours === 12) {
        hours = 0;
      }
    } else if (period === "PM") {
      if (hours !== 12) {
        hours += 12;
      }
    }
  } else {
    /*
     * 24-hour format:
     * 09:00
     * 14:36
     */
    const twentyFourHourMatch =
      rawTime.match(
        /^(\d{1,2}):(\d{2})$/,
      );

    if (
      twentyFourHourMatch
    ) {
      hours = Number(
        twentyFourHourMatch[1],
      );

      minutes = Number(
        twentyFourHourMatch[2],
      );
    }
  }

  const timestamp = new Date(
    `${date}T${String(hours).padStart(
      2,
      "0",
    )}:${String(minutes).padStart(
      2,
      "0",
    )}:00`,
  ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function AppointmentList({
  onSelect,
  onEdit,
  onCancel,
  excludeAppointmentId,
}) {
  const { appointments } =
    useAppointments();

  const [doctorFilter, setDoctorFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [sortBy, setSortBy] =
    useState("NEWEST");

  const [doctors, setDoctors] =
    useState([]);

  const [doctorsLoading, setDoctorsLoading] =
    useState(true);

  const [doctorsError, setDoctorsError] =
    useState("");

  /*
   * Load active doctors from API.
   *
   * This makes the doctor filter independent
   * from appointment history.
   */
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
          Array.isArray(
            response.data,
          )
            ? response.data
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to load doctors for filter:",
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
   * Remove the primary upcoming appointment
   * from this list.
   */
  const visibleAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          appointment.id !==
          excludeAppointmentId,
      );
    }, [
      appointments,
      excludeAppointmentId,
    ]);

  /*
   * Fallback doctor names from appointments.
   *
   * Useful if API temporarily fails or if an
   * old appointment has a doctor not currently
   * present in the doctors table.
   */
  const appointmentDoctorNames =
    useMemo(() => {
      return visibleAppointments
        .map(
          (appointment) =>
            appointment.doctorName,
        )
        .filter(Boolean);
    }, [visibleAppointments]);

  /*
   * Merge API doctors + doctor names from
   * existing appointments.
   */
  const doctorOptions = useMemo(() => {
    const names = new Set();

    doctors.forEach((doctor) => {
      if (doctor?.fullName) {
        names.add(
          doctor.fullName,
        );
      }
    });

    appointmentDoctorNames.forEach(
      (doctorName) => {
        names.add(doctorName);
      },
    );

    return [...names].sort(
      (a, b) =>
        a.localeCompare(b),
    );
  }, [
    doctors,
    appointmentDoctorNames,
  ]);

  /*
   * Filter by doctor and status.
   */
  const filteredAppointments =
    useMemo(() => {
      const filtered =
        visibleAppointments.filter(
          (appointment) => {
            const appointmentStatus =
              getAppointmentStatus(
                appointment.date,
              );

            const doctorMatches =
              doctorFilter === "ALL" ||
              appointment.doctorName ===
                doctorFilter;

            const statusMatches =
              statusFilter === "ALL" ||
              appointmentStatus ===
                statusFilter;

            return (
              doctorMatches &&
              statusMatches
            );
          },
        );

      /*
       * Sort
       */
      return [...filtered].sort(
        (a, b) => {
          if (
            sortBy === "NEWEST"
          ) {
            return (
              getAppointmentTimestamp(
                b,
              ) -
              getAppointmentTimestamp(
                a,
              )
            );
          }

          if (
            sortBy === "OLDEST"
          ) {
            return (
              getAppointmentTimestamp(
                a,
              ) -
              getAppointmentTimestamp(
                b,
              )
            );
          }

          if (
            sortBy ===
            "DOCTOR_ASC"
          ) {
            return (
              a.doctorName || ""
            ).localeCompare(
              b.doctorName || "",
            );
          }

          if (
            sortBy ===
            "DOCTOR_DESC"
          ) {
            return (
              b.doctorName || ""
            ).localeCompare(
              a.doctorName || "",
            );
          }

          return 0;
        },
      );
    }, [
      visibleAppointments,
      doctorFilter,
      statusFilter,
      sortBy,
    ]);

  /*
   * Split filtered data into
   * upcoming and past.
   */
  const filteredUpcomingAppointments =
    useMemo(() => {
      return filteredAppointments.filter(
        (appointment) =>
          getAppointmentStatus(
            appointment.date,
          ) === "UPCOMING",
      );
    }, [filteredAppointments]);

  const filteredPastAppointments =
    useMemo(() => {
      return filteredAppointments.filter(
        (appointment) =>
          getAppointmentStatus(
            appointment.date,
          ) === "PAST",
      );
    }, [filteredAppointments]);

  /*
   * Total visible appointments
   */
  if (visibleAppointments.length === 0) {
    return (
      <section>
        <p className="mediform-mono-label">
          Appointment List
        </p>

        <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No appointments available.
          </p>
        </div>
      </section>
    );
  }

  const showUpcoming =
    statusFilter === "ALL" ||
    statusFilter === "UPCOMING";

  const showHistory =
    statusFilter === "ALL" ||
    statusFilter === "PAST";

  const hasFilter =
    doctorFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    sortBy !== "NEWEST";

  function clearFilters() {
    setDoctorFilter("ALL");
    setStatusFilter("ALL");
    setSortBy("NEWEST");
  }

  return (
    <section>
      {/* =================================
          SECTION HEADER
      ================================= */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mediform-mono-label">
            Appointment List
          </p>

          <h2 className="mt-2 font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]">
            Your Appointments
          </h2>
        </div>

        <span className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
          {visibleAppointments.length}{" "}
          TOTAL
        </span>
      </div>

      {/* =================================
          FILTERS
      ================================= */}

      <div className="mt-7 rounded-[var(--radius-card)] border border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {/* Doctor */}
            <label className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-44">
              <span className="mediform-mono-label">
                Doctor
              </span>

              <select
                value={doctorFilter}
                onChange={(event) =>
                  setDoctorFilter(
                    event.target.value,
                  )
                }
                disabled={
                  doctorsLoading
                }
                className="w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="ALL">
                  {doctorsLoading
                    ? "Loading doctors..."
                    : "All Doctors"}
                </option>

                {doctorOptions.map(
                  (doctor) => (
                    <option
                      key={doctor}
                      value={doctor}
                    >
                      {doctor}
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* Status */}
            <label className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-44">
              <span className="mediform-mono-label">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="UPCOMING">
                  Upcoming
                </option>

                <option value="PAST">
                  Past
                </option>
              </select>
            </label>

            {/* Sort */}
            <label className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-44">
              <span className="mediform-mono-label">
                Sort
              </span>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
                className="w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
              >
                <option value="NEWEST">
                  Newest First
                </option>

                <option value="OLDEST">
                  Oldest First
                </option>

                <option value="DOCTOR_ASC">
                  Doctor A → Z
                </option>

                <option value="DOCTOR_DESC">
                  Doctor Z → A
                </option>
              </select>
            </label>
          </div>

          {/* Filter info / clear */}
          <div className="flex flex-col gap-2 border-t border-[rgba(14,22,38,0.08)] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[var(--color-muted)]">
                Showing{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {
                    filteredAppointments.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {
                    visibleAppointments.length
                  }
                </span>{" "}
                appointments
              </p>

              {doctorsError && (
                <p className="mt-1 text-xs text-[var(--color-alert)]">
                  Doctor list could not be
                  loaded. Existing appointment
                  doctors are still available.
                </p>
              )}
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="self-start text-xs font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80 sm:self-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================
          UPCOMING
      ================================= */}

      {showUpcoming && (
        <div className="mt-8">
          <p className="mediform-mono-label">
            Upcoming
          </p>

          {filteredUpcomingAppointments.length >
          0 ? (
            <div className="mt-4 grid gap-4">
              {filteredUpcomingAppointments.map(
                (appointment) => (
                  <AppointmentCard
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    status="UPCOMING"
                    onSelect={
                      onSelect
                    }
                    onEdit={onEdit}
                    onCancel={
                      onCancel
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                No upcoming appointments
                match your filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================
          CONSULTATION HISTORY
      ================================= */}

      {showHistory && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <p className="mediform-mono-label">
              Consultation History
            </p>

            {filteredPastAppointments.length >
              0 && (
              <span className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
                {
                  filteredPastAppointments.length
                }{" "}
                FOUND
              </span>
            )}
          </div>

          {filteredPastAppointments.length >
          0 ? (
            <div className="mt-4 grid gap-4">
              {filteredPastAppointments.map(
                (appointment) => (
                  <AppointmentCard
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    status="PAST"
                    onSelect={
                      onSelect
                    }
                    onEdit={onEdit}
                    onCancel={
                      onCancel
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                No historical appointments
                match your filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================
          ALL FILTERED RESULT EMPTY
      ================================= */}

      {filteredAppointments.length ===
        0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No appointments found matching
            your criteria.
          </p>

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="mt-4 rounded-[var(--radius-input)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90"
          >
            Clear Filters
          </button>
        </div>
      )}
    </section>
  );
}

export default AppointmentList;