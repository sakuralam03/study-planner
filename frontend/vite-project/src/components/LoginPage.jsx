import React, { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // <-- new state for feedback

  const API_URL = import.meta.env.VITE_API_BASE;
; // adjust for your backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (mode === "login") {
        res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, password }),
        });
      } else if (mode === "register") {
        res = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, studentId, year, email, password }),
        });
      } else if (mode === "reset") {
        res = await fetch(`${API_URL}/request-password-reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        if (mode === "login") {
          localStorage.setItem("token", data.token);
          onLogin({ studentId });
          setMessage(""); // clear any old error
        } else if (mode === "register") {
          setMessage(" Account created successfully. Please log in.");
          setMode("login");
        } else if (mode === "reset") {
          setMessage(" Reset link sent to your email.");
          setMode("login");
        }
      } else {
        // Show backend error messages
        setMessage(` ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setMessage(` Network error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>
        {mode === "login"
          ? "Student Login"
          : mode === "register"
          ? "Create Account"
          : "Reset Password"}
      </h2>

      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <label>
              Name:
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <br />
            <label>
              Year of Admission:
              <input value={year} onChange={(e) => setYear(e.target.value)} required />
            </label>
            <br />
            <label>
              Email:
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <br />
          </>
        )}

        {mode !== "reset" && (
          <>
            <label>
              Student ID:
              <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
            </label>
            <br />
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <br />
          </>
        )}

        {mode === "reset" && (
          <>
            <label>
              Email:
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <br />
          </>
        )}

        <button type="submit">
          {mode === "login" ? "Login" : mode === "register" ? "Register" : "Send Reset Link"}
        </button>
      </form>

      {/* Show error or success message */}
      {message && <p style={{ marginTop: "10px", color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

      <div style={{ marginTop: "15px" }}>
        {mode !== "login" && (
          <button onClick={() => setMode("login")}>Already have an account? Login</button>
        )}
        {mode !== "register" && (
          <button onClick={() => setMode("register")}>Create new account</button>
        )}
        {mode !== "reset" && (
          <button onClick={() => setMode("reset")}>Forgot password?</button>
        )}
      </div>
    </div>
  );
}
