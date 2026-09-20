import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function MediaUploader({
  onFilesChange,
  appointmentId,

  resourceId,
  folder = "medical",

  multiple = true,

  acceptedTypes = DEFAULT_ACCEPTED_TYPES,

  // true = only select/store files
  // false = upload immediately
  deferUpload = false,
}) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const uploadResourceId =
    resourceId || appointmentId;

  function validateFile(file) {
    if (!acceptedTypes.includes(file.type)) {
      return `${file.name}: This file type is not allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be 5MB or less.`;
    }

    return "";
  }

  async function handleFileChange(event) {
    const selectedFiles = Array.from(
      event.target.files || [],
    );

    setError("");

    if (selectedFiles.length === 0) {
      return;
    }

    const filesToUpload = multiple
      ? selectedFiles
      : [selectedFiles[0]];

    try {
      /* =====================================================
         DEFER MODE
         ===================================================== */

      if (deferUpload) {
        const localFiles = [];

        for (const file of filesToUpload) {
          const validationMessage =
            validateFile(file);

          if (validationMessage) {
            throw new Error(
              validationMessage,
            );
          }

          localFiles.push({
            id: crypto.randomUUID(),

            file,

            name: file.name,

            type: file.type,

            size: file.size,

            /*
             * These are intentionally empty.
             * Upload will happen later.
             */
            pathname: "",

            url: "",

            downloadUrl: "",

            /*
             * Local browser preview only.
             */
            previewUrl:
              file.type.startsWith("image/")
                ? URL.createObjectURL(file)
                : "",
          });
        }

        const nextFiles = multiple
          ? [
              ...files,
              ...localFiles,
            ]
          : localFiles;

        setFiles(nextFiles);

        onFilesChange?.(nextFiles);

        event.target.value = "";

        return;
      }

      /* =====================================================
         NORMAL / IMMEDIATE UPLOAD MODE
         ===================================================== */

      if (!uploadResourceId) {
        throw new Error(
          "Upload resource ID is missing.",
        );
      }

      /* Get current Supabase session */

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

      for (const file of filesToUpload) {
        const validationMessage =
          validateFile(file);

        if (validationMessage) {
          throw new Error(
            validationMessage,
          );
        }

        /* =================================================
           STEP 1
           Get signed PUT URL
           ================================================= */

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
                resourceId:
                  uploadResourceId,

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

        /* =================================================
           STEP 2
           Upload directly to Vercel Blob
           ================================================= */

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
          id: pathname,

          file,

          name: file.name,

          type: file.type,

          size: file.size,

          pathname,

          url: "",

          downloadUrl: "",

          previewUrl:
            file.type.startsWith(
              "image/",
            )
              ? URL.createObjectURL(file)
              : "",
        });
      }

      const nextFiles = multiple
        ? [
            ...files,
            ...uploadedFiles,
          ]
        : uploadedFiles;

      setFiles(nextFiles);

      onFilesChange?.(nextFiles);

      event.target.value = "";
    } catch (error) {
      console.error(
        "Media upload failed:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
      );

      event.target.value = "";
    }
  }

  function removeFile(fileId) {
    setFiles((currentFiles) => {
      const fileToRemove =
        currentFiles.find(
          (item) =>
            item.id === fileId,
        );

      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(
          fileToRemove.previewUrl,
        );
      }

      const updatedFiles =
        currentFiles.filter(
          (item) =>
            item.id !== fileId,
        );

      onFilesChange?.(
        updatedFiles,
      );

      return updatedFiles;
    });
  }

  return (
    <div className="space-y-3">

      {/* Upload area */}

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-input)] border border-dashed border-[rgba(14,22,38,0.18)] bg-[var(--color-surface)] px-6 py-8 text-center transition hover:border-[var(--color-primary)]">

        <Upload
          size={24}
          className="text-[var(--color-muted)]"
        />

        <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
          {multiple
            ? "Choose files"
            : "Choose profile image"}
        </p>

        <p className="mt-1 text-xs text-[var(--color-muted)]">
          JPG, PNG, WebP and PDF up to 5MB
          {!multiple &&
            " • One image only"}
        </p>

        <input
          type="file"
          className="hidden"
          accept={acceptedTypes.join(",")}
          multiple={multiple}
          onChange={handleFileChange}
        />
      </label>

      {/* Error */}

      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-alert)]"
        >
          {error}
        </p>
      )}

      {/* Uploaded / selected files */}

      {files.length > 0 && (
        <div className="space-y-3">

          {files.map((item) => {
            const isImage =
              item.type?.startsWith(
                "image/",
              );

            return (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.1)] bg-white"
              >

                {isImage ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText
                      size={24}
                      className="text-[var(--color-alert)]"
                    />

                    <p className="truncate text-sm font-medium">
                      {item.name}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">

                  <p className="truncate pr-3 text-xs text-gray-600">
                    {item.name}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeFile(item.id)
                    }
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-red-50"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={15} />
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default MediaUploader;