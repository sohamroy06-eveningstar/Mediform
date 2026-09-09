import useAppointmentContext from "./useAppointmentContext";

function useAppointments() {
  const {
    appointments,
    setAppointments,
  } = useAppointmentContext();

  function addAppointment(appointment) {
    setAppointments((currentAppointments) => [
      ...currentAppointments,
      appointment,
    ]);
  }

   function updateAppointment(updatedAppointment) {
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment,
      ),
    );
  }

  function cancelAppointment(appointmentId) {
  setAppointments((currentAppointments) =>
    currentAppointments.filter(
      (appointment) => appointment.id !== appointmentId,
    ),
  );
}

function getAppointmentById(appointmentId) {
  return appointments.find(
    (appointment) => appointment.id === appointmentId,
  );
}

  return {
    appointments,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    getAppointmentById,
    setAppointments,
  };
}

export default useAppointments;