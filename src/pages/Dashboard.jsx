import { useState } from "react";
import BookingCTA from "../Components/BookingCTA";
import UpcomingAppointment from "../Components/UpcomingAppointment";
import AppointmentList from "../Components/AppointmentList";
import AppointmentDetails from "../Components/AppointementDetails";
import AppointmentForm from "../Components/AppointmentForm";
import useAppointments from "../hooks/useAppointments";
import Swal from "sweetalert2";
import { getAppointmentStatus } from "../utils/dateUtils";

function Dashboard() {
  const {
    appointments,
    addAppointment,
     setAppointments,
     updateAppointment,
       cancelAppointment,
  } = useAppointments();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      getAppointmentStatus(appointment.date) === "UPCOMING",
  );

  const primaryUpcomingAppointment = upcomingAppointments[0];

  if (selectedAppointment) {
    return (
      <AppointmentDetails
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
         onEdit={handleEdit}
         onCancel={handleCancel}
      />
    );
  }

  function handleBook() {
    setIsBookingOpen(true);
  }

  async function handleBookingSubmit(appointment) {
  try {
    await addAppointment(appointment);

    setIsBookingOpen(false);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Appointment booked successfully.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error("Booking failed:", error);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "Unable to book appointment.",
      text: error.message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }
}
  function handleSelect(appointment) {
    setSelectedAppointment(appointment);
  }

function handleEdit(appointment) {
  setSelectedAppointment(null);
  setEditingAppointment(appointment);
}

async function handleEditSubmit(updatedAppointment) {
  try {
    await updateAppointment(updatedAppointment);

    setEditingAppointment(null);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Appointment updated successfully.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error("Update appointment failed:", error);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "Unable to update appointment.",
      text: error.message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }
}

  async function handleCancel(appointment) {
  const result = await Swal.fire({
    title: "Cancel appointment?",
    text: `Cancel the appointment with ${appointment.doctorName}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "Keep appointment",
    reverseButtons: true,
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    await cancelAppointment(appointment.id);

    setSelectedAppointment(null);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Appointment cancelled.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error("Cancel appointment failed:", error);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "Unable to cancel appointment.",
      text: error.message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }
}

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* Primary upcoming appointment + CTA */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)] lg:items-start">

        <div>
          {primaryUpcomingAppointment ? (
            <UpcomingAppointment
              appointment={primaryUpcomingAppointment}
              onSelect={handleSelect}
            />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.14)] bg-[var(--color-surface)] p-8">
              <p className="mediform-mono-label">
                Upcoming
              </p>

              <p className="mt-3 text-sm text-[var(--color-muted)]">
                No upcoming appointments.
              </p>
            </div>
          )}
        </div>

        <BookingCTA onBook={handleBook} />
      </div>

      {/* Remaining appointments */}
      <div className="mt-10">
        <AppointmentList
          onSelect={handleSelect}
          onEdit={handleEdit}
          onCancel={handleCancel}
          excludeAppointmentId={primaryUpcomingAppointment?.id}
        />
      </div>

      {/* Booking modal */}
      {isBookingOpen && (
        <AppointmentForm
          onSubmit={handleBookingSubmit}
          onCancel={() => setIsBookingOpen(false)}
        />
      )}

      {editingAppointment && (
  <AppointmentForm
    initialData={editingAppointment}
    onSubmit={handleEditSubmit}
    onCancel={() => setEditingAppointment(null)}
  />
)}

    

    </main>
  );
}

export default Dashboard;