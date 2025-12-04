import { useEffect, useState } from "react";
import { getTermTemplate } from "../services/api";

export default function TermPlanner() {
  const [template, setTemplate] = useState([]);

  useEffect(() => {
    getTermTemplate().then(data => setTemplate(data.termTemplate));
  }, []);

  return (
    <div className="grid">
      {template.map((row, idx) => (
        <div key={idx} className="slot">
          {row.join(" | ")}
        </div>
      ))}
    </div>
  );
}
