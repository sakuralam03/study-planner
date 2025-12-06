export default function CourseDropdown({ courses, onSelect }) {
  return (
    <select onChange={e => onSelect(e.target.value)}>
      <option value="">Select a course</option>
      {courses.map((c, idx) => (
        <option key={idx} value={c.course_code}>
          {c.course_name}
        </option>
      ))}
    </select>
  );
}
