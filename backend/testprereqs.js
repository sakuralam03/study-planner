// --- Helpers ---
function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .replace(/\s+/g, "")   // remove spaces/tabs
    .toUpperCase();
}

// --- Fake prerequisites sheet rows ---
const prereqsRaw = [
  ["course_code", "prereq_code", "prereq_type"], // header
  ["50.021", "50.007", "Co"],   // 50.021 requires 50.007 concurrently or earlier
  ["50.022", "50.008", "Pre"]   // 50.022 requires 50.008 strictly earlier
];

const prereqRows = prereqsRaw.slice(1);

// --- Core check function ---
function checkPrereqs(selection) {
  // Build course -> term map
  const courseToTerm = {};
  Object.entries(selection).forEach(([termName, codes]) => {
    const termNum = parseInt(termName.match(/\d+/)?.[0] || "0", 10);
    codes.forEach(code => {
      courseToTerm[normalize(code)] = termNum;
    });
  });

  const unmet = [];
 prereqRows.forEach(([rawCourse, rawPrereq, rawType]) => {
  const course = normalize(rawCourse);

  // Skip if this course is not in the current selection
  if (!(course in courseToTerm)) {
    return;
  }

  const prereq = normalize(rawPrereq);
  const type = (rawType || "").trim();
  const courseTerm = courseToTerm[course];
  const prereqTerm = courseToTerm[prereq];

  console.log("Checking:", { course, courseTerm, prereq, prereqTerm, type });



    if (type === "Pre") {
      if (prereqTerm === undefined || prereqTerm >= courseTerm) {
        unmet.push(`${course} requires ${prereq} before enrollment`);
      }
    }
    if (type === "Co") {
      if (prereqTerm === undefined || prereqTerm > courseTerm) {
        unmet.push(`${course} requires ${prereq} taken concurrently or earlier`);
      }
    }
  });

  return unmet;
}

// --- Test cases ---
const cases = {
  "Case 1: Co earlier term (should pass)": {
    "Term 6": ["50.007"],
    "Term 8": ["50.021"]
  },
  "Case 2: Co same term (should pass)": {
    "Term 8": ["50.007", "50.021"]
  },
  "Case 3: Co later term (should fail)": {
    "Term 9": ["50.007"],
    "Term 8": ["50.021"]
  },
  "Case 4: Pre earlier term (should pass)": {
    "Term 6": ["50.008"],
    "Term 8": ["50.022"]
  },
  "Case 5: Pre later term (should fail)": {
    "Term 9": ["50.008"],
    "Term 8": ["50.022"]
  }
};

// --- Run all cases ---
Object.entries(cases).forEach(([label, selection]) => {
  console.log("\n---", label, "---");
  const unmet = checkPrereqs(selection);
  console.log("Unmet prerequisites:", unmet);
});
