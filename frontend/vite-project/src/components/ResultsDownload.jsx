import React from "react";
import { saveAs } from "file-saver";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function downloadExcel(selection, results, studentId) {
  try {
    // Flatten courses with pass/fail info
    const coursesWithStatus = Object.values(selection).flatMap(term =>
      (term.courses || []).map(c => ({
        code: c?.code || "",
        status: c?.passed ? "Pass" : "Fail",
        term: term.header
      }))
    );

    const response = await fetch(`${API_BASE}/download-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      body: JSON.stringify({ selection, results, studentId, coursesWithStatus }),
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();

    const excelBlob = new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    <div className="results-table-container">
      <h2>Validation Results</h2>
      <table className="results-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(selection).flatMap(term =>
            (term.courses || []).map((c, i) => {
              if (!c) return null;
              return (
                <tr key={`${term.header}-${i}`}>
                  <td>{c.code}</td>
                  <td className={c.passed ? "status-pass" : "status-fail"}>
                    {c.passed ? "Pass" : "Fail"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <button
        onClick={() => downloadExcel(selection, results, studentId)}
        disabled={disabled}
      >
        Download Excel
      </button>
    </div>
  );
}
