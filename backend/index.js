const express = require("express");
const { readSheet } = require("./sheets");

const app = express();
const spreadsheetId = "1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo"; // your sheet ID

app.get("/courses", async (req, res) => {
  try {
    const data = await readSheet(spreadsheetId, "Courses!A:H");
    res.json({ courses: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/prerequisites", async (req, res) => {
  try {
    const data = await readSheet(spreadsheetId, "Pre requisites!A:C");
    res.json({ prerequisites: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/tracks", async (req, res) => {
  try {
    const data = await readSheet(spreadsheetId, "TYracks!A:G");
    res.json({ tracks: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/minors", async (req, res) => {
  try {
    const data = await readSheet(spreadsheetId, "Minors!A:E");
    res.json({ minors: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/term-template", async (req, res) => {
  try {
    const data = await readSheet(spreadsheetId, "term template!A:E");
    res.json({ termTemplate: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
