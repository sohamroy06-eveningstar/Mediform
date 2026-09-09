import { useMemo, useState } from "react";
import AppointmentCard from "./AppointmentCard";
import useAppointments from "../hooks/useAppointments";
import { getAppointmentStatus } from "../utils/dateUtils";

function AppointmentList({
  onSelect,
  onEdit,
  onCancel,
  excludeAppointmentId,
}) {
  const { appointments } = useAppointments();

  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Remove the primary upcoming appointment from this list
  const visibleAppointments = appointments.filter(
    (appointment) => appointment.id !== excludeAppointmentId,
  );

  // Unique doctor names for the filter
  const doctors = [
    ...new Set(
      visibleAppointments.map(
        (appointment) => appointment.doctorName,
      ),
    ),
  ];

  // Upcoming appointments
  const upcomingAppointments = visibleAppointments.filter(
    (appointment) =>
      getAppointmentStatus(appointment.date) === "UPCOMING",
  );

  // Past appointments
  const pastAppointments = visibleAppointments.filter(
    (appointment) =>
      getAppointmentStatus(appointment.date) === "PAST",
  );

  // Apply filters ONLY to past appointments
const filteredHistory = useMemo(() => {
  const filtered = pastAppointments.filter((appointment) => {
    const doctorMatches =
      doctorFilter === "ALL" ||
      appointment.doctorName === doctorFilter;

    const statusMatches =
      statusFilter === "ALL" ||
      getAppointmentStatus(appointment.date) === statusFilter;

    return doctorMatches && statusMatches;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === "NEWEST") {
      return (
        new Date(`${b.date}T${b.time}`) -
        new Date(`${a.date}T${a.time}`)
      );
    }

    if (sortBy === "OLDEST") {
      return (
        new Date(`${a.date}T${a.time}`) -
        new Date(`${b.date}T${b.time}`)
      );
    }

    if (sortBy === "DOCTOR_ASC") {
      return a.doctorName.localeCompare(b.doctorName);
    }

    if (sortBy === "DOCTOR_DESC") {
      return b.doctorName.localeCompare(a.doctorName);
    }

    return 0;
  });
}, [
  pastAppointments,
  doctorFilter,
  statusFilter,
  sortBy,
]);
  // No appointments at all
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

  return (
    <section>
      {/* Section Heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mediform-mono-label">
            Appointment List
          </p>

          <h2 className="mt-2 font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]">
            Your Appointments
          </h2>
        </div>

        <span className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
          {appointments.length} TOTAL
        </span>
      </div>

      {/* Upcoming */}
      {upcomingAppointments.length > 0 && (
        <div className="mt-8">
          <p className="mediform-mono-label">
            Upcoming
          </p>

          <div className="mt-4 grid gap-4">
            {upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                status="UPCOMING"
                onSelect={onSelect}
                onEdit={onEdit}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Consultation History */}
      <div className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="mediform-mono-label">
            Consultation History
          </p>

          {/* Filters */}
         <div className="flex flex-col gap-3 sm:flex-row">
  <label className="flex flex-col gap-2">
    <span className="mediform-mono-label">Doctor</span>

    <select
      value={doctorFilter}
      onChange={(event) => setDoctorFilter(event.target.value)}
      className="min-w-44 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
    >
      <option value="ALL">All Doctors</option>

      {doctors.map((doctor) => (
        <option key={doctor} value={doctor}>
          {doctor}
        </option>
      ))}
    </select>
  </label>

  <label className="flex flex-col gap-2">
    <span className="mediform-mono-label">Status</span>

    <select
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value)}
      className="min-w-44 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
    >
      <option value="ALL">All Status</option>
      <option value="UPCOMING">Upcoming</option>
      <option value="PAST">Past</option>
    </select>
  </label>

  <label className="flex flex-col gap-2">
    <span className="mediform-mono-label">Sort</span>

    <select
      value={sortBy}
      onChange={(event) => setSortBy(event.target.value)}
      className="min-w-44 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
    >
      <option value="NEWEST">Newest First</option>
      <option value="OLDEST">Oldest First</option>
      <option value="DOCTOR_ASC">Doctor A → Z</option>
      <option value="DOCTOR_DESC">Doctor Z → A</option>
    </select>
  </label>
</div>
        </div>

        {/* History Results */}
        {pastAppointments.length > 0 ? (
          filteredHistory.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {filteredHistory.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  status="PAST"
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onCancel={onCancel}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                No historical appointments found matching your criteria.
              </p>
            </div>
          )
        ) : (
          <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No historical appointments found.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AppointmentList;