import { supabase } from "../lib/supabaseClient";

const API_BASE_URL = "/api";

async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      "Unable to load authentication session.",
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Authentication required. Please sign in.",
    );
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiRequest(
  url,
  options = {},
) {
  const authHeaders =
    await getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}${url}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Something went wrong.",
    );
  }

  return data;
}

export async function fetchDoctors() {
  return apiRequest("/doctors");
}

export async function fetchDoctorById(id) {
  return apiRequest(
    `/doctors/${id}`,
  );
}

export async function createDoctor(
  doctor,
) {
  return apiRequest("/doctors", {
    method: "POST",
    body: JSON.stringify(doctor),
  });
}

export async function updateDoctor(
  id,
  doctor,
) {
  return apiRequest(
    `/doctors/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(doctor),
    },
  );
}

export async function deleteDoctor(id) {
  return apiRequest(
    `/doctors/${id}`,
    {
      method: "DELETE",
    },
  );
}