function Plans({ studentId, plans }) {
  return (
    <div>
      <h2>Saved Plans for {studentId}</h2>
      {(!plans || plans.length === 0) ? (
        <p>No plans found.</p>
      ) : (
        <ul>
          {plans.map(plan => (
            <li key={plan._id}>
              <strong>Saved At:</strong> {new Date(plan.savedAt).toLocaleString()} <br />
              <strong>Selection:</strong>
              <ul>
                {Object.entries(plan.selection).map(([term, data]) => (
                  <li key={term}>
                    {data.header || `Term ${term}`}: {data.courses?.map(c => c ? (c.code + (c.passed ? " ✓" : "")) : "")
               .filter(Boolean)
               .join(", ") || "No courses"}


                  </li>
                ))}
              </ul>
              <strong>Results:</strong>
              {plan.results ? (
                <div>
                  <p><strong>Unmet:</strong> {plan.results.unmet?.join(", ") || "None"}</p>
                  <p><strong>Fulfilled Tracks:</strong> {plan.results.fulfilledTracks?.join(", ") || "None"}</p>
                  <p><strong>Fulfilled Minors:</strong> {plan.results.fulfilledMinors?.join(", ") || "None"}</p>
                  <p><strong>Credit Status:</strong> {JSON.stringify(plan.results.creditStatus)}</p>
                </div>
              ) : (
                "No results saved"
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Plans;
