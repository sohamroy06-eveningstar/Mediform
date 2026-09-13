const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong.",
    );
  }

  return data;
}

export async function fetchAppointments() {
  return apiRequest("/appointments");
}

export async function fetchAppointmentById(id) {
  return apiRequest(`/appointments/${id}`);
}

export async function createAppointment(appointment) {
  return apiRequest("/appointments", {
    method: "POST",
    body: JSON.stringify(appointment),
  });
}

export async function updateAppointment(id, appointment) {
  return apiRequest(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(appointment),
  });
}

export async function deleteAppointment(id) {
  return apiRequest(`/appointments/${id}`, {
    method: "DELETE",
  });
}