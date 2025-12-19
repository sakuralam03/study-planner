import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Plans from "./components/Plans.jsx";
import TermsModal from "./components/TermsModal.jsx";
import CourseDropdown from "./components/CourseDropdown";
import ValidationAlerts from "./components/ValidationAlerts";
import ResultsDownload from "./components/ResultsDownload.jsx";
import { getTracks, getMinors, getCourses, getTermTemplate } from "./services/api";

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
  const [plans, setPlans] = useState([]);   //  new state for saved plans

  // persist login
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // load static data
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
  useEffect(() => {
  async function autoValidate() {
    if (!selection || Object.keys(selection).length === 0) return;
    const response = await fetch("http://localhost:3000/validate-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection }),
    });
    const data = await response.json();
    setResults(data);
  }
  autoValidate();
}, [selection]);


  //  load plans when user logs in
useEffect(() => {
  async function loadPlans() {
    if (!user) return;
    const res = await fetch(`http://localhost:3000/load-plan/${user.studentId}`);
    const data = await res.json();
    setPlans(data.plans);

    //  restore latest plan into dropdowns and results
    if (data.plans && data.plans.length > 0) {
      const latest = data.plans[0]; // assuming sorted newest first
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

  async function validateSelection(userSelection) {
    setSelection(userSelection);
    const response = await fetch("http://localhost:3000/validate-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection: userSelection }),
    });
    const data = await response.json();
    setResults(data);
      return data;   
  }

 async function savePlan() {
  try {
    const validatedResults = await validateSelection(selection); //  get fresh results
    const response = await fetch("http://localhost:3000/save-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: user.studentId,
        selection,
        results: validatedResults   //  use the returned results, not stale state
      }),
    });

   

    const data = await response.json();
    if (data.success) {
      // reload plans
      const res = await fetch(`http://localhost:3000/load-plan/${user.studentId}`);
      const updated = await res.json();
      setPlans(updated.plans);
      alert("Plan saved successfully!");
    }
  } catch (err) {
    console.error("Error saving plan:", err);
    alert("Error saving plan.");
  }
}
function getSlotsForTerm(termIndex) {
  // termIndex is 0-based, so term 1 = index 0
  const termNumber = termIndex + 1;

  if (termNumber <= 4) {
    // Freshmore years (example: 4 terms, 4 slots each)
    return 4;
  } else if (termNumber <= 8) {
    // Pillar years (example: 5 slots each)
    return 5;
  } else {
    // Extra terms (vacation or beyond normal duration)
    return 3; // you can adjust this
  }
}


  const groupedMinors = minors.reduce((acc, m) => {
    if (!acc[m.minor_name]) acc[m.minor_name] = [];
    acc[m.minor_name].push(m);
    return acc;
  }, {});

  if (!user) return <LoginPage onLogin={setUser} />;
  if (!agreed) return <TermsModal onAgree={() => setAgreed(true)} />;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Student Study Planner</h1>

     <button
  onClick={() => {
    setUser(null);
    setAgreed(false);   //  force modal next login
  }}
  style={{ marginBottom: "20px" }}
>
  Logout
</button>
      {/*  pass plans down */}
      <Plans studentId={user.studentId} plans={plans.slice(0, 1)} />

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
                  Term {termIndex + 1 <= 8 ? termIndex + 1 : `Extra ${termIndex - 7}`}
                </h3>
                {Array.from({ length: getSlotsForTerm(termIndex) }).map((_, slotIndex) => (
                  <CourseDropdown
                  key={slotIndex}
  courses={termCourses}
  value={selection[termIndex + 1]?.[slotIndex] || ""}   //  prefill from saved plan
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

      <section>
        <h2>Validation Alerts</h2>
        <ValidationAlerts
          selection={selection}
          track={selectedTrack}
          minor={selectedMinor}
          minorRules={groupedMinors[selectedMinor]}
        />
      </section>


{/*  Auto-validate whenever selection changes */}
{results && (
  <>
    <ResultsDownload
  selection={selection}
  results={results}
  studentId={user.studentId}
/>

    <button onClick={savePlan}>Save Plan</button>
  </>
)}

    </div>
  );
}
