const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "backend/service_account.json", // adjust path if needed
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function readSheet(spreadsheetId, range) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values;
}

module.exports = { readSheet };
