import { supabase } from "../lib/supabaseClient";

export async function fetchProtectedMedia(
  pathname,
) {
  if (!pathname) {
    throw new Error(
      "Media pathname is required.",
    );
  }

  const {
    data: { session },
    error: sessionError,
  } =
    await supabase.auth.getSession();

  if (
    sessionError ||
    !session?.access_token
  ) {
    throw new Error(
      "Authentication session not found.",
    );
  }

  const response =
    await fetch(
      `/api/media/file?pathname=${encodeURIComponent(
        pathname,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

  if (!response.ok) {
    let message =
      "Failed to load media.";

    try {
      const data =
        await response.json();

      message =
        data.message || message;
    } catch {
      // Ignore non-JSON responses.
    }

    throw new Error(message);
  }

  const blob =
    await response.blob();

  return URL.createObjectURL(
    blob,
  );
}