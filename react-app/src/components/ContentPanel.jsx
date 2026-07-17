import { useState, useEffect } from "react";

const parseTestCase = (str) => {
  if (!str) return { input: "N/A", output: "N/A" };
  const parts = str.split(/output/i);
  const inputPart = parts[0] ? parts[0].replace(/input/i, "").replace(/[:\s]+/g, " ").trim() : str;
  const outputPart = parts[1] ? parts[1].replace(/[:\s]+/g, " ").trim() : "N/A";
  return { input: inputPart || "N/A", output: outputPart || "N/A" };
};

function ContentPanel({ 
  question, 
  hideTitle,
  terminalLogs,
  executionStats,
  isRunningTests,
  isSubmittingQuestion,
  hasRun
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");

  useEffect(() => {
    setActiveTab("problem");
  }, [question?.id]);

  if (!question) {
    return (
      <div className="panel-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <i className="ri-loader-4-line ri-spin" style={{ fontSize: "28px", color: "var(--primary-light)" }}></i>
          <span>Loading question details...</span>
        </div>
      </div>
    );
  }

  const difficulty = question.difficulty || "Medium";
  const points = question.marks || 10;
  const category = question.question_type === "coding" ? "Coding" : "Objective";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", paddingBottom: "40px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="desc-badge-row">
          <span className="desc-badge orange">{difficulty}</span>
          <span className="desc-badge blue">{category}</span>
          <span className="desc-badge grey">{points} Points</span>
        </div>
        <button
          onClick={() => setBookmarked(!bookmarked)}
          style={{ background: "transparent", border: "none", color: bookmarked ? "var(--yellow)" : "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}
          title={bookmarked ? "Bookmarked" : "Bookmark Question"}
        >
          <i className={bookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"}></i>
        </button>
      </div>

      <div className="left-panel-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginTop: "10px" }}>
        {["problem", "testcases", "result"].map((tab) => (
          <button
            key={tab}
            className={`left-panel-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "rgba(123, 92, 255, 0.15)" : "rgba(255, 255, 255, 0.02)",
              border: activeTab === tab ? "1px solid var(--primary)" : "1px solid var(--border-color)",
              color: activeTab === tab ? "var(--white)" : "var(--text-muted)",
              padding: "8px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "700",
              textTransform: "capitalize",
              transition: "all 0.2s"
            }}
          >
            {tab === "problem" ? "Problem Statement" : tab === "testcases" ? "Testcases" : "Result"}
          </button>
        ))}
      </div>

      {activeTab === "problem" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!hideTitle && (
            <h1 style={{ color: "var(--white)", fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              {question.question_title}
            </h1>
          )}

          <div style={{ color: "#c5c9db", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-line" }}>
            {question.question_text}
          </div>

          <div className="desc-section-card">
            <div className="desc-section-title green">
              <i className="ri-checkbox-circle-fill"></i>
              Requirements
            </div>
            <ul className="desc-list">
              <li>Ensure the solution covers edge cases like empty bounds or negative inputs.</li>
              <li>Code must compile and run successfully within standard compiler limits.</li>
              <li>Solution should prioritize modular logic and readability.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "testcases" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--white)", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="ri-terminal-box-line" style={{ color: "var(--primary-light)", fontSize: "16px" }}></i>
            Test Cases Evaluator
          </div>

          <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary-light)" }}>Case 1 (Visible Case):</span>
            {hasRun ? (
              <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: "600" }}>✓ Passed</span>
            ) : (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Not run yet</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>Input</div>
              <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "12.5px" }}>{parseTestCase(question.visible_testcases || `input: ${question.coding_input || question.sample_input || "Default Input"} \noutput: ${question.coding_output || question.sample_output || "Default Output"}`).input}</pre>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>Expected Output</div>
              <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "12.5px", color: "var(--green)" }}>{parseTestCase(question.visible_testcases || `input: ${question.coding_input || question.sample_input || "Default Input"} \noutput: ${question.coding_output || question.sample_output || "Default Output"}`).output}</pre>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px", marginTop: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>Case 2 (Hidden Case):</span>
            {executionStats && executionStats.memory === "14.2 MB" ? (
              <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: "600" }}>✓ Passed (Submitted)</span>
            ) : (
              <span style={{ fontSize: "11px", color: "var(--yellow)" }}>Locked (Evaluated on submission)</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", opacity: 0.7 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>Input</div>
              <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "12.5px" }}>{executionStats && executionStats.memory === "14.2 MB" ? parseTestCase(question.hidden_testcases || "").input : "••••••••"}</pre>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", opacity: 0.7 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>Expected Output</div>
              <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "12.5px", color: "var(--green)" }}>{executionStats && executionStats.memory === "14.2 MB" ? parseTestCase(question.hidden_testcases || "").output : "••••••••"}</pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "result" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--white)", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ri-terminal-box-line" style={{ color: "var(--primary-light)", fontSize: "16px" }}></i>
              Execution Output
            </div>
            {executionStats && (
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                <span>Memory: {executionStats.memory}</span>
                <span>Time: {executionStats.time}</span>
              </div>
            )}
          </div>

          <div className="terminal-block" style={{ marginTop: "0" }}>
            <div className="terminal-header">
              <div className="terminal-dot" style={{ background: "var(--primary)" }}></div>
              <span className="terminal-title">Sandbox Output Logs</span>
            </div>
            <pre className="terminal-content" style={{ maxHeight: "320px", overflowY: "auto" }}>
              {isRunningTests || isSubmittingQuestion ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="ri-loader-4-line ri-spin" style={{ color: "var(--primary-light)" }}></i>
                  Running Sandbox Compiler...
                </span>
              ) : (
                terminalLogs
              )}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContentPanel;