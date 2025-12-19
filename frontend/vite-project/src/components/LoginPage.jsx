import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ name, studentId, year });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "400px",
        margin: "auto",
        alignItems: "center",
      }}
    >
      <h2>Student Login</h2>
      <label>
        Name:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        Student ID:
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </label>
      <br />
      <label>
        Year of Admission:
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
      </label>
      <br />
      <button type="submit">Login</button>
    </form>
  );
}
