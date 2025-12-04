import { useEffect, useState } from "react";
import { getCourses } from "../services/api";

export default function CourseDropdown({ onSelect }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getCourses().then(data => setCourses(data.courses));
  }, []);

  return (
    <select onChange={e => onSelect(e.target.value)}>
      <option value="">Select a course</option>
      {courses.map((row, idx) => (
        <option key={idx} value={row[0]}>
          {row[1]} {/* assuming column A = code, column B = name */}
        </option>
      ))}
    </select>
  );
}
