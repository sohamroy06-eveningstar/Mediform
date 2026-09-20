import { useState } from "react";
import BookingCTA from "../Components/BookingCTA";
import UpcomingAppointment from "../Components/UpcomingAppointment";
import AppointmentList from "../Components/AppointmentList";
import AppointmentDetails from "../Components/AppointementDetails";
import AppointmentForm from "../Components/AppointmentForm";
import useAppointments from "../hooks/useAppointments";
import Swal from "sweetalert2";
import { getAppointmentStatus } from "../utils/dateUtils";
import {uploadMediaFiles} from "../service/mediaService";

function Dashboard() {
  const {
    appointments,
    addAppointment,
     updateAppointment,
       cancelAppointment,
        isLoading,
  error,
  } = useAppointments();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  
if (isLoading) {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--color-background)] px-4">
      <div className="text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
          aria-label="Loading appointments"
        />

        <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
          Loading appointments...
        </p>

        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Fetching your appointment information
        </p>
      </div>
    </main>
  );
}

if (error) {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[rgba(255,90,95,0.2)] bg-[rgba(255,90,95,0.06)] p-6 text-center">
        <p className="text-sm font-medium text-[var(--color-alert)]">
          {error}
        </p>

        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Please refresh the page and try again.
        </p>
      </div>
    </main>
  );
}
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

  async function handleBookingSubmit(
  appointment,
) {
  const {
    mediaFiles = [],
    ...appointmentData
  } = appointment;

  try {
    /*
     * =====================================================
     * STEP 1
     * Create appointment first
     * =====================================================
     */

    const createdAppointment =
      await addAppointment({
        ...appointmentData,

        /*
         * At this point new media has not
         * been uploaded yet.
         */
        mediaUrls:
          appointmentData.mediaUrls ||
          [],
      });

    let finalAppointment =
      createdAppointment;

    /*
     * =====================================================
     * STEP 2
     * Upload media using REAL appointment ID
     * =====================================================
     */

    if (mediaFiles.length > 0) {
      try {
        const uploadedMedia =
          await uploadMediaFiles({
            resourceId:
              createdAppointment.id,

            folder: "medical",

            files: mediaFiles,
          });

        /*
         * =================================================
         * STEP 3
         * Save Blob pathnames in appointment
         * =================================================
         */

        finalAppointment =
          await updateAppointment({
            ...createdAppointment,

            mediaUrls: [
              ...(createdAppointment.mediaUrls ||
                []),
              ...uploadedMedia,
            ],
          });
      } catch (uploadError) {
        /*
         * Roll back appointment creation
         * if media upload fails.
         *
         * This prevents a retry from creating
         * a duplicate appointment.
         */

        try {
          await cancelAppointment(
            createdAppointment.id,
          );
        } catch (rollbackError) {
          console.error(
            "Appointment rollback failed:",
            rollbackError,
          );
        }

        throw uploadError;
      }
    }

    /*
     * Only close modal AFTER
     * everything succeeded.
     */

    setIsBookingOpen(false);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title:
        "Appointment booked successfully.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });

    return finalAppointment;
  } catch (error) {
    console.error(
      "Booking failed:",
      error,
    );

    /*
     * Keep modal open so user can retry.
     */

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title:
        "Unable to book appointment.",
      text: error.message,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
    });

    return null;
  }
}
  function handleSelect(appointment) {
    setSelectedAppointment(appointment);
  }

function handleEdit(appointment) {
  setSelectedAppointment(null);
  setEditingAppointment(appointment);
}
async function handleEditSubmit(
  updatedAppointment,
) {
  const {
    mediaFiles = [],
    ...appointmentData
  } = updatedAppointment;

  try {
    /*
     * =====================================================
     * STEP 1
     * Update appointment fields first
     * =====================================================
     */

    let finalAppointment =
      await updateAppointment(
        appointmentData,
      );

    /*
     * =====================================================
     * STEP 2
     * Upload new files
     * =====================================================
     */

    if (mediaFiles.length > 0) {
      const uploadedMedia =
        await uploadMediaFiles({
          resourceId:
            finalAppointment.id,

          folder: "medical",

          files: mediaFiles,
        });

      /*
       * =================================================
       * STEP 3
       * Save new Blob paths
       * =================================================
       */

      finalAppointment =
        await updateAppointment({
          ...finalAppointment,

          mediaUrls: [
            ...(finalAppointment.mediaUrls ||
              []),
            ...uploadedMedia,
          ],
        });
    }

    setEditingAppointment(null);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title:
        "Appointment updated successfully.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });

    return finalAppointment;
  } catch (error) {
    console.error(
      "Update appointment failed:",
      error,
    );

    /*
     * Keep edit modal open.
     */

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title:
        "Unable to update appointment.",
      text: error.message,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
    });

    return null;
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