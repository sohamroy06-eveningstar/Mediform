const API_BASE_URL = "http://localhost:5000/api";

import { useState } from "react";
import { FileImage, FileText, Upload, X } from "lucide-react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function MediaUploader({ onFilesChange }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG, PNG, WebP and PDF files are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be 5MB or less.`;
    }

    return "";
  }

 async function handleFileChange(event) {
  const selectedFiles = Array.from(event.target.files || []);

  setError("");

  const validFiles = [];

  for (const file of selectedFiles) {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      continue;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/uploads`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "File upload failed.",
        );
      }

      validFiles.push({
        id: `${file.name}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: `http://localhost:5000${data.data.url}`,
        name: data.data.name,
        type: data.data.type,
      });
    } catch (error) {
      console.error("Media upload failed:", error);

      setError(
        `${file.name}: Unable to upload file.`,
      );
    }
  }

  const existingIds = new Set(
    files.map((item) => item.id),
  );

  const newFiles = validFiles.filter(
    (item) => !existingIds.has(item.id),
  );

  const updatedFiles = [...files, ...newFiles];

  setFiles(updatedFiles);
  onFilesChange?.(updatedFiles);

  event.target.value = "";
}
  function removeFile(fileId) {
    setFiles((currentFiles) => {
      const fileToRemove = currentFiles.find(
        (item) => item.id === fileId,
      );

      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      const updatedFiles = currentFiles.filter(
        (item) => item.id !== fileId,
      );

      onFilesChange?.(updatedFiles);

      return updatedFiles;
    });
  }

  return (
    <div>
      {/* Upload control */}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[rgba(14,22,38,0.16)] bg-[var(--color-surface)] px-6 py-8 text-center transition-colors hover:border-[var(--color-primary)]">
        <Upload
          size={22}
          strokeWidth={1.8}
          className="text-[var(--color-muted)]"
          aria-hidden="true"
        />

        <span className="mt-3 font-[var(--font-ui)] text-sm font-medium text-[var(--color-ink)]">
          Upload medical files
        </span>

        <span className="mt-1 text-xs text-[var(--color-muted)]">
          JPG, PNG, WebP or PDF • Max 5MB
        </span>

        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-[var(--color-alert)]"
        >
          {error}
        </p>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((item) => {
            const isImage = item.file.type.startsWith("image/");

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)] p-3"
              >
                {isImage && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[rgba(14,22,38,0.04)]">
                    <FileText
                      size={20}
                      className="text-[var(--color-muted)]"
                      aria-hidden="true"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                    {item.file.name}
                  </p>

                  <p className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[rgba(255,90,95,0.06)] hover:text-[var(--color-alert)]"
                >
                  <X
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MediaUploader;