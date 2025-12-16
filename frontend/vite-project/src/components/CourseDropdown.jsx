export default function CourseDropdown({ courses, value, onSelect }) {
  return (
    <select value={value || ""} onChange={e => onSelect(e.target.value)}>
      <option value="">Select a course</option>
      {courses.map((c, idx) => (
        <option key={idx} value={c.course_code}>
          {c.course_name}
        </option>
      ))}
    </select>
  );
}
