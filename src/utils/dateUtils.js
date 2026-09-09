export function getAppointmentStatus(date) {
  const appointmentDate = new Date(`${date}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (appointmentDate >= today) {
    return "UPCOMING";
  }

  return "PAST";
}

export function formatAppointmentDate(date) {
  const appointmentDate = new Date(`${date}T00:00:00`);

  return appointmentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}