import { supabase } from "../lib/supabaseClient";

const API_BASE_URL = "/api";

async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Unable to load authentication session.");
  }

  if (!session?.access_token) {
    throw new Error("Authentication required. Please sign in.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiRequest(url, options = {}) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
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
export async function fetchAppointments({
  all = false,
} = {}) {
  const query = all
    ? "?scope=all"
    : "";

  return apiRequest(
    `/appointments${query}`,
  );
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