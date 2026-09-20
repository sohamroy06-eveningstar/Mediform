import { supabase } from "../lib/supabaseClient";

function normalizePathname(pathname) {
  if (
    typeof pathname !== "string" ||
    !pathname.trim()
  ) {
    return "";
  }

  return pathname.trim();
}

export async function fetchProtectedMedia(
  pathname,
) {
  const normalizedPathname =
    normalizePathname(pathname);

  if (!normalizedPathname) {
    throw new Error(
      "Media pathname is required.",
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError ||
    !session?.access_token
  ) {
    throw new Error(
      "Authentication session not found.",
    );
  }

  const apiUrl =
    `/api/media/file?pathname=${encodeURIComponent(
      normalizedPathname,
    )}`;

  console.log(
    "[MediaService] Loading media:",
    normalizedPathname,
  );

  const response =
    await fetch(apiUrl, {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${session.access_token}`,
      },

      cache: "no-store",
    });

  if (!response.ok) {
    let message =
      `Failed to load media (${response.status}).`;

    let serverData = null;

    try {
      serverData =
        await response.json();

      message =
        serverData?.message ||
        message;
    } catch {
      // Non-JSON response.
    }

    console.error(
      "[MediaService] Media request failed:",
      {
        status: response.status,
        pathname:
          normalizedPathname,
        response:
          serverData,
      },
    );

    if (response.status === 404) {
      throw new Error(
        `Media not found for pathname: ${normalizedPathname}`,
      );
    }

    if (response.status === 401) {
      throw new Error(
        "Your session has expired. Please log in again.",
      );
    }

    if (response.status === 403) {
      throw new Error(
        "You are not allowed to access this media.",
      );
    }

    throw new Error(message);
  }

  const blob =
    await response.blob();

  if (!blob.size) {
    throw new Error(
      "Media response was empty.",
    );
  }

  return URL.createObjectURL(
    blob,
  );
}

export async function uploadMediaFiles({
  resourceId,
  files,
  folder = "medical",
}) {
  if (!resourceId) {
    throw new Error(
      "Upload resource ID is required.",
    );
  }

  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError ||
    !session?.access_token
  ) {
    throw new Error(
      "Authentication session not found. Please log in again.",
    );
  }

  const uploadedFiles = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      throw new Error(
        "Invalid file selected for upload.",
      );
    }

    const uploadResponse =
      await fetch(
        "/api/upload",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            resourceId,

            folder,

            fileName:
              file.name,

            contentType:
              file.type,

            size:
              file.size,
          }),
        },
      );

    const uploadData =
      await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadData.message ||
          "Failed to create upload URL.",
      );
    }

    const {
      presignedUrl,
      pathname,
    } =
      uploadData.data || {};

    if (
      !presignedUrl ||
      !pathname
    ) {
      throw new Error(
        "Upload URL or pathname was not returned.",
      );
    }

    const blobResponse =
      await fetch(
        presignedUrl,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              file.type,
          },

          body: file,
        },
      );

    if (!blobResponse.ok) {
      throw new Error(
        `Blob upload failed: ${blobResponse.status}`,
      );
    }

    uploadedFiles.push({
      pathname,

      name:
        file.name,

      type:
        file.type,

      size:
        file.size,
    });
  }

  return uploadedFiles;
}