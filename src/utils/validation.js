export function validateAppointment(formFields) {
  const errors = {};

  if (!formFields.patientName.trim()) {
    errors.patientName = "Patient name is required.";
  }

  if (!formFields.doctorName) {
    errors.doctorName = "Please select a doctor.";
  }

  if (!formFields.date) {
    errors.date = "Date is required.";
  }

  if (!formFields.time) {
    errors.time = "Time is required.";
  }

  if (!formFields.reason.trim()) {
    errors.reason = "Reason is required.";
  }

  if (formFields.date && formFields.time) {
    const appointmentDateTime = new Date(
      `${formFields.date}T${formFields.time}`,
    );

    if (
      Number.isNaN(appointmentDateTime.getTime()) ||
      appointmentDateTime <= new Date()
    ) {
      errors.date = "Appointment date and time must be in the future.";
      errors.time = "Appointment date and time must be in the future.";
    }
  }

  return errors;
}