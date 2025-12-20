require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { readSheet } = require("./sheets");
const ExcelJS = require("exceljs");
const connectDB = require("./db");

const app = express();
const spreadsheetId = "1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo";

// Enable CORS for both local dev and deployed frontend
app.use(cors({
  origin: [
    "http://localhost:5173",              // local dev
    "https://study-planner-3lqc.vercel.app"    // deployed frontend
  ],
  methods: ["GET", "POST" , "OPTIONS"],
   allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

let cache = {};
app.get("/ping", (req, res) => {
  res.send("✅ Backend is alive");
});


// ---------- Helpers ----------
async function getSheetData(range) {
  if (cache[range]) return cache[range];
  const data = await readSheet(spreadsheetId, range);
  cache[range] = data;
  return data;
}
function normalize(str) {
  if (!str) return "";
  return str.toString().trim().replace(/\s+/g, "").toUpperCase();
}


function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr.map(x => normalize(x));
  if (typeof arr === "string") return arr.split(",").map(x => normalize(x));
  return [];
}


function mapRowsWithHeaders(data) {
  const headers = (data[0] || []).map(h => (h ?? "").toString().trim().toLowerCase());
  return data.slice(1).map((row, idx) => {
    const obj = { id: idx };
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").toString();
    });
    return obj;
  });
}

function sortTermsNatural(termNames) {
  // Expect labels like "Term 4", "Term 5"; fallback to given order if no numbers found.
  return [...termNames].sort((a, b) => {
    const na = parseInt(String(a).match(/\d+/)?.[0] || "9999", 10);
    const nb = parseInt(String(b).match(/\d+/)?.[0] || "9999", 10);
    return na - nb;
  });
}
function toCodes(listStr) {
  return listStr
    .split(",")
    .map(normalize)
    .filter(Boolean); // drop empty results
}




