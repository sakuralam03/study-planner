// App.jsx
import { useState, useEffect } from "react";
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

  // Persist login
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Load static data
  useEffect(() => {
    async function loadData() {
      const tracksRes = await getTracks();
      setTracks(tracksRes.tracks);

      const minorsRes = await getMinors();
      setMinors(minorsRes.minors);

      const coursesRes = await getCourses();
      setCourses(coursesRes.courses);

      const termTemplateRes = await getTermTemplate();
      setTermTemplate(termTemplateRes.termTemplate);
    }
    loadData();
  }, []);

  // Auto‑validate whenever selection changes
  useEffect(() => {
    async function autoValidate() {
      if (!selection || Object.keys(selection).length === 0) return;
      const data = await validateSelection(selection);
      setResults(data);
    }
    autoValidate();
  }, [selection]);

  // Load plans when user logs in
  useEffect(() => {
    async function loadPlans() {
      if (!user) return;
      const data = await loadPlan(user.studentId);
      setPlans(data.plans);

      if (data.plans && data.plans.length > 0) {
        const latest = data.plans[0];
        setSelection(latest.selection);
        setResults(latest.results);
      }
    }
    loadPlans();
  }, [user]);

  const handleCourseSelect = (termIndex, slotIndex, courseCode) => {
    setSelection((prev) => {
      const updated = { ...prev };
      if (!updated[termIndex]) updated[termIndex] = [];
      updated[termIndex][slotIndex] = courseCode;
      return updated;
    });
  };

  async function savePlanHandler() {
    try {
      const validatedResults = await validateSelection(selection);
      const data = await savePlan(user.studentId, selection, validatedResults);
      if (data.success) {
        const updated = await loadPlan(user.studentId);
        setPlans(updated.plans);
        alert("Plan saved successfully!");
      }
    } catch (err) {
      console.error("Error saving plan:", err);
      alert("Error saving plan.");
    }
  }

  function getSlotsForTerm(termIndex) {

    return 4; // Default to 4 slots per term
  }

  const groupedMinors = minors.reduce((acc, m) => {
    if (!acc[m.minor_name]) acc[m.minor_name] = [];
    acc[m.minor_name].push(m);
    return acc;
  }, {});

  // Planner UI extracted into its own function
  function PlannerUI() {
    if (!user) return <LoginPage onLogin={setUser} />;
    if (!agreed) return <TermsModal onAgree={() => setAgreed(true)} />;

    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Student Study Planner</h1>

        <button
          onClick={() => {
            setUser(null);c
            setAgreed(false);
          }}
          style={{ marginBottom: "20px" }}
        >
          Logout
        </button>

        <Plans studentId={user.studentId} plans={plans.slice(0, 1)} />

      <section>
  <h2>Term Planner</h2>
  <div style={{ marginBottom: "20px" }}>
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
  </div>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
    }}
  >
    {Array.from({ length: numTerms }).map((_, termIndex) => (
      <div key={termIndex} style={{ border: "1px solid #ccc", padding: "10px" }}>
        <h3>Term {termIndex + 1}</h3>
        <input
          type="text"
          placeholder={`Custom label for Term ${termIndex + 1}`}
          value={selection[termIndex + 1]?.label || ""}
          onChange={(e) => {
            setSelection((prev) => {
              const updated = { ...prev };
              if (!updated[termIndex + 1]) updated[termIndex + 1] = [];
              updated[termIndex + 1].label = e.target.value;
              return updated;
            });
          }}
        />
        {Array.from({ length: getSlotsForTerm(termIndex) }).map((_, slotIndex) => (
          <CourseDropdown
            key={slotIndex}
            courses={courses}
            value={selection[termIndex + 1]?.[slotIndex] || ""}
            onSelect={(courseCode) =>
              handleCourseSelect(termIndex + 1, slotIndex, courseCode)
            }
          />
        ))}
      </div>
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

  // Router setup
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlannerUI />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
