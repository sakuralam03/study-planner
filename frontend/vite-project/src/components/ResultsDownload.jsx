import React from "react";
import { saveAs } from "file-saver";

async function downloadExcel(selection, results) {
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
  saveAs(blob, "validation_results.xlsx");
}

export default function ResultsDownload({ selection, results }) {
  return (
    <button onClick={() => downloadExcel(selection, results)}>
      Download Excel
    </button>
  );
}