// ---------- Endpoints ----------
app.get("/courses", async (req, res) => {
  try {
    const term = req.query.term;
    const raw = await getSheetData("Courses!A:H");
    const rows = mapRowsWithHeaders(raw);

    // Normalize values while keeping readable names
    const courses = rows.map(r => ({
      id: r.id,
      course_code: normalize(r["course_code"]),
      course_name: (r["course_name"] ?? "").trim(), // keep readable
      credits: parseInt((r["credits"] ?? "").toString().trim(), 10) || 0,
      type: normalize(r["type"]),
      term_offered: (r["term_offered"] ?? "").toString().trim(),
      pillar: normalize(r["pillar"]),
      track_tags: (r["track_tags"] ?? "").toString().trim(),
      minor_tags: (r["minor_tags"] ?? "").toString().trim()
    }));

    const filtered = term ? courses.filter(c => String(c.term_offered) === String(term)) : courses;
    res.json({ courses: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/prerequisites", async (req, res) => {
  try {
    const data = await getSheetData("Prerequisites!A:C");
    res.json({ prerequisites: data });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/tracks", async (req, res) => {
  try {
    const raw = await getSheetData("Tracks!A:G");
    const rows = mapRowsWithHeaders(raw);

    const tracks = rows.map(r => ({
      id: r.id,
      track_name: (r["track_name"] ?? "").toString().trim(),
      required_courses: (r["required_courses"] ?? "").toString(),
      choice_group: (r["choice_group"] ?? "").toString(),
      min_courses_needed: parseInt((r["min_courses_needed"] ?? "0"), 10) || 0,
      elective_pool_codes: (r["elective_pool_codes"] ?? "").toString(),
      elective_pool_pillars: (r["elective_pool_pillars"] ?? "").toString(),
      elective_min: parseInt((r["elective_min"] ?? "0"), 10) || 0
    }));

    res.json({ tracks });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/minors", async (req, res) => {
  try {
    const raw = await getSheetData("Minors!A:E");
    const rows = mapRowsWithHeaders(raw);

    const minors = rows.map(r => ({
      id: r.id,
      minor_name: (r["minor_name"] ?? "").toString().trim(),
      mandatory_courses: (r["mandatory_courses"] ?? "").toString(),
      choice_courses: (r["choice_courses"] ?? "").toString(),
      choice_min: parseInt((r["choice_min"] ?? "0"), 10) || 0
    }));

    res.json({ minors });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/term-template", async (req, res) => {
  try {
    const raw = await getSheetData("term template!A:E");
    const termTemplate = mapRowsWithHeaders(raw);
    res.json({ termTemplate });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/progress", async (req, res) => {
  try {
    res.json({ progress: "Not implemented yet" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});




app.post("/download-excel", async (req, res) => {
  const { selection, results } = req.body; // include input + output

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Validation Results");

  // Input sheet
  const inputSheet = workbook.addWorksheet("Selection");
  Object.entries(selection).forEach(([term, courses]) => {
    inputSheet.addRow([term, ...courses]);
  });

  // Output sheet
  sheet.addRow(["Unmet", results.unmet.join(", ")]);
  sheet.addRow(["Fulfilled Tracks", results.fulfilledTracks.join(", ")]);
  sheet.addRow(["Fulfilled Minors", results.fulfilledMinors.join(", ")]);
  sheet.addRow(["Credits", JSON.stringify(results.creditStatus)]);

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
  res.send(buffer);
});

app.post("/save-plan", async (req, res) => {
  try {
    const { studentId, selection, results } = req.body;
    const db = await connectDB();
    await db.collection("plans").insertOne({ studentId, selection, results, savedAt: new Date() });
    res.json({ success: true });   // <-- must send JSON
  } catch (err) {
    console.error("Error saving plan:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/load-plan/:studentId", async (req, res) => {
  try {
    const db = await connectDB();
    const plans = await db.collection("plans")
      .find({ studentId: req.params.studentId })
      .sort({ savedAt: -1 })
      .toArray();
    res.json({ plans });
  } catch (err) {
    console.error("Error loading plan:", err);
    res.status(500).json({ error: err.message });
  }
});



// --- Validate Selection ---
app.post("/validate-selection", async (req, res) => {
  try {
    const selection = req.body.selection ?? [];
    const isTermStructured = !Array.isArray(selection);

    // Build term-aware structures
    let selectionByTerm = {};
    let allSelected = [];

    if (isTermStructured) {
      const orderedTerms = sortTermsNatural(Object.keys(selection));
      orderedTerms.forEach(t => {
        selectionByTerm[t] = normalizeArray(selection[t] || []);
      });
      allSelected = Object.values(selectionByTerm).flat().map(normalize);

    } else {
      // Flat array: treat as single "Term 0" for presence checks; timing cannot be enforced strictly
      const normalized = normalizeArray(selection);
      selectionByTerm["Term 0"] = normalized;
      allSelected = normalized;
    }

    // course -> term index map
    
// course -> term number map
const termNames = Object.keys(selectionByTerm);
const courseToTerm = {};

termNames.forEach(termName => {
  // extract the last number in the term string, e.g. "Term 4" → 4
  const match = termName.match(/(\d+)(?!.*\d)/);
  const termNum = parseInt(match?.[0] || "0", 10);

  (selectionByTerm[termName] || []).forEach(code => {
    courseToTerm[normalize(code)] = termNum;
  });
});


    // Load sheets and sanitize
    const prereqsRaw = await getSheetData("Prerequisites!A:C");
    const tracksRaw = await getSheetData("Tracks!A:G");
    const minorsRaw = await getSheetData("Minors!A:E");
    const coursesRaw = await getSheetData("Courses!A:H");

    const tracksRows = mapRowsWithHeaders(tracksRaw);
    const minorsRows = mapRowsWithHeaders(minorsRaw);
    const coursesRows = mapRowsWithHeaders(coursesRaw);

    const tracks = tracksRows.map(r => ({
      track_name: (r["track_name"] ?? "").toString().trim(),
      required_courses: (r["required_courses"] ?? "").toString(),
      min_courses_needed: parseInt((r["min_courses_needed"] ?? "0"), 10) || 0,
      elective_pool_codes: (r["elective_pool_codes"] ?? "").toString(),
      elective_pool_pillars: (r["elective_pool_pillars"] ?? "").toString(),
      elective_min: parseInt((r["elective_min"] ?? "0"), 10) || 0
    }));

    const minors = minorsRows.map(r => ({
      minor_name: (r["minor_name"] ?? "").toString().trim(),
      mandatory_courses: (r["mandatory_courses"] ?? "").toString(),
      choice_courses: (r["choice_courses"] ?? "").toString(),
      choice_min: parseInt((r["choice_min"] ?? "0"), 10) || 0
    }));

    const courses = coursesRows.map(r => ({
      course_code: normalize(r["course_code"]),
      course_name: (r["course_name"] ?? "").toString().trim(),
      credits: parseInt((r["credits"] ?? "").toString().trim(), 10) || 0,
      type: normalize(r["type"]),
      term_offered: (r["term_offered"] ?? "").toString().trim(),
      pillar: normalize(r["pillar"])
    }));

    // Debug logs
    console.log("Selected courses:", allSelected);
    console.log("First few courses from sheet:", courses.slice(0, 5));
    console.log("First few tracks:", tracks.slice(0, 3));
    console.log("First few prereqs:", prereqsRaw.slice(0, 5));

// --- 1. Prerequisites with term awareness ---
const unmet = [];
const prereqRows = prereqsRaw.slice(1);

prereqRows.forEach(([rawCourse, rawPrereq, rawType]) => {
  const course = normalize(rawCourse);
  const prereq = normalize(rawPrereq);
  const type = (rawType ?? "").toString().trim();

  if (courseToTerm[course] !== undefined) {
    const courseTerm = courseToTerm[course];
    const prereqTerm = courseToTerm[prereq];

    if (type === "Pre") {
      if (isTermStructured) {
        if (prereqTerm === undefined || prereqTerm >= courseTerm) {
          unmet.push(`${course} requires ${prereq} before enrollment`);
        }
      } else if (prereqTerm === undefined) {
        unmet.push(`${course} requires ${prereq} before enrollment`);
      }
    }

    if (type === "Co") {
      if (isTermStructured) {
        if (prereqTerm === undefined || prereqTerm > courseTerm) {
          unmet.push(`${course} requires ${prereq} taken concurrently or in an earlier term`);
        }
      } else if (prereqTerm === undefined) {
        unmet.push(`${course} requires ${prereq} taken concurrently or earlier`);
      }
    }
  }
});

// --- Helper: prerequisitesMet ---
function prerequisitesMet(course) {
  const prereqs = prereqRows.filter(r => normalize(r[0]) === course);
  return prereqs.every(([rawCourse, rawPrereq, rawType]) => {
    const prereq = normalize(rawPrereq);
    const type = (rawType ?? "").toString().trim();
    const courseTerm = courseToTerm[course];
    const prereqTerm = courseToTerm[prereq];

    if (type === "Pre") {
      return isTermStructured
        ? prereqTerm !== undefined && prereqTerm < courseTerm
        : prereqTerm !== undefined;
    }
    if (type === "Co") {
      return isTermStructured
        ? prereqTerm !== undefined && prereqTerm <= courseTerm
        : prereqTerm !== undefined;
    }
    return true;
  });
}

const validSelected = allSelected.filter(c => prerequisitesMet(c));



    // --- 2. Tracks ---
    function toCodes(listStr) {
      return listStr
        .split(",")
        .map(s => s.replace(/\t/g, " "))
        .map(normalize)
        .filter(Boolean);
    }

    function checkGroup(group, selected) {
      const requiredCount = group.requiredCourses.filter(c => selected.includes(c)).length;
      const requiredMet = requiredCount >= group.minCoursesNeeded;

      const electivePool = [...group.electivePoolCodes, ...group.electivePoolPillars];
      const electiveCount = electivePool.filter(c => selected.includes(c)).length;
      const electiveMet = electiveCount >= group.electiveMin;

      return requiredMet && electiveMet;
    }

const fulfilledTracks = [];
tracks.forEach(track => {
  let electivePool = toCodes(track.elective_pool_codes || []);
  if (track.elective_pool_pillars.includes("ISTD")) {
    electivePool = electivePool.concat(
      courses.filter(c => c.pillar === "ISTD" && c.type === "ELECTIVE").map(c => c.course_code)
    );
  }

  const group = {
    requiredCourses: toCodes(track.required_courses || ""),
    minCoursesNeeded: track.min_courses_needed || 0,
    electivePoolCodes: electivePool,
    electivePoolPillars: [], // already merged above
    electiveMin: track.elective_min || 0
  };

  if (checkGroup(group, validSelected) && !fulfilledTracks.includes(track.track_name)) {
    fulfilledTracks.push(track.track_name);
  }
});


    // --- 3. Minors ---
function toCodes(listStr) {
  return listStr
    .split(",")
    .map(s => s.replace(/\t/g, " ").trim())
    .filter(c => c && c !== "-")
    .map(normalize);
}

const fulfilledMinors = [];
const minorsByName = {};

// Group rows by minor name
minors.forEach(m => {
  const name = m.minor_name;
  if (!minorsByName[name]) minorsByName[name] = [];
  minorsByName[name].push({
    mandatoryCourses: toCodes(m.mandatory_courses || ""),
    choiceGroup: m.choice_group,
    choiceCourses: toCodes(m.choice_courses || ""),
    choiceMin: parseInt(m.choice_min || "0", 10)
  });
});

Object.entries(minorsByName).forEach(([minorName, groups]) => {
  // 1. Collect all mandatory courses
  const allMandatory = groups.flatMap(g => g.mandatoryCourses);
  const mandatoryMet = allMandatory.length === 0 || allMandatory.every(c => allSelected.includes(c));

  // 2. Check each group’s choiceMin


const allGroupsMet = groups.every(group => {
  if (group.choiceCourses.length === 0) return true;
  const count = group.choiceCourses.filter(c => validSelected.includes(c)).length;
  console.log(`Minor ${minorName} - Group ${group.choiceGroup}: need ${group.choiceMin}, found ${count}`);
  return count >= group.choiceMin;
});


  console.log(`Minor ${minorName}: mandatoryMet=${mandatoryMet}, allGroupsMet=${allGroupsMet}`);
  if (mandatoryMet && allGroupsMet) {
    fulfilledMinors.push(minorName);
  }
});



    // --- 4. Credits ---
// --- 4. Credits ---
let hassCredits = 0;
let electiveCredits = 0;       // ISTD electives only
let allElectiveCredits = 0;    // all electives across pillars
let coreCredits = 0;

const uniqueSelected = [...new Set(validSelected)];

uniqueSelected.forEach(code => {
  const course = courses.find(c => c.course_code === code);
  if (!course) return;

  const creditVal = course.credits || 0;
  const pillar = course.pillar;
  const type = course.type;

  if (pillar === "HASS") {
    hassCredits += creditVal;
  } else if (type === "ELECTIVE" && pillar === "ISTD") {
    electiveCredits += creditVal;       // ISTD electives
    allElectiveCredits += creditVal;    // also count toward all electives
  } else if (type === "ELECTIVE") {
    allElectiveCredits += creditVal;    // non‑ISTD electives
  } else if (type === "CORE" && pillar === "ISTD") {
    coreCredits += creditVal;
  }
});

const creditStatus = {
  hassMet: hassCredits >= 60,
  hassCredits,
  electiveMet: electiveCredits >= 60,
  electiveCredits,
  coreMet: coreCredits >= 60,
  coreCredits,
  allElectiveCreditsMet: allElectiveCredits >= 96,
  allElectiveCredits
};

res.json({ unmet, validSelected, fulfilledTracks, fulfilledMinors, creditStatus });


  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: true, message: err.message, stack: err.stack });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running locally at http://localhost:${PORT}`);
  });
}

// --- Export for Vercel ---
module.exports = (req, res) => {
  app(req, res);
};