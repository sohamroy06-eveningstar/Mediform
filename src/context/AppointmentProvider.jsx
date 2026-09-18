import {
  useEffect,
  useState,
} from "react";

import AppointmentContext from "./appointmentContext.js";

import {
  createAppointment as createAppointmentApi,
  fetchAppointments,
  updateAppointment as updateAppointmentApi,
  deleteAppointment as deleteAppointmentApi,
} from "../service/appointmentService.js";

function AppointmentProvider({
  children,
  adminMode = false,
}) {
  const [appointments, setAppointments] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function addAppointment(
    appointment,
  ) {
    const response =
      await createAppointmentApi(
        appointment,
      );

    setAppointments(
      (current) => [
        ...current,
        response.data,
      ],
    );

    return response.data;
  }

  async function updateAppointment(
    updatedAppointment,
  ) {
    const response =
      await updateAppointmentApi(
        updatedAppointment.id,
        updatedAppointment,
      );

    setAppointments(
      (current) =>
        current.map((appointment) =>
          appointment.id ===
          updatedAppointment.id
            ? response.data
            : appointment,
        ),
    );

    return response.data;
  }

  async function cancelAppointment(
    appointmentId,
  ) {
    await deleteAppointmentApi(
      appointmentId,
    );

    setAppointments(
      (current) =>
        current.filter(
          (appointment) =>
            appointment.id !==
            appointmentId,
        ),
    );
  }

  useEffect(() => {
    let mounted = true;

    async function loadAppointments() {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetchAppointments({
            all: adminMode,
          });

        if (!mounted) return;

        setAppointments(
          response.data || [],
        );
      } catch (error) {
        console.error(
          "Failed to load appointments:",
          error,
        );

        if (mounted) {
          setError(
            error.message ||
              "Unable to load appointments.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      mounted = false;
    };
  }, [adminMode]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        setAppointments,
        isLoading,
        error,
        addAppointment,
        updateAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export default AppointmentProvider;