import { useEffect, useState } from "react";
import { getProgress } from "../services/api";

export default function ProgressDashboard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getProgress().then(data => setProgress(data.percent));
  }, []);

  return (
    <div>
      <h3>Progress</h3>
      <div style={{ background: "#eee", width: "100%", height: "20px" }}>
        <div
          style={{
            background: "green",
            width: `${progress}%`,
            height: "100%",
          }}
        />
      </div>
      <p>{progress}% complete</p>
    </div>
  );
}
