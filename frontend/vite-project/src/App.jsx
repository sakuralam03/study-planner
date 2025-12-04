import CourseDropdown from "./components/CourseDropdown";
import TermPlanner from "./components/TermPlanner";
import ValidationAlerts from "./components/ValidationAlerts";
import ProgressDashboard from "./components/ProgressDashboard";
import { useState } from "react";

export default function App() {
  const [selectedCourse, setSelectedCourse] = useState("");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Course Planner Dashboard</h1>

      <section>
        <h2>Course Catalog</h2>
        <CourseDropdown onSelect={setSelectedCourse} />
      </section>

      <section>
        <h2>Term Planner</h2>
        <TermPlanner />
      </section>

      <section>
        <h2>Validation Alerts</h2>
        <ValidationAlerts selection={selectedCourse} />
      </section>

      <section>
        <h2>Progress Dashboard</h2>
        <ProgressDashboard />
      </section>
    </div>
  );
}
