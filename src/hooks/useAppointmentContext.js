import { useContext } from "react";
import AppointmentContext from "../context/appointmentContext.js";

function useAppointmentContext() {
  const context = useContext(AppointmentContext);

  if (!context) {
    throw new Error(
      "useAppointmentContext must be used inside AppointmentProvider",
    );
  }

  return context;
}

export default useAppointmentContext;