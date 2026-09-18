import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock,
  History,
  CalendarCheck,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserRound,
  Video,
  MapPin,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Languages,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import useAppointments from "../hooks/useAppointments";

import AppointmentDetails from "../Components/AppointementDetails";
import AppointmentForm from "../Components/AppointmentForm";
import DoctorForm from "../Components/DoctorForm";

import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../service/doctorService";
import {
  fetchProtectedMedia,
} from "../service/mediaService";

function AdminPanel() {
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    updateAppointment,
    cancelAppointment,
  } = useAppointments();

  /* =========================
     APPOINTMENT STATE
  ========================= */

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [appointmentSearch, setAppointmentSearch] =
    useState("");

  const [appointmentDateFilter, setAppointmentDateFilter] =
    useState("all");

  const [appointmentStats, setAppointmentStats] =
    useState({
      total: 0,
      upcoming: 0,
      today: 0,
      past: 0,
    });

  /* =========================
     DOCTOR STATE
  ========================= */

  const [doctors, setDoctors] = useState([]);

  const [doctorsLoading, setDoctorsLoading] =
    useState(true);

  const [doctorsError, setDoctorsError] =
    useState("");

  const [doctorSearch, setDoctorSearch] =
    useState("");

  const [doctorStatusFilter, setDoctorStatusFilter] =
    useState("all");

  const [doctorFormOpen, setDoctorFormOpen] =
    useState(false);

  const [editingDoctor, setEditingDoctor] =
    useState(null);

  const [selectedDoctor, setSelectedDoctor] =
    useState(null);

  /* =========================
     ACTIVE TAB
  ========================= */

  const [activeTab, setActiveTab] =
    useState("appointments");

  /* =========================
     APPOINTMENT STATS
  ========================= */

  useEffect(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    let upcoming = 0;
    let todayCount = 0;
    let past = 0;

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(
        `${appointment.date}T00:00:00`,
      );

      if (
        Number.isNaN(
          appointmentDate.getTime(),
        )
      ) {
        return;
      }

      if (
        appointmentDate.getTime() ===
        today.getTime()
      ) {
        todayCount += 1;
      }

      if (appointmentDate >= today) {
        upcoming += 1;
      } else {
        past += 1;
      }
    });

    setAppointmentStats({
      total: appointments.length,
      upcoming,
      today: todayCount,
      past,
    });
  }, [appointments]);

  /* =========================
     LOAD DOCTORS
  ========================= */

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    try {
      setDoctorsLoading(true);
      setDoctorsError("");

      const response = await fetchDoctors();

      setDoctors(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load doctors:",
        error,
      );

      setDoctorsError(
        error.message ||
          "Unable to load doctors.",
      );
    } finally {
      setDoctorsLoading(false);
    }
  }

  /* =========================
     FILTER APPOINTMENTS
  ========================= */

  const filteredAppointments =
    appointments.filter(
      (appointment) => {
        const search =
          appointmentSearch
            .trim()
            .toLowerCase();

        const patientName =
          appointment.patientName?.toLowerCase() ||
          "";

        const doctorName =
          appointment.doctorName?.toLowerCase() ||
          "";

        const appointmentId =
          appointment.id?.toLowerCase() ||
          "";

        const reason =
          appointment.reason?.toLowerCase() ||
          "";

        const matchesSearch =
          !search ||
          patientName.includes(search) ||
          doctorName.includes(search) ||
          appointmentId.includes(search) ||
          reason.includes(search);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const appointmentDate =
          new Date(
            `${appointment.date}T00:00:00`,
          );

        let matchesDate = true;

        if (
          !Number.isNaN(
            appointmentDate.getTime(),
          )
        ) {
          if (
            appointmentDateFilter ===
            "today"
          ) {
            matchesDate =
              appointmentDate.getTime() ===
              today.getTime();
          }

          if (
            appointmentDateFilter ===
            "upcoming"
          ) {
            matchesDate =
              appointmentDate >= today;
          }

          if (
            appointmentDateFilter ===
            "past"
          ) {
            matchesDate =
              appointmentDate < today;
          }
        }

        return (
          matchesSearch &&
          matchesDate
        );
      },
    );

  /* =========================
     FILTER DOCTORS
  ========================= */

  const filteredDoctors =
    doctors.filter((doctor) => {
      const search =
        doctorSearch
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        doctor.fullName
          ?.toLowerCase()
          .includes(search) ||
        doctor.specialization
          ?.toLowerCase()
          .includes(search) ||
        doctor.qualification
          ?.toLowerCase()
          .includes(search) ||
        doctor.hospitalName
          ?.toLowerCase()
          .includes(search) ||
        doctor.location
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        doctorStatusFilter === "all" ||
        doctor.status ===
          doctorStatusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  /* =========================
     APPOINTMENT ACTIONS
  ========================= */

  function handleViewAppointment(
    appointment,
  ) {
    setSelectedAppointment(
      appointment,
    );
  }

  function handleEditAppointment(
    appointment,
  ) {
    setSelectedAppointment(null);

    setEditingAppointment(
      appointment,
    );
  }

  async function handleEditAppointmentSubmit(
    updatedAppointment,
  ) {
    try {
      await updateAppointment(
        updatedAppointment,
      );

      setEditingAppointment(null);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title:
          "Appointment updated successfully.",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(
        "Admin appointment update failed:",
        error,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title:
          "Unable to update appointment.",
        text: error.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }

  async function handleCancelAppointment(
    appointment,
  ) {
    const result =
      await Swal.fire({
        title:
          "Cancel appointment?",
        text: `Cancel the appointment with ${appointment.doctorName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          "Yes, cancel",
        cancelButtonText:
          "Keep appointment",
        reverseButtons: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await cancelAppointment(
        appointment.id,
      );

      setSelectedAppointment(
        null,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title:
          "Appointment cancelled.",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(
        "Admin appointment cancellation failed:",
        error,
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title:
          "Unable to cancel appointment.",
        text: error.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  }

  /* =========================
     DOCTOR ACTIONS
  ========================= */

  function handleAddDoctor() {
    setEditingDoctor(null);
    setDoctorFormOpen(true);
  }

  function handleEditDoctor(doctor) {
    setSelectedDoctor(null);
    setEditingDoctor(doctor);
    setDoctorFormOpen(true);
  }

  function handleViewDoctor(doctor) {
    setSelectedDoctor(doctor);
  }

  async function handleDoctorSubmit(
    doctor,
  ) {
    try {
      if (editingDoctor) {
        const response =
          await updateDoctor(
            editingDoctor.id,
            doctor,
          );

        setDoctors((current) =>
          current.map((item) =>
            item.id ===
            editingDoctor.id
              ? response.data
              : item,
          ),
        );

        setSelectedDoctor(
          response.data,
        );

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title:
            "Doctor updated successfully.",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });
      } else {
        const response =
          await createDoctor(
            doctor,
          );

        setDoctors((current) => [
          response.data,
          ...current,
        ]);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title:
            "Doctor added successfully.",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });
      }

      setDoctorFormOpen(false);
      setEditingDoctor(null);
    } catch (error) {
      console.error(
        "Doctor save failed:",
        error,
      );

      throw error;
    }
  }

  async function handleDeleteDoctor(
    doctor,
  ) {
    await deleteDoctor(doctor.id);

    setDoctors((current) =>
      current.filter(
        (item) =>
          item.id !== doctor.id,
      ),
    );

    setSelectedDoctor(null);
    setDoctorFormOpen(false);
    setEditingDoctor(null);
  }

  function clearAppointmentFilters() {
    setAppointmentSearch("");
    setAppointmentDateFilter("all");
  }

  function clearDoctorFilters() {
    setDoctorSearch("");
    setDoctorStatusFilter("all");
  }

  /* =========================
     DETAIL VIEW
  ========================= */

  if (selectedAppointment) {
    return (
      <AppointmentDetails
        appointment={
          selectedAppointment
        }
        onBack={() =>
          setSelectedAppointment(null)
        }
        onEdit={
          handleEditAppointment
        }
        onCancel={
          handleCancelAppointment
        }
      />
    );
  }

  /* =========================
     APPOINTMENT LOADING
  ========================= */

  if (
    activeTab === "appointments" &&
    appointmentsLoading
  ) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[var(--color-background)]">
        <PageLoader text="Loading appointments..." />
      </main>
    );
  }

  /* =========================
     APPOINTMENT ERROR
  ========================= */

  if (
    activeTab === "appointments" &&
    appointmentsError
  ) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[var(--color-background)] px-4">
        <ErrorState
          message={
            appointmentsError
          }
        />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mediform-mono-label">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)]">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
              Manage appointments, doctors,
              availability and telehealth settings
              from one place.
            </p>
          </div>

        </div>

        {/* =========================
            TABS
        ========================= */}

        <div className="mb-6 flex w-full gap-2 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white p-1">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "appointments",
              )
            }
            className={`rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              activeTab ===
              "appointments"
                ? "bg-[var(--color-primary)] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Appointments
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("doctors")
            }
            className={`rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              activeTab === "doctors"
                ? "bg-[var(--color-primary)] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Doctors
          </button>
        </div>

        {/* =========================
            APPOINTMENTS TAB
        ========================= */}

        {activeTab ===
          "appointments" && (
          <>
            {/* Statistics */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Appointments"
                value={
                  appointmentStats.total
                }
                icon={CalendarDays}
              />

              <StatCard
                title="Upcoming"
                value={
                  appointmentStats.upcoming
                }
                icon={Clock}
              />

              <StatCard
                title="Today"
                value={
                  appointmentStats.today
                }
                icon={
                  CalendarCheck
                }
              />

              <StatCard
                title="Past"
                value={
                  appointmentStats.past
                }
                icon={History}
              />
            </div>

            {/* Appointment Section */}

            <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              {/* Header */}

              <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                      All Appointments
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Search, inspect, edit and
                      cancel appointments.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    {/* Search */}

                    <div className="relative w-full sm:w-72">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="search"
                        value={
                          appointmentSearch
                        }
                        onChange={(
                          event,
                        ) =>
                          setAppointmentSearch(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Search appointments..."
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      />
                    </div>

                    {/* Date filter */}

                    <div className="relative w-full sm:w-44">
                      <SlidersHorizontal
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <select
                        value={
                          appointmentDateFilter
                        }
                        onChange={(
                          event,
                        ) =>
                          setAppointmentDateFilter(
                            event.target
                              .value,
                          )
                        }
                        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-[var(--color-primary)]"
                      >
                        <option value="all">
                          All Dates
                        </option>

                        <option value="today">
                          Today
                        </option>

                        <option value="upcoming">
                          Upcoming
                        </option>

                        <option value="past">
                          Past
                        </option>
                      </select>

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--color-muted)]">
                    Showing{" "}
                    <span className="font-medium text-gray-700">
                      {
                        filteredAppointments.length
                      }
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-700">
                      {
                        appointments.length
                      }
                    </span>{" "}
                    appointments
                  </p>

                  {(appointmentSearch ||
                    appointmentDateFilter !==
                      "all") && (
                    <button
                      type="button"
                      onClick={
                        clearAppointmentFilters
                      }
                      className="text-xs font-medium text-[var(--color-primary)]"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Empty */}

              {appointments.length ===
              0 ? (
                <EmptyState
                  icon={
                    CalendarDays
                  }
                  title="No appointments found."
                  description="There are currently no appointments to display."
                />
              ) : filteredAppointments.length ===
                0 ? (
                <EmptyState
                  icon={Search}
                  title="No matching appointments"
                  description="Try changing your search or date filter."
                  action={
                    <button
                      type="button"
                      onClick={
                        clearAppointmentFilters
                      }
                      className="mt-5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
                    >
                      Clear Filters
                    </button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px]">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-gray-50 text-left">
                        <TableHead>
                          Patient
                        </TableHead>

                        <TableHead>
                          Doctor
                        </TableHead>

                        <TableHead>
                          Date
                        </TableHead>

                        <TableHead>
                          Time
                        </TableHead>

                        <TableHead>
                          Reason
                        </TableHead>

                        <TableHead>
                          ID
                        </TableHead>

                        <TableHead>
                          Actions
                        </TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAppointments.map(
                        (
                          appointment,
                        ) => (
                          <tr
                            key={
                              appointment.id
                            }
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">
                                {appointment.patientName ||
                                  "Unknown patient"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-700">
                              {appointment.doctorName ||
                                "Unknown doctor"}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-700">
                              {appointment.date ||
                                "—"}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-700">
                              {appointment.time ||
                                "—"}
                            </td>

                            <td className="max-w-[220px] px-5 py-4 text-sm text-gray-700">
                              <span className="line-clamp-2">
                                {appointment.reason ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                                {
                                  appointment.id
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <ActionButton
                                  icon={
                                    Eye
                                  }
                                  label="View"
                                  onClick={() =>
                                    handleViewAppointment(
                                      appointment,
                                    )
                                  }
                                />

                                <ActionButton
                                  icon={
                                    Pencil
                                  }
                                  label="Edit"
                                  onClick={() =>
                                    handleEditAppointment(
                                      appointment,
                                    )
                                  }
                                />

                                <ActionButton
                                  icon={
                                    Trash2
                                  }
                                  label="Cancel"
                                  danger
                                  onClick={() =>
                                    handleCancelAppointment(
                                      appointment,
                                    )
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* =========================
            DOCTORS TAB
        ========================= */}

        {activeTab === "doctors" && (
          <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            {/* Doctors Header */}

            <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Doctors
                  </h2>

                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Manage healthcare professionals,
                    profiles and telehealth availability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleAddDoctor
                  }
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  + Add Doctor
                </button>
              </div>

              {/* Doctor search/filter */}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:max-w-md">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="search"
                    value={doctorSearch}
                    onChange={(event) =>
                      setDoctorSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search doctors..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="relative w-full sm:w-44">
                  <SlidersHorizontal
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={
                      doctorStatusFilter
                    }
                    onChange={(event) =>
                      setDoctorStatusFilter(
                        event.target
                          .value,
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    <option value="all">
                      All Status
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ▼
                  </span>
                </div>

                {(doctorSearch ||
                  doctorStatusFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={
                      clearDoctorFilters
                    }
                    className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs text-[var(--color-muted)]">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {
                      filteredDoctors.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {doctors.length}
                  </span>{" "}
                  doctors
                </p>
              </div>
            </div>

            {/* Doctor Loading */}

            {doctorsLoading ? (
              <div className="px-6 py-16">
                <PageLoader text="Loading doctors..." />
              </div>
            ) : doctorsError ? (
              <div className="px-6 py-14 text-center">
                <ErrorState
                  message={
                    doctorsError
                  }
                />

                <button
                  type="button"
                  onClick={
                    loadDoctors
                  }
                  className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
                >
                  Try Again
                </button>
              </div>
            ) : doctors.length ===
              0 ? (
              <EmptyState
                icon={UserRound}
                title="No doctors found."
                description="Add your first doctor to start managing your healthcare professionals."
                
                
              />
            ) : filteredDoctors.length ===
              0 ? (
              <EmptyState
                icon={Search}
                title="No matching doctors"
                description="Try changing your search or status filter."
                action={
                  <button
                    type="button"
                    onClick={
                      clearDoctorFilters
                    }
                    className="mt-5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-gray-50 text-left">
                      <TableHead>
                        Doctor
                      </TableHead>

                      <TableHead>
                        Specialization
                      </TableHead>

                      <TableHead>
                        Experience
                      </TableHead>

                      <TableHead>
                        Fee
                      </TableHead>

                      <TableHead>
                        Telehealth
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Actions
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDoctors.map(
                      (doctor) => (
                        <tr
                          key={
                            doctor.id
                          }
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          {/* Doctor */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <DoctorAvatar
                                doctor={
                                  doctor
                                }
                                size="sm"
                              />

                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {
                                    doctor.fullName
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {
                                    doctor.qualification
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Specialization */}

                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700">
                              {
                                doctor.specialization
                              }
                            </p>

                            {doctor.department && (
                              <p className="mt-1 text-xs text-gray-500">
                                {
                                  doctor.department
                                }
                              </p>
                            )}
                          </td>

                          {/* Experience */}

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {
                              doctor.experienceYears
                            }{" "}
                            years
                          </td>

                          {/* Fee */}

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {doctor.consultationFee !==
                              null &&
                            doctor.consultationFee !==
                              ""
                              ? `₹${Number(
                                  doctor.consultationFee,
                                ).toLocaleString(
                                  "en-IN",
                                )}`
                              : "—"}
                          </td>

                          {/* Telehealth */}

                          <td className="px-5 py-4">
                            {doctor.telehealthEnabled ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <Video
                                  size={
                                    13
                                  }
                                />
                                Available
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not available
                              </span>
                            )}
                          </td>

                          {/* Status */}

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                doctor.status
                              }
                            />
                          </td>

                          {/* Actions */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <ActionButton
                                icon={
                                  Eye
                                }
                                label="View"
                                onClick={() =>
                                  handleViewDoctor(
                                    doctor,
                                  )
                                }
                              />

                              <ActionButton
                                icon={
                                  Pencil
                                }
                                label="Edit"
                                onClick={() =>
                                  handleEditDoctor(
                                    doctor,
                                  )
                                }
                              />

                              <ActionButton
                                icon={
                                  Trash2
                                }
                                label="Delete"
                                danger
                                onClick={async () => {
                                  const result =
                                    await Swal.fire(
                                      {
                                        title:
                                          "Delete doctor?",
                                        text: `Delete ${doctor.fullName}?`,
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText:
                                          "Yes, delete",
                                        cancelButtonText:
                                          "Keep doctor",
                                        reverseButtons:
                                          true,
                                      },
                                    );

                                  if (
                                    !result.isConfirmed
                                  ) {
                                    return;
                                  }

                                  try {
                                    await handleDeleteDoctor(
                                      doctor,
                                    );

                                    Swal.fire({
                                      toast: true,
                                      position:
                                        "top-end",
                                      icon: "success",
                                      title:
                                        "Doctor deleted successfully.",
                                      showConfirmButton: false,
                                      timer: 2500,
                                      timerProgressBar:
                                        true,
                                    });
                                  } catch (
                                    error
                                  ) {
                                    console.error(
                                      "Doctor deletion failed:",
                                      error,
                                    );

                                    Swal.fire({
                                      toast: true,
                                      position:
                                        "top-end",
                                      icon: "error",
                                      title:
                                        "Unable to delete doctor.",
                                      text:
                                        error.message,
                                      showConfirmButton: false,
                                      timer: 3000,
                                      timerProgressBar:
                                        true,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* =========================
          DOCTOR FORM
      ========================= */}

      {doctorFormOpen && (
        <DoctorForm
          initialData={
            editingDoctor
          }
          onSubmit={
            handleDoctorSubmit
          }
          onDelete={
            handleDeleteDoctor
          }
          onCancel={() => {
            setDoctorFormOpen(false);
            setEditingDoctor(null);
          }}
        />
      )}

      {/* =========================
          DOCTOR DETAILS MODAL
      ========================= */}

      {selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() =>
            setSelectedDoctor(
              null,
            )
          }
          onEdit={() =>
            handleEditDoctor(
              selectedDoctor,
            )
          }
        />
      )}

      {/* =========================
          EDIT APPOINTMENT
      ========================= */}

      {editingAppointment && (
        <AppointmentForm
          initialData={
            editingAppointment
          }
          onSubmit={
            handleEditAppointmentSubmit
          }
          onCancel={() =>
            setEditingAppointment(
              null,
            )
          }
        />
      )}
    </main>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted)]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 p-3">
          <Icon
            size={21}
            className="text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================
   TABLE HEAD
========================================= */

function TableHead({
  children,
}) {
  return (
    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =========================================
   ACTION BUTTON
========================================= */

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition ${
        danger
          ? "border-red-200 text-red-500 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}) {
  const isActive =
    status === "ACTIVE";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

/* =========================================
   EMPTY STATE
========================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Icon
        size={40}
        className="mx-auto text-gray-400"
      />

      <p className="mt-4 font-medium text-gray-700">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        {description}
      </p>

      {action}
    </div>
  );
}

/* =========================================
   PAGE LOADER
========================================= */

function PageLoader({
  text,
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <div
          className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
          aria-label={text}
        />

        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================
   ERROR STATE
========================================= */

function ErrorState({
  message,
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-600">
        {message}
      </p>
    </div>
  );
}

/* =========================================
   DOCTOR AVATAR
========================================= */

function DoctorAvatar({
  doctor,
  size = "md",
}) {
  const [imageUrl, setImageUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [imageError, setImageError] =
    useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    const pathname =
      doctor?.profileImage?.pathname;

    async function resolveImage() {
      setLoading(true);
      setImageError(false);

      /*
       * No profile image.
       */
      if (!pathname) {
        if (!cancelled) {
          setImageUrl(
            doctor?.profileImage?.url ||
              "",
          );

          setLoading(false);
        }

        return;
      }

      try {
        /*
         * IMPORTANT:
         * Never expose the private Blob URL
         * directly to the browser.
         *
         * /api/media/file streams the private
         * Blob through our authenticated API.
         */
        objectUrl =
          await fetchProtectedMedia(
            pathname,
          );

        if (!cancelled) {
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error(
          "Doctor image loading failed:",
          error,
        );

        if (!cancelled) {
          setImageUrl("");
          setImageError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    resolveImage();

    return () => {
      cancelled = true;

      /*
       * Prevent Blob URL memory leaks.
       */
      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        );
      }
    };
  }, [
    doctor?.profileImage?.pathname,
    doctor?.profileImage?.url,
  ]);

  const dimension =
    size === "sm"
      ? "h-11 w-11"
      : "h-20 w-20";

  /*
   * Loading
   */
  if (loading) {
    return (
      <div
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-xl bg-gray-100`}
        aria-label="Loading doctor image"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  /*
   * Image failed / unavailable
   */
  if (imageError || !imageUrl) {
    return (
      <div
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-xl bg-gray-100`}
        aria-label="Doctor image unavailable"
      >
        <UserRound
          size={
            size === "sm"
              ? 19
              : 30
          }
          className="text-gray-400"
        />
      </div>
    );
  }

  /*
   * Successfully loaded image
   */
  return (
    <img
      src={imageUrl}
      alt={
        doctor?.fullName ||
        "Doctor"
      }
      className={`${dimension} shrink-0 rounded-xl object-cover`}
      onError={() => {
        setImageUrl("");
        setImageError(true);
      }}
    />
  );
}
/* =========================================
   DOCTOR DETAILS MODAL
========================================= */

function DoctorDetailsModal({
  doctor,
  onClose,
  onEdit,
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
          <div>
            <p className="mediform-mono-label">
              Doctor Details
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {doctor.fullName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Close doctor details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}

        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <DoctorAvatar
              doctor={doctor}
              size="md"
            />

            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                {
                  doctor.specialization
                }
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {
                  doctor.qualification
                }
              </p>

              <div className="mt-3">
                <StatusBadge
                  status={
                    doctor.status
                  }
                />
              </div>
            </div>
          </div>

          {/* Basic */}

          <div className="mt-8 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <DetailItem
              icon={GraduationCap}
              label="Qualification"
              value={
                doctor.qualification
              }
            />

            <DetailItem
              icon={Clock}
              label="Experience"
              value={`${doctor.experienceYears} years`}
            />

            <DetailItem
              icon={Phone}
              label="Phone"
              value={
                doctor.phone ||
                "Not provided"
              }
            />

            <DetailItem
              icon={Mail}
              label="Email"
              value={
                doctor.email ||
                "Not provided"
              }
            />

            <DetailItem
              icon={Building2}
              label="Hospital / Clinic"
              value={
                doctor.hospitalName ||
                "Not provided"
              }
            />

            <DetailItem
              icon={MapPin}
              label="Location"
              value={
                doctor.location ||
                "Not provided"
              }
            />

            <DetailItem
              icon={Languages}
              label="Languages"
              value={
                doctor.languages?.length
                  ? doctor.languages.join(
                      ", ",
                    )
                  : "Not provided"
              }
            />

            <DetailItem
              icon={CalendarDays}
              label="Available Days"
              value={
                doctor.availableDays?.length
                  ? doctor.availableDays.join(
                      ", ",
                    )
                  : "Not provided"
              }
            />
          </div>

          {/* Schedule */}

          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              Availability
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {doctor.availableFrom &&
              doctor.availableTo
                ? `${doctor.availableFrom} - ${doctor.availableTo}`
                : "Schedule not configured"}
            </p>
          </div>

          {/* Telehealth */}

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Telehealth
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {doctor.telehealthEnabled
                    ? "Online consultation is available."
                    : "Online consultation is not available."}
                </p>
              </div>

              {doctor.telehealthEnabled && (
                <Video
                  size={22}
                  className="text-green-600"
                />
              )}
            </div>
          </div>

          {/* Fee */}

          {doctor.consultationFee !==
            null &&
            doctor.consultationFee !==
              "" && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Consultation Fee
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  ₹
                  {Number(
                    doctor.consultationFee,
                  ).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>
            )}

          {/* Bio */}

          {doctor.bio && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-sm font-semibold text-gray-900">
                About Doctor
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {doctor.bio}
              </p>
            </div>
          )}

          {/* Actions */}

          <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Edit Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   DETAIL ITEM
========================================= */

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon
          size={17}
          className="text-gray-600"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default AdminPanel;