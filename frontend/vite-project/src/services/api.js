const API_BASE = "http://localhost:3000";

export async function getCourses() {
  const res = await fetch(`${API_BASE}/courses`);
  return res.json();
}
export async function getTracks() {
  const res = await fetch(`${API_BASE}/tracks`);
  return res.json();
}
export async function getMinors() {
  const res = await fetch(`${API_BASE}/minors`);
  return res.json();
}
export async function getTermTemplate() {
  const res = await fetch(`${API_BASE}/term-template`);
  return res.json();
}

export async function validateSelection(selection) {
  const res = await fetch(`${API_BASE}/validate-selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection }),
  });
  return res.json();
}

export async function getProgress() {
  const res = await fetch(`${API_BASE}/progress`);
  return res.json();
}

async function testValidateSelection() {
  const res = await fetch("http://localhost:3000/validate-selection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection: ["CS101", "MA102"] })
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  console.log(data);
}

// Call it
testValidateSelection();
