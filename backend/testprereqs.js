// testprereqs.js
require('dotenv').config();

try {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log("Raw env value:", raw);

  const parsed = JSON.parse(raw);
  console.log("Parsed object:", parsed);

  console.log("Client email:", parsed.client_email);
  console.log("Project ID:", parsed.project_id);
} catch (err) {
  console.error("❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS:", err.message);
}
