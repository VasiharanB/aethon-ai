import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ContentPanel from "../components/ContentPanel";
import CodingPanel from "../components/CodingPanel";
import "./test.css";
import API_URL from "../config/api";

function PracticePage() {
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [practice, setPractice] = useState(null);
  const [answers, setAnswers] = useState({});
  const codingPanelRef = useRef();

  const [hasRunCodeMap, setHasRunCodeMap] = useState({});

  const [terminalLogs, setTerminalLogs] = useState("Terminal ready. Click 'Run Code' to execute visible tests.");
  const [executionStats, setExecutionStats] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const shortMessage = message.split(" ").slice(0, 4).join(" ");
    const toastId = Date.now() + Math.random();
    setToasts(prev => [...prev, { id: toastId, message: shortMessage, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 3000);
  };

  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get("email") || "guest@student.com";
  const nameFromUrl = urlParams.get("name");
  if (nameFromUrl) {
    localStorage.setItem("userName", nameFromUrl);
  }

  useEffect(() => {
    const cachedName = localStorage.getItem("userName");
    if (!cachedName && userEmail && userEmail !== "guest@student.com") {
      fetch(`${API_URL}/student/profile?email=${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            localStorage.setItem("userName", data.name);
          }
        })
        .catch(err => console.error("Failed to fetch user name:", err));
    }
  }, [userEmail]);

  useEffect(() => {
    fetch(`${API_URL}/practice-full/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setPractice(data);
          setQuestions(data.questions || []);
          if (data.questions && data.questions.length > 0) {
            setSelected(data.questions[0]); 
          }
        }
      })
      .catch(err => console.error("Failed to load practice", err));
  }, [id]);

  const closePractice = () => {
    window.parent.postMessage({ action: 'close_practice' }, "*");
  };

  const submitPractice = async () => {
    try {
      await fetch(`${API_URL}/submit-practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_id: id,
          student_email: userEmail
        })
      });
    } catch (err) {
      console.error("Submission failed", err);
    }
    closePractice();
  };

  const username = localStorage.getItem("userName") || userEmail.split("@")[0].toUpperCase();

  return (
    <div className="app-layout">
      {/* Toast Notification Layer */}
      <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
        {toasts.map(t => {
          const isError = t.type === "error";
          const isWarning = t.type === "warning";
          const isSuccess = t.type === "success";
          
          const bg = isError 
            ? "#991b1b" 
            : isWarning 
              ? "#854d0e" 
              : isSuccess 
                ? "#166534" 
                : "#1e40af";

          return (
            <div key={t.id} style={{ 
              backgroundColor: bg,
              color: "white",
              padding: "10px 18px", 
              borderRadius: "10px", 
              fontWeight: "600", 
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              fontSize: "13px", 
              pointerEvents: "none",
              animation: "slideUpFade 0.3s ease-out forwards"
            }}>
              <i className={isError ? "ri-error-warning-fill" : isSuccess ? "ri-checkbox-circle-fill" : isWarning ? "ri-alert-fill" : "ri-information-fill"} style={{ fontSize: "16px", color: "white" }}></i>
              {t.message}
            </div>
          );
        })}
      </div>

      {/* Navigation header */}
      <nav className="navbar">
        <div className="nav-left">
          <button className="nav-exit" onClick={closePractice}>
            <i className="ri-arrow-left-line"></i> Exit Practice
          </button>
          <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)" }}></div>
          <span className="nav-badge-slot">PRACTICE</span>
          <span className="nav-title">{practice ? practice.title : "Practice Session"}</span>
          <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)" }}></div>
          <span className="nav-autosave-text">User: {username}</span>
        </div>

        <div className="nav-right">
          <button 
            onClick={() => {
              if (window.confirm("Submit your practice session?")) {
                submitPractice();
              }
            }} 
            className="nav-btn-submit"
          >
            <i className="ri-checkbox-circle-line"></i> Submit Practice
          </button>
        </div>
      </nav>

      {/* Main Workspace split */}
      <div className="workspace">
        {selected ? (
          <>
            {/* Left panel for problem statement and results */}
            <main className="center-panel" style={{ width: "50%" }}>
              <ContentPanel 
                question={selected} 
                terminalLogs={terminalLogs}
                executionStats={executionStats}
                isRunningTests={isRunningTests}
                isSubmittingQuestion={isSubmittingQuestion}
                hasRun={!!hasRunCodeMap[selected?.id]}
              />
            </main>
            
            {/* Right panel for code editor and actions */}
            <section className="right-panel" style={{ width: "50%" }}>
              <CodingPanel 
                ref={codingPanelRef}
                question={selected} 
                answers={answers} 
                setAnswers={setAnswers} 
                onSubmit={submitPractice} 
                addToast={addToast}
                hasRun={!!hasRunCodeMap[selected?.id]}
                onRunCode={() => setHasRunCodeMap(prev => ({ ...prev, [selected.id]: true }))}
                onSubmitQuestion={() => {
                  addToast("Practice question code submitted!", "success");
                }}
                terminalLogs={terminalLogs}
                setTerminalLogs={setTerminalLogs}
                executionStats={executionStats}
                setExecutionStats={setExecutionStats}
                isRunningTests={isRunningTests}
                setIsRunningTests={setIsRunningTests}
                isSubmittingQuestion={isSubmittingQuestion}
                setIsSubmittingQuestion={setIsSubmittingQuestion}
              />
            </section>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <div style={{ textAlign: "center" }}>
              <i className="ri-loader-4-line ri-spin" style={{ fontSize: "32px", color: "#ffffff", marginBottom: "16px", display: "inline-block" }}></i>
              <h3 style={{ fontWeight: "600", color: "#ffffff" }}>Loading Practice Environment...</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticePage;
