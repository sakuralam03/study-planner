import React from "react";
import { saveAs } from "file-saver";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function downloadExcel(selection, results, studentId) {
  try {
    const response = await fetch(`${API_BASE}/download-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      body: JSON.stringify({ selection, results }),
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();

    // IMPORTANT: make sure the blob has the right type
    const excelBlob = new Blob([blob], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const filename = `${studentId}_study_plan.xlsx`;
    saveAs(excelBlob, filename);
  } catch (err) {
    console.error("Excel download error:", err);
    alert("Failed to download Excel file");
  }
}

export default function ResultsDownload({ selection, results, studentId }) {
  const disabled = !selection || !results;

  return (
    <button onClick={() => downloadExcel(selection, results, studentId)} disabled={disabled}>
      Download Excel
    </button>
  );
}
