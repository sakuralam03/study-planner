// App.jsx
import { useState, useEffect, memo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./components/LoginPage.jsx";
import Plans from "./components/Plans.jsx";
import TermsModal from "./components/TermsModal.jsx";
import CourseDropdown from "./components/CourseDropdown.jsx";
import ValidationAlerts from "./components/ValidationAlerts.jsx";
import ResultsDownload from "./components/ResultsDownload.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";

import {
  getTracks,
  getMinors,
  getCourses,
  getTermTemplate,
  validateSelection,
  loadPlan,
  savePlan,
} from "./services/api";

/* ---------------- TermCard ---------------- */
const TermCard = memo(function TermCard({
  termIndex,
  selection,
  courses,
  handleCourseSelect,
  handleHeaderChange,
  handlePassedToggle,
}) {
  const termData =
    selection[termIndex + 1] || { header: `Term ${termIndex + 1}`, courses: [] };
  const header = termData.header;
  const coursesForTerm = termData.courses || [];

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px" }}>
      <h3>{header}</h3>
      <input
        type="text"
        value={header}
        onChange={(e) => handleHeaderChange(termIndex + 1, e.target.value)}
      />
      {Array.from({ length: 5 }).map((_, slotIndex) => {
        const slot = coursesForTerm[slotIndex] || { code: "", passed: false };
        return (
          <div key={slotIndex} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CourseDropdown
              courses={courses}
              value={slot.code}
              onSelect={(courseCode) =>
                handleCourseSelect(termIndex + 1, slotIndex, courseCode)
              }
            />
            <label>
              <input
                type="checkbox"
                checked={slot.passed || false}
                onChange={() => handlePassedToggle(termIndex + 1, slotIndex)}
              />
              Passed
            </label>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  const prevTerm = prevProps.selection[prevProps.termIndex + 1];
  const nextTerm = nextProps.selection[nextProps.termIndex + 1];
  return JSON.stringify(prevTerm) === JSON.stringify(nextTerm);
});

/* ---------------- Helpers ---------------- */
function flattenSelection(selection) {
  const allCodes = [];
  Object.values(selection).forEach(term => {
    if (term.courses) {
      allCodes.push(...term.courses.filter(c => c?.passed).map(c => c.code));
    }
  });
  return allCodes;
}

/* ---------------- PlannerUI ---------------- */
function PlannerUI({
  user,
  setUser,
  agreed,
  setAgreed,
  plans,
  selection,
  courses,
  numTerms,
  setNumTerms,
  handleCourseSelect,
  handleHeaderChange,
  handlePassedToggle,
  results,
  savePlanHandler,
  selectedTrack,
  selectedMinor,
  groupedMinors,
}) {
  if (!user) return <LoginPage onLogin={setUser} />;
  if (!agreed) return <TermsModal onAgree={() => setAgreed(true)} />;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Student Study Planner</h1>

      <button
        onClick={() => {
          setUser(null);
          setAgreed(false);
        }}
        style={{ marginBottom: "20px" }}
      >
        Logout
      </button>

      <Plans studentId={user.studentId} plans={plans.slice(0, 1)} />

      <section>
        <h2>Term Planner</h2>
        <label>
          Number of terms:{" "}
          <input
            type="number"
            min="1"
            max="20"
            value={numTerms}
            onChange={(e) => setNumTerms(parseInt(e.target.value, 10))}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {Array.from({ length: numTerms }).map((_, termIndex) => (
            <TermCard
              key={`term-${termIndex}`}
              termIndex={termIndex}
              selection={selection}
              courses={courses}
              handleCourseSelect={handleCourseSelect}
              handleHeaderChange={handleHeaderChange}
              handlePassedToggle={handlePassedToggle}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Validation Alerts</h2>
        <ValidationAlerts
          selection={selection}
          track={selectedTrack}
          minor={selectedMinor}
          minorRules={groupedMinors[selectedMinor]}
        />
      </section>

      {results && (
        <>
          <ResultsDownload
            selection={selection}
            results={results}
            studentId={user.studentId}
          />
          <button onClick={savePlanHandler}>Save Plan</button>
        </>
      )}
    </div>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [agreed, setAgreed] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [minors, setMinors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [termTemplate, setTermTemplate] = useState([]);
  const [selection, setSelection] = useState({});
  const [results, setResults] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedMinor, setSelectedMinor] = useState("");
  const [plans, setPlans] = useState([]);
  const [numTerms, setNumTerms] = useState(8);

  /* Persist login */
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  /* Load static data */
  useEffect(() => {
    async function loadData() {
      setTracks((await getTracks()).tracks);
      setMinors((await getMinors()).minors);
      setCourses((await getCourses()).courses);
      setTermTemplate((await getTermTemplate()).termTemplate);
    }
    loadData();
  }, []);

  /* Auto-validate */
  useEffect(() => {
    if (!Object.keys(selection).length) return;
    validateSelection(flattenSelection(selection)).then(setResults);
  }, [selection]);

  /* Load plans */
  useEffect(() => {
    if (!user) return;
    loadPlan(user.studentId).then(data => {
      setPlans(data.plans);
      if (data.plans?.length) {
        setSelection(data.plans[0].selection);
        setResults(data.plans[0].results);
      }
    });
  }, [user]);

  /* Handlers */
  const handleCourseSelect = (termIndex, slotIndex, courseCode) => {
    setSelection(prev => {
      const term = prev[termIndex] || { header: `Term ${termIndex}`, courses: [] };
      const courses = [...term.courses];
      courses[slotIndex] = { code: courseCode, passed: courses[slotIndex]?.passed || false };
      return { ...prev, [termIndex]: { ...term, courses } };
    });
  };

  const handleHeaderChange = (termIndex, newHeader) => {
    setSelection(prev => {
      const term = prev[termIndex] || { header: `Term ${termIndex}`, courses: [] };
      return { ...prev, [termIndex]: { ...term, header: newHeader } };
    });
  };

  const handlePassedToggle = (termIndex, slotIndex) => {
    setSelection(prev => {
      const term = prev[termIndex];
      const courses = [...term.courses];
      if (courses[slotIndex]) {
        courses[slotIndex] = { ...courses[slotIndex], passed: !courses[slotIndex].passed };
      }
      return { ...prev, [termIndex]: { ...term, courses } };
    });
  };

  async function savePlanHandler() {
    const validatedResults = await validateSelection(flattenSelection(selection));
    const data = await savePlan(user.studentId, selection, validatedResults);
    if (data.success) {
      const updated = await loadPlan(user.studentId);
      setPlans(updated.plans);
      alert("Plan saved successfully!");
    }
  }

  const groupedMinors = minors.reduce((acc, m) => {
    (acc[m.minor_name] ||= []).push(m);
    return acc;
  }, {});

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PlannerUI
                            user={user}
              setUser={setUser}
              agreed={agreed}
              setAgreed={setAgreed}
              plans={plans}
              selection={selection}
              courses={courses}
              numTerms={numTerms}
              setNumTerms={setNumTerms}
              handleCourseSelect={handleCourseSelect}
              handleHeaderChange={handleHeaderChange}
              handlePassedToggle={handlePassedToggle}
              results={results}
              savePlanHandler={savePlanHandler}
              selectedTrack={selectedTrack}
              selectedMinor={selectedMinor}
              groupedMinors={groupedMinors}
            />
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
