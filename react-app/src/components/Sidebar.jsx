import { useState } from "react";

function Sidebar({
  questions = [],
  selected,
  setSelected,
  answers = {},
  flaggedQuestions = [],
  toggleFlagQuestion,
  clearAnswer,
  submittedCodingQuestions = [],
  assessment
}) {
  const totalCount = questions.length;
  const answeredCount = questions.filter((q) => {
    if (q.question_type === "coding") {
      return submittedCodingQuestions.includes(q.id);
    }
    return answers && answers[q.id] !== undefined && answers[q.id] !== "";
  }).length;

  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const candidateName = localStorage.getItem("userName") || "Vibing Vasi";
  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "VV";

  const examId = assessment && assessment.id ? `EXM${assessment.id}` : "EXM240923";
  const isCurrentFlagged = selected && flaggedQuestions.includes(selected.id);

  return (
    <div className="sidebar-wrapper" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      
      {}
      <div className="candidate-card">
        <div className="candidate-avatar">{initials}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span className="candidate-label">Candidate</span>
          <span className="candidate-name">{candidateName}</span>
          <span className="candidate-exam-id">Exam ID : {examId}</span>
        </div>
      </div>

      {}
      <div className="progress-card">
        <div className="progress-title">Progress</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="progress-stats-text">
          {answeredCount} / {totalCount} Answered
        </div>
      </div>

      {}
      <div className="progress-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="progress-title">Question Palette</div>
        <div className="navigator-grid" style={{ overflowX: "auto", overflowY: "hidden", display: "flex", gap: "8px", paddingBottom: "10px", width: "100%" }}>
          {questions.map((q, idx) => {
             const isSelected = selected && selected.id === q.id;
             const isAnswered = q.question_type === "coding"
               ? submittedCodingQuestions.includes(q.id)
               : (answers && answers[q.id] !== undefined && answers[q.id] !== "");
             const isFlagged = flaggedQuestions.includes(q.id);

             let btnClass = "nav-circle-btn";
             if (isSelected) btnClass += " current";
             else if (isAnswered) btnClass += " answered";
             if (isFlagged) btnClass += " flagged";

             return (
               <button
                 key={q.id}
                 className={btnClass}
                 onClick={() => setSelected && setSelected(q)}
                 title={q.question_title}
                 style={{ flexShrink: 0 }}
               >
                 {idx + 1}
               </button>
             );
           })}
        </div>

        {}
        <div className="navigator-legend" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <div className="legend-item">
            <div className="legend-dot answered" style={{ backgroundColor: "#3B82F6" }} />
            <span>Answered</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot current" style={{ border: "1px solid #3B82F6", backgroundColor: "transparent" }} />
            <span>Current</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot flagged" style={{ border: "1px solid var(--yellow)", backgroundColor: "transparent" }} />
            <span>Flagged</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot unvisited" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)" }} />
            <span>Unvisited</span>
          </div>
        </div>
      </div>

      {}
      <div className="sidebar-actions" style={{ marginTop: "auto" }}>
        <button
          className={`action-outline-btn ${isCurrentFlagged ? "active" : ""}`}
          onClick={() => selected && toggleFlagQuestion && toggleFlagQuestion(selected.id)}
        >
          <i className={isCurrentFlagged ? "ri-flag-fill" : "ri-flag-line"}></i>
          {isCurrentFlagged ? "Unflag Review" : "Flag for Review"}
        </button>

        <button
          className="action-outline-btn"
          onClick={() => selected && clearAnswer && clearAnswer(selected.id)}
        >
          <i className="ri-close-circle-line"></i>
          Clear Answer
        </button>
      </div>

    </div>
  );
}

export default Sidebar;