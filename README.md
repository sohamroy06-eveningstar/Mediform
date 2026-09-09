# Mediform — Healthcare Appointment Booking UI

A modern, responsive healthcare appointment booking and management interface built with **React, Vite, and Tailwind CSS**.

Mediform provides a clean patient-focused experience for booking, viewing, editing, cancelling, filtering, and sorting healthcare appointments, along with medical document upload and preview support.

---

## ✨ Features

- 📅 Book healthcare appointments
- ✏️ Edit existing appointments
- ❌ Cancel appointments with confirmation
- 👨‍⚕️ Doctor selection
- 🕒 Future date and time validation
- 📝 Appointment reason and optional notes
- 📋 Upcoming appointment section
- 🕘 Consultation history
- 🔎 Filter appointments by doctor and status
- ↕️ Sort appointments by:
  - Newest First
  - Oldest First
  - Doctor A → Z
  - Doctor Z → A
- 📎 Upload medical documents
- 🖼️ Image preview support
- 📄 PDF file support
- 🗑️ Remove uploaded files
- ✅ Real-time form validation
- 🔔 SweetAlert2 success and confirmation feedback
- 📱 Responsive mobile, tablet, and desktop layouts
- ♿ Keyboard-friendly and accessible UI
- 🎨 Modern healthcare-focused visual design
- 💾 Local/mock appointment state with API-ready architecture

---

## 🛠️ Tech Stack

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS v4
- Lucide React

### Libraries

- SweetAlert2

### Architecture

- React Context API
- Custom React Hooks
- Component-based architecture
- Utility-based validation and date handling

---

## 📂 Project Structure

```text
src/
├── Components/
│   ├── AppointmentCard.jsx
│   ├── AppointmentDetails.jsx
│   ├── AppointmentForm.jsx
│   ├── AppointmentList.jsx
│   ├── BookingCTA.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── MediaUploader.jsx
│   └── UpcomingAppointment.jsx
│
├── context/
│   ├── appointmentContext.js
│   └── AppointmentProvider.jsx
│
├── data/
│   └── Appointment.js
│
├── hooks/
│   ├── useAppointmentContext.js
│   └── useAppointments.js
│
├── pages/
│   └── Dashboard.jsx
│
├── utils/
│   ├── dateUtils.js
│   └── validation.js
│
├── App.jsx
├── index.css
└── main.jsx