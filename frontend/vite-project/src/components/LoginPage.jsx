import React, { useState } from "react";
import sutdLogo from "../assets/sutd_logo.jpg";

import "../LoginPage.css";


export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  const API_URL = import.meta.env.VITE_API_BASE;

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
          setMessage("");
          setMessageType("");
        } else if (mode === "register") {
          setMessage("Account created successfully. Please log in.");
          setMessageType("success");
          setMode("login");
        } else if (mode === "reset") {
          setMessage("Reset link sent to your email.");
          setMessageType("success");
          setMode("login");
        }
      } else {
        setMessage(data.error || "Unknown error");
        setMessageType("error");
      }
    } catch (err) {
      setMessage(`Network error: ${err.message}`);
      setMessageType("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={sutdLogo} alt="SUTD Logo" className="logo" />
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
              <label>
                Year of Admission:
                <input value={year} onChange={(e) => setYear(e.target.value)} required />
              </label>
              <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
            </>
          )}

          {mode !== "reset" && (
            <>
              <label>
                Student ID:
                <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
              </label>
              <label>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          {mode === "reset" && (
            <label>
              Email:
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
          )}

          <button type="submit" className="primary-btn">
            {mode === "login" ? "Login" : mode === "register" ? "Register" : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className={messageType === "success" ? "success-msg" : "error-msg"}>
            {message}
          </p>
        )}

        <div className="switch-buttons">
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
    </div>
  );
}
