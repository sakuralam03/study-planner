import { useState, useEffect } from "react";
import {
  getTracks,
  getMinors,
  getCourses,
  getTermTemplate,
} from "./services/api";
import CourseDropdown from "./components/CourseDropdown";
import ValidationAlerts from "./components/ValidationAlerts";
import ResultsDownload from "./components/ResultsDownload.jsx";
import TermsModal from "./components/TermsModal.jsx";
import LoginPage from "./components/LoginPage.jsx"; // ✅ fix typo


export default function App() {
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [minors, setMinors] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedMinor, setSelectedMinor] = useState("");
  const [termTemplate, setTermTemplate] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selection, setSelection] = useState({});
  const [results, setResults] = useState(null);
  const [agreed, setAgreed] = useState(false);

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

  const handleCourseSelect = (termIndex, slotIndex, courseCode) => {
    setSelection((prev) => {
      const updated = { ...prev };
      if (!updated[termIndex]) updated[termIndex] = [];
      updated[termIndex][slotIndex] = courseCode;
      return updated;
    });
  };

  async function validateSelection(userSelection) {
    setSelection(userSelection);
    const response = await fetch("http://localhost:3000/validate-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection: userSelection }),
    });
    const data = await response.json();
    setResults(data);
  }

  const groupedMinors = minors.reduce((acc, m) => {
    if (!acc[m.minor_name]) acc[m.minor_name] = [];
    acc[m.minor_name].push(m);
    return acc;
  }, {});

  // ✅ handle login first
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // ✅ handle terms modal next
  if (!agreed) {
    return <TermsModal onAgree={() => setAgreed(true)} />;
  }



  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Course Planner Dashboard</h1>

      {/* Term Planner Grid */}
      <section>
        <h2>Term Planner</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {Array.from({ length: 11 }).map((_, termIndex) => {
            const termCourses = courses.filter(
              (c) => String(c.term_offered) === String(termIndex + 1)
            );
            return (
              <div key={termIndex} style={{ border: "1px solid #ccc", padding: "10px" }}>
                <h3>
                  Term{" "}
                  {termIndex + 1 <= 8 ? termIndex + 1 : `Extra ${termIndex - 7}`}
                </h3>
                {Array.from({ length: 4 }).map((_, slotIndex) => (
                  <CourseDropdown
                    key={slotIndex}
                    courses={termCourses}
                    onSelect={(courseCode) =>
                      handleCourseSelect(termIndex + 1, slotIndex, courseCode)
                    }
                  />
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Validation */}
      <section>
        <h2>Validation Alerts</h2>
        <ValidationAlerts
          selection={selection}
          track={selectedTrack}
          minor={selectedMinor}
          minorRules={groupedMinors[selectedMinor]}
        />
      </section>

      <button onClick={() => validateSelection(selection)}>Validate Selection</button>

      {results && <ResultsDownload selection={selection} results={results} />}
    </div>
  );
}
