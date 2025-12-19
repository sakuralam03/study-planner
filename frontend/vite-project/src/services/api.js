// api.js

// Use environment variable for backend URL, fallback to localhost
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";


// --- Courses ---
export async function getCourses() {
  const res = await fetch(`${API_BASE}/courses`);
  if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
  return res.json();
}

// --- Tracks ---
export async function getTracks() {
  const res = await fetch(`${API_BASE}/tracks`);
  if (!res.ok) throw new Error(`Failed to fetch tracks: ${res.status}`);
  return res.json();
}

// --- Minors ---
export async function getMinors() {
  const res = await fetch(`${API_BASE}/minors`);
  if (!res.ok) throw new Error(`Failed to fetch minors: ${res.status}`);
  return res.json();
}

// --- Term Template ---
export async function getTermTemplate() {
  const res = await fetch(`${API_BASE}/term-template`);
  if (!res.ok) throw new Error(`Failed to fetch term template: ${res.status}`);
  return res.json();
}

// --- Validation ---
export async function validateSelection(selection) {
  const res = await fetch(`${API_BASE}/validate-selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection }),
  });
  if (!res.ok) throw new Error(`Validation failed: ${res.status}`);
  return res.json();
}

// --- Progress ---
export async function getProgress() {
  const res = await fetch(`${API_BASE}/progress`);
  if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`);
  return res.json();
}

// --- Local test helper ---
async function testValidateSelection() {
  const res = await fetch(`${API_BASE}/validate-selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection: ["CS101", "MA102"] }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  console.log("Test validateSelection result:", data);
}

// Uncomment to run locally
// testValidateSelection();
