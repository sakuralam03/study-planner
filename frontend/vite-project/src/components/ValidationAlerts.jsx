import { useState } from "react";
import { validateSelection } from "../services/api";

export default function ValidationAlerts({ selection }) {
  const [alerts, setAlerts] = useState([]);

  async function check() {
    const result = await validateSelection(selection);
    setAlerts(result.unmet || []);
  }

  return (
    <div>
      <button onClick={check}>Validate</button>
      {alerts.length > 0 && (
        <ul>
          {alerts.map((a, idx) => <li key={idx}>{a}</li>)}
        </ul>
      )}
    </div>
  );
}
