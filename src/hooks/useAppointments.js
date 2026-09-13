import useAppointmentContext from "./useAppointmentContext";

function useAppointments() {
  const {
    appointments,
    setAppointments,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    isLoading,
    error,
  } = useAppointmentContext();

 


  function getAppointmentById(appointmentId) {
    return appointments.find(
      (appointment) => appointment.id === appointmentId,
    );
  }

  return {
    appointments,
    addAppointment,
    cancelAppointment,
    getAppointmentById,
    setAppointments,
    updateAppointment,
    isLoading,
    error,
  };
}

export default useAppointments;