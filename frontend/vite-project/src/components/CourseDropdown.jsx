import { useState } from "react";

export default function CourseDropdown({ courses, value, onSelect, termIndex }) {
  const [filterByTerm, setFilterByTerm] = useState(false);

  const filteredCourses = filterByTerm
    ? courses.filter(c => c.term_offered?.includes(String(termIndex)))
    : courses;

  return (
    <div className="course-dropdown-wrapper">
      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filterByTerm}
          onChange={e => setFilterByTerm(e.target.checked)}
        />
        {" "}Filter by term
      </label>
      <select value={value || ""} onChange={e => onSelect(e.target.value)}>
        <option value="">Select a course</option>
        {filteredCourses.map((c, idx) => (
          <option key={idx} value={c.course_code}>
            {c.course_code} — {c.course_name}
          </option>
        ))}
      </select>
    </div>
  );
}