export function mapAppointment(appointment) {
  return {
    id: appointment.id,
    patientName: appointment.patient_name,
    doctorName: appointment.doctor_name,
      date:
  appointment.appointment_date instanceof Date
    ? appointment.appointment_date.toISOString().slice(0, 10)
    : appointment.appointment_date,
    time: appointment.appointment_time,
    reason: appointment.reason,
    notes: appointment.notes,
    mediaUrls: appointment.media_urls,
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
  };
}