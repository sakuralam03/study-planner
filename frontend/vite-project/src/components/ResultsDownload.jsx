import React from "react";
import { saveAs } from "file-saver";

async function downloadExcel(selection, results, studentId) {
  const response = await fetch("http://localhost:3000/download-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection, results })
  });

  if (!response.ok) {
    console.error("Failed to download Excel");
    return;
  }

  const blob = await response.blob();
  // Use studentId in the filename
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
