import React from "react";
import "./TermsModal.css";

function TermsModal({ onAgree }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Important Notes</h2>
        <p className="important-text">
          This study plan is not a guarantee of enrolment into courses.
          We are not responsible in any discrepancy in results from actual 
          enrolment.
          <br />
          • Should there be any deviations in your progression (fail subjects,
          LOA, gap year), you must submit a new plan.
        </p>

        <p>
          Take note of academic policies in MyPortal:
          <br />• Grading and Academic Performance
          <br />• Curriculum Major Requirements Policy (AY2020 onwards)
          <br />• Policy on Exceeding Term Credit Limit
          <br />• Minimum/Maximum Workload Per Term and Auditing Subjects
        </p>

        <p>
          Graduation requirements (excluding internship):
          <br />• 144 credits Freshmore Year
          <br />• 60 credits Core (Pillar Years)
          <br />• 96 credits Electives (Pillar Years)
          <br />• 60 credits HASS (Pillar Years)
          <br />• 24 credits Capstone
          <br />• 384 credits total
        </p>

        <p>
          If you fail Freshmore/Pillar Core, you must re‑take when next offered.
          <br />
          If you fail an elective, re‑take or choose another elective.
        </p>

        <p>
          Normal workload: 48 credits per term (4 full‑term subjects).
          <br />
          Re‑taking subjects may require dropping electives/HASS.
        </p>

        <p>
          • No enrolment for credit during vacation terms unless re‑taking.
          <br />• If re‑taking, you cannot do internship concurrently.
          <br />• Capstone requires minimum 264 credits.
          <br />• Tuition fees apply for 8 terms; extra terms/vacation subjects
          incur per‑credit fees.
          <br />• Course offerings vary; enrolment is first‑come‑first‑serve.
        </p>

        <p>
          More info:{" "}
          <a href="https://sutd.edu.sg/fees" target="_blank" rel="noreferrer">
            SUTD Fees
          </a>
        </p>

        <p>
          <a
            href="https://www.sutd.edu.sg/istd/education/undergraduate/curriculum/"
            target="_blank"
            rel="noreferrer"
          >
            ISTD Curriculum
          </a>
        </p>

        <button onClick={onAgree} className="agree-btn">
          I have read and agree
        </button>
      </div>
    </div>
  );
}

export default TermsModal;
