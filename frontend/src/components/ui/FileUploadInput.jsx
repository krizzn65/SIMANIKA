"use client";

import { useState } from "react";
import "./file-upload.css";

export function FileUploadInput({ id, invalid = false, emptyText = "Belum ada berkas dipilih", onChange, "aria-describedby": describedBy, ...props }) {
  const [fileName, setFileName] = useState("");
  const statusId = `${id}-upload-status`;

  return (
    <div className={`event-file-upload${fileName ? " event-file-upload--selected" : ""}${invalid ? " event-file-upload--invalid" : ""}`}>
      <input
        {...props}
        id={id}
        type="file"
        aria-invalid={invalid || undefined}
        aria-describedby={[describedBy, statusId].filter(Boolean).join(" ")}
        onChange={(event) => {
          setFileName(event.currentTarget.files?.[0]?.name || "");
          onChange?.(event);
        }}
      />
      <span className="event-file-upload__status" id={statusId} aria-live="polite">
        {fileName ? <>✓ Berkas dipilih: <strong>{fileName}</strong></> : emptyText}
      </span>
    </div>
  );
}
