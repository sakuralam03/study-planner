const express = require("express");
const cors = require("cors");
const { readSheet } = require("./sheets");

const app = express();
const spreadsheetId = "1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo";

// Allow requests from your frontend origin
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // to parse JSON bodies
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



app.post("/validate-selection", async (req, res) => {
      console.log("Route hit", req.body);
  try {
    const selectedCourses = req.body.selection || [];

    // Load sheets
    const prereqs = await readSheet(spreadsheetId, "Pre requisites!A:C");
    const tracks = await readSheet(spreadsheetId, "Tracks!A:G");
    const minors = await readSheet(spreadsheetId, "Minors!A:E");
    const courses = await readSheet(spreadsheetId, "Courses!A:H"); 
    // assuming columns: A=code, B=name, C=credits, D=category, E=term_offered, ...

    // --- 1. Check prerequisites ---
    const unmet = [];
    prereqs.forEach(row => {
      const [course, prereq, type] = row;
      if (selectedCourses.includes(course)) {
        if (type === "Pre" && !selectedCourses.includes(prereq)) {
          unmet.push(`${course} requires ${prereq} before enrollment`);
        }
        if (type === "Co" && !selectedCourses.includes(prereq)) {
          unmet.push(`${course} requires ${prereq} taken concurrently`);
        }
      }
    });

    // --- 2. Check tracks ---
function checkGroup(group, selectedCourses) {
  const requiredCount = group.requiredCourses.filter(c => selectedCourses.includes(c)).length;
  const requiredMet = requiredCount >= group.minCoursesNeeded;

  const electivePool = [...group.electivePoolCodes, ...group.electivePoolPillars];
  const electiveCount = electivePool.filter(c => selectedCourses.includes(c)).length;
  const electiveMet = electiveCount >= group.electiveMin;

  return requiredMet && electiveMet;
}

const fulfilledTracks = [];
tracks.forEach(row => {
  const [track_name, required_courses, choice_group, min_courses_needed, elective_pool_codes, elective_pool_pillars, elective_min] = row;

  const group = {
    requiredCourses: required_courses.split(",").map(c => c.trim()),
    minCoursesNeeded: parseInt(min_courses_needed, 10) || 0,
    electivePoolCodes: elective_pool_codes.split(",").map(c => c.trim()),
    electivePoolPillars: elective_pool_pillars.split(",").map(c => c.trim()),
    electiveMin: parseInt(elective_min, 10) || 0
  };

  // If you have multiple rows for the same track (Group A, Group B),
  // collect them and check each group separately:
  const groupFulfilled = checkGroup(group, selectedCourses);

  if (groupFulfilled && !fulfilledTracks.includes(track_name)) {
    fulfilledTracks.push(track_name);
  }
});


    // --- 3. Check minors ---
const fulfilledMinors = [];
const minorsByName = {};

// Group rows by minor_name
minors.forEach(row => {
  const [minor_name, mandatory_courses, choice_group, choice_courses, choice_min] = row;

  if (!minorsByName[minor_name]) {
    minorsByName[minor_name] = [];
  }

  minorsByName[minor_name].push({
    mandatoryCourses: mandatory_courses === "-" ? [] : mandatory_courses.split(",").map(c => c.trim()),
    choiceCourses: choice_courses.split(",").map(c => c.trim()),
    choiceMin: parseInt(choice_min, 10) || 0
  });
});


// Check each minor
Object.entries(minorsByName).forEach(([minorName, groups]) => {
  const allGroupsFulfilled = groups.every(group => {
    const mandatoryMet = group.mandatoryCourses.every(c => selectedCourses.includes(c));
    const choiceCount = group.choiceCourses.filter(c => selectedCourses.includes(c)).length;
    const choiceMet = choiceCount >= group.choiceMin;
    return mandatoryMet && choiceMet;
  });

  if (allGroupsFulfilled) {
    fulfilledMinors.push(minorName);
  }
});

    // --- 4. Check credit requirements ---
let hassCredits = 0;
let electiveCredits = 0;
let coreCredits = 0;

courses.forEach(row => {
  const [
    course_code,
    course_name,
    credits,
    type,          // "core" or "elective"
    term_offered,
    pillar,        // "ISTD", "HASS", etc.
    track_tags,
    minor_tags
  ] = row;

  if (selectedCourses.includes(course_code)) {
    const creditVal = parseInt(credits, 10) || 0;

    if (pillar.trim().toUpperCase()  === "HASS") {
      hassCredits += creditVal;
    } else if (type.trim().toLowerCase()  === "elective" && pillar.trim().toUpperCase()  === "ISTD") {
      electiveCredits += creditVal;
    } else if (type.trim().toLowerCase() === "core" && pillar.trim().toUpperCase() === "ISTD") {
      coreCredits += creditVal;
    }
  }
});


    const creditStatus = {
      hassMet: hassCredits >= 60,
      hassCredits,
      electiveMet: electiveCredits >= 96,
      electiveCredits,
      coreMet: coreCredits >= 60,
      coreCredits
    };

    res.json({
      unmet,
      fulfilledTracks,
      fulfilledMinors,
      creditStatus
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.listen(3000, () => console.log("Server running on http://localhost:3000"));

