require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { readSheet } = require("./sheets");
const ExcelJS = require("exceljs");
const connectDB = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./mailer"); // your Nodemailer/SendGrid utility

const app = express();
const spreadsheetId = "1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo";

// Enable CORS for both local dev and deployed frontend
app.use(cors({
  origin: [
    "http://localhost:5173",                  // local dev
    "https://study-planner-3lqc.vercel.app"   // deployed frontend
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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

function validateRegistration({ email, password }) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error("Invalid email format");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
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
    if (!raw || raw.length === 0) {
      throw new Error("No data returned from Tracks sheet");
    }
    console.log("Raw Tracks data:", raw);

    const rows = mapRowsWithHeaders(raw);
    console.log("Mapped rows:", rows);

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
    console.error("Error in /tracks:", err);
    res.status(500).json({ error: err.message });
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
  const { selection, results } = req.body;

  const workbook = new ExcelJS.Workbook();

  const inputSheet = workbook.addWorksheet("Selection");
  const resultsSheet = workbook.addWorksheet("Validation Results");

  // Header row
  inputSheet.addRow(["Term", "Course 1", "Course 2", "Course 3", "Course 4"]);

  Object.entries(selection).forEach(([term, data]) => {
    inputSheet.addRow([
      data.header || `Term ${term}`,
      ...(data.courses || []).map(c => c.code || "")
    ]);
  });

  resultsSheet.addRow(["Unmet", (results.unmet || []).join(", ")]);
  resultsSheet.addRow(["Fulfilled Tracks", (results.fulfilledTracks || []).join(", ")]);
  resultsSheet.addRow(["Fulfilled Minors", (results.fulfilledMinors || []).join(", ")]);
  resultsSheet.addRow(["Credits", JSON.stringify(results.creditStatus || {})]);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=results.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});



app.post("/save-plan", async (req, res) => {
  try {
       console.log("Incoming save-plan:", req.body);
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


app.post("/register", async (req, res) => {
  try {
    const { studentId, name, year, password, email } = req.body;
    const db = await connectDB();

    // Validate inputs
    validateRegistration({ email, password });

    // Check if user exists
    const existing = await db.collection("users").findOne({ $or: [{ studentId }, { email }] });
    if (existing) {
      return res.status(400).json({ error: "Account already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      studentId,
      name,
      year,
      email,
      passwordHash,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const db = await connectDB();

    const user = await db.collection("users").findOne({ studentId });
    if (!user) return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid password or username" });

    // Issue JWT
    const token = jwt.sign(
      { studentId: user.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Request password reset
app.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    const db = await connectDB();

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 3600000; // 1 hour

    await db.collection("users").updateOne(
      { email },
      { $set: { resetToken, resetTokenExpiry: expiry } }
    );

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(email, "Password Reset", `Click here to reset your password: ${resetLink}`);

    res.json({ success: true });
  } catch (err) {
    console.error("Request reset error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset password
app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const db = await connectDB();

    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHash }, $unset: { resetToken: "", resetTokenExpiry: "" } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// --- Validate Selection ---

app.post("/validate-selection", async (req, res) => {
  try {
    const selection = req.body.selection ?? [];
    const isTermStructured = !Array.isArray(selection);

    // --- Flatten courses out of { header, courses } objects ---
    let allSelected = [];
    let selectionByTerm = {};

    if (isTermStructured) {
  const orderedTerms = sortTermsNatural(Object.keys(selection));
  orderedTerms.forEach(t => {
    const term = selection[t];
    if (Array.isArray(term)) {
      // old shape: term is already an array
      selectionByTerm[t] = normalizeArray(term);
    } else if (term && term.courses) {
      // new shape: term is { header, courses }
      selectionByTerm[t] = (term.courses || [])
        .filter(c => c && c.passed)              // only passed courses
        .map(c => normalize(c.code));            // normalize course code
    } else {
      selectionByTerm[t] = [];
    }
  });

  // ✅ compute once after loop
  allSelected = Object.values(selectionByTerm).flat();
} else {
  // Flat array: treat as single "Term 0"
  const normalized = normalizeArray(selection);
  selectionByTerm["Term 0"] = normalized;
  allSelected = normalized;
}


    // --- course -> term number map ---
    const courseToTerm = {};
    Object.entries(selectionByTerm).forEach(([termName, codes]) => {
      const match = termName.match(/(\d+)(?!.*\d)/);
      const termNum = parseInt(match?.[0] || "0", 10);
      codes.forEach(code => {
        courseToTerm[normalize(code)] = termNum;
      });
    });

    // --- Load sheets and sanitize ---
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

    // --- 1. Prerequisites ---
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



  
let hassCredits = 0;
    let electiveCredits = 0;
    let allElectiveCredits = 0;
    let coreCredits = 0;

    validSelected.forEach(code => {
      const course = courses.find(c => c.course_code === code);
      if (!course) return;

      const creditVal = course.credits || 0;
      const pillar = course.pillar;
      const type = course.type;

      if (pillar === "HASS") {
        hassCredits += creditVal;
      } else if (type === "ELECTIVE" && pillar === "ISTD") {
        electiveCredits += creditVal;
        allElectiveCredits += creditVal;
      } else if (type === "ELECTIVE") {
        allElectiveCredits += creditVal;
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