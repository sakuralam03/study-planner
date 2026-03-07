export default function Plans({ studentId, plans }) {
  if (!plans || !plans.length) {
    return <p>No saved plans yet.</p>;
  }

  const plan = plans[0];

  return (
    <div className="plans-table-container">
      <h2>Saved Plan for Student {studentId}</h2>
      <table className="plans-table">
        <thead>
          <tr>
            <th>Term</th>
            <th>Courses</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(plan.selection).map(([termIndex, term]) => (
            <tr key={termIndex}>
              <td>{term.header}</td>
              <td>
                {term.courses.map((c, i) => {
                  if (!c) return null; // skip null entries
                  return (
                    <span key={i} className="course-pill">
                      {c.code || ""} {c.passed ? "✓" : ""}
                    </span>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
