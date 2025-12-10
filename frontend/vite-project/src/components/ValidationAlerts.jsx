import { useState } from "react";
import { validateSelection } from "../services/api";

export default function ValidationAlerts({ selection }) {
  const [alerts, setAlerts] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [minors, setMinors] = useState([]);
  const [credits, setCredits] = useState({});

async function check() {
  // flatten { term1: [...], term2: [...] } into a single array
  const flatSelection = Object.values(selection).flat();
  const result = await validateSelection(flatSelection);
  setAlerts(result.unmet || []);
  setTracks(result.fulfilledTracks || []);
  setMinors(result.fulfilledMinors || []);
  setCredits(result.creditStatus || {});
}


  return (
    <div>
      <button onClick={check}>Validate</button>

      {alerts.length > 0 && (
        <>
          <h3>Unmet Prerequisites</h3>
          <ul>{alerts.map((a, idx) => <li key={idx}>{a}</li>)}</ul>
        </>
      )}

      {tracks.length > 0 && (
        <>
          <h3>Tracks Fulfilled</h3>
          <ul>{tracks.map((t, idx) => <li key={idx}>{t}</li>)}</ul>
        </>
      )}

      {minors.length > 0 && (
        <>
          <h3>Minors Fulfilled</h3>
          <ul>{minors.map((m, idx) => <li key={idx}>{m}</li>)}</ul>
        </>
      )}

      {credits && (
        <>
          <h3>Credit Requirements</h3>
          <ul>
            <li>HASS: {credits.hassCredits} / 60 {credits.hassMet ? "✅" : "❌"}</li>
            <li>Electives: {credits.electiveCredits} / 96 {credits.electiveMet ? "✅" : "❌"}</li>
            <li>ISTD Core: {credits.coreCredits} / 60 {credits.coreMet ? "✅" : "❌"}</li>
          </ul>
        </>
      )}
    </div>
  );
}
