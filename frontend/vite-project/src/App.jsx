import { useState, useEffect } from "react";
import {
  getTracks,
  getMinors,
  getCourses,
  getTermTemplate,
  validateSelection,
  getProgress,
} from "./services/api";
import CourseDropdown from "./components/CourseDropdown";
import ValidationAlerts from "./components/ValidationAlerts";
import ProgressDashboard from "./components/ProgressDashboard";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [minors, setMinors] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedMinor, setSelectedMinor] = useState("");
  const [termTemplate, setTermTemplate] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selection, setSelection] = useState({}); // { term1: [c1,c2,c3,c4], term2: [...] }

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
  // Group minors by minor_name
  const groupedMinors = minors.reduce((acc, m) => {
    if (!acc[m.minor_name]) {
      acc[m.minor_name] = [];
    }
    acc[m.minor_name].push(m);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Course Planner Dashboard</h1>

      {/* Track & Minor Selection */}
      <section>
        <h2>Choose Track and Minor</h2>
        <label>
          Track:
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
          >
            <option value="">--Select Track--</option>
            {tracks.map((t,idx) => (
              <option key={idx} value={t.track_name}>{t.track_name}</option>
            ))}
          </select>
        </label>
        <label>
          Minor:
    <select
  value={selectedMinor}
  onChange={(e) => setSelectedMinor(e.target.value)}
>
  <option value="">--Select Minor--</option>
  {Object.keys(groupedMinors).map((minorName, idx) => (
    <option key={idx} value={minorName}>{minorName}</option>
  ))}
</select>

        </label>
      </section>

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
          <h3>Term {termIndex + 1 <= 8 ? termIndex + 1 : `Extra ${termIndex - 7}`}</h3>
          {Array.from({ length: 4 }).map((_, slotIndex) => (
            <CourseDropdown
              key={slotIndex}
              courses={termCourses}   // ✅ only courses for this term
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

      {/* Progress */}
      <section>
        <h2>Progress Dashboard</h2>
        <ProgressDashboard selection={selection} />
      </section>
    </div>
  );
}
