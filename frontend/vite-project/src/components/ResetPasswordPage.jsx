import React, { useState } from "react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

 const API_URL = import.meta.env.VITE_API_BASE;
; // adjust for your backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Extract token from URL query string
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(" Password reset successful. You can now log in.");
      } else {
        setMessage(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setMessage(` Network error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <label>
          New Password:
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
