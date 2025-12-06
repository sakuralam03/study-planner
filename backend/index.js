const express = require("express");
const cors = require("cors");
const { readSheet } = require("./sheets");

const app = express();
const spreadsheetId = "1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo";

// Allow requests from your frontend origin
app.use(cors({ origin: "http://localhost:5173" }));
let cache = {};

async function getSheetData(range) {
  if (cache[range]) return cache[range];
  const data = await readSheet(spreadsheetId, range);
  cache[range] = data;
  return data;
}
app.get("/courses", async (req, res) => {
  try {
    const term = req.query.term;
    const data = await getSheetData("Courses!A:H");

    // Map rows into clean objects
    let courses = data.slice(1).map((row, idx) => ({
      id: idx,
      course_code: row[0],
      course_name: row[1],
      credits: row[2],
      type: row[3],
      term_offered: row[4]
    }));

    // Filter by term if query provided
    if (term) {
      courses = courses.filter(c => String(c.term_offered) === String(term));
    }

    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});



app.get("/prerequisites", async (req, res) => {
  try {
    const data = await getSheetData("Pre requisites!A:C");
    res.json({ prerequisites: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/tracks", async (req, res) => {
  try {
    const data = await getSheetData("Tracks!A:G");
    const headers = data[0]; // first row
    const tracks = data.slice(1).map((row, idx) => {
      let obj = { id: idx };
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
    res.json({ tracks });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/minors", async (req, res) => {
  try {
    const data = await getSheetData("Minors!A:E");
    const headers = data[0]; // first row
    const minors = data.slice(1).map((row, idx) => {
      let obj = { id: idx };
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
    res.json({ minors });
  } catch (err) {
    res.status(500).send(err.message);
  }
});



app.get("/term-template", async (req, res) => {
  try {
    const data = await getSheetData("term template!A:E");
    const headers = data[0];
const termTemplate = data.slice(1).map((row, idx) => {
  let obj = { id: idx };
  headers.forEach((h, i) => {
    obj[h] = row[i];
  });
  return obj;
});


    res.json({ termTemplate });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/progress", async (req, res) => {
  try {
    // Return some placeholder or computed progress data
    res.json({ progress: "Not implemented yet" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.listen(3000, () => console.log("Server running on http://localhost:3000"));

