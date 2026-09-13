import { useEffect, useState } from "react";
import AppointmentContext from "./appointmentContext.js";

import {
  createAppointment as createAppointmentApi,
  fetchAppointments,
  updateAppointment as updateAppointmentApi,
  deleteAppointment as deleteAppointmentApi,
} from "../service/appointmentService.js";

function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function addAppointment(appointment) {
    const response = await createAppointmentApi(appointment);

    setAppointments((currentAppointments) => [
      ...currentAppointments,
      response.data,
    ]);

    return response.data;
  }

  async function updateAppointment(updatedAppointment) {
    const response = await updateAppointmentApi(
      updatedAppointment.id,
      updatedAppointment,
    );

    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? response.data
          : appointment,
      ),
    );

    return response.data;
  }

  async function cancelAppointment(appointmentId) {
    await deleteAppointmentApi(appointmentId);

    setAppointments((currentAppointments) =>
      currentAppointments.filter(
        (appointment) => appointment.id !== appointmentId,
      ),
    );
  }

  useEffect(() => {
    async function loadAppointments() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetchAppointments();

        setAppointments(response.data);
      } catch (error) {
        console.error("Failed to load appointments:", error);
        setError("Unable to load appointments.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);

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