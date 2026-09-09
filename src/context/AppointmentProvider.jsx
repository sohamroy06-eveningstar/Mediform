import { useState } from "react";
import AppointmentContext from "./appointmentContext.js";
import appointmentsData from "../data/Appointment";

function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState(appointmentsData);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        setAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export default AppointmentProvider;