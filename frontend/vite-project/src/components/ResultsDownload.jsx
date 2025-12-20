import React from "react";
import { saveAs } from "file-saver";

// Use environment variable for backend URL, fallback to localhost
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function downloadExcel(selection, results, studentId) {
  const response = await fetch(`${API_BASE}/download-excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection, results })
  });

  if (!response.ok) {
    console.error("Failed to download Excel");
    return;
  }

  const blob = await response.blob();
  const filename = `${studentId}_study_plan.xlsx`;
  saveAs(blob, filename);
}

export default function ResultsDownload({ selection, results, studentId }) {
  return (
    <button onClick={() => downloadExcel(selection, results, studentId)}>
      Download Excel
    </button>
  );
}
