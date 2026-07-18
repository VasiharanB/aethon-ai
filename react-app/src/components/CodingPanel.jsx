import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";
import API_URL from "../config/api";

const parseTestCase = (str) => {
  if (!str) return { input: "N/A", output: "N/A" };
  const parts = str.split(/output/i);
  const inputPart = parts[0] ? parts[0].replace(/input/i, "").replace(/[:\s]+/g, " ").trim() : str;
  const outputPart = parts[1] ? parts[1].replace(/[:\s]+/g, " ").trim() : "N/A";
  return { input: inputPart || "N/A", output: outputPart || "N/A" };
};

const CodingPanel = forwardRef(({ 
  question, 
  answers, 
  setAnswers, 
  onSubmit, 
  addToast, 
  hasRun = false, 
  onRunCode, 
  onSubmitQuestion,
  terminalLogs,
  setTerminalLogs,
  executionStats,
  setExecutionStats,
  isRunningTests,
  setIsRunningTests,
  isSubmittingQuestion,
  setIsSubmittingQuestion
}, ref) => {
  const [selectedLang, setSelectedLang] = useState("java");
  const [draftCode, setDraftCode] = useState("");

  
  const getTemplate = (lang, qTitle) => {
    switch (lang) {
      case "python":
        return `# Python solution for: ${qTitle}\n\ndef solve():\n    # Write your code here\n    pass\n`;
      case "cpp":
        return `// C++ solution for: ${qTitle}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n`;
      case "javascript":
        return `// JavaScript solution for: ${qTitle}\nfunction solve() {\n    // Write your code here\n}\n`;
      case "java":
      default:
        return `// Java solution for: ${qTitle}\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n`;
    }
  };

  useEffect(() => {
    if (question) {
      if (answers && answers[question.id] !== undefined) {
        setDraftCode(answers[question.id]);
      } else {
        setDraftCode(getTemplate(selectedLang, question.question_title));
      }
    }
  }, [question?.id, selectedLang]);

  const handleEditorChange = (value) => {
    setDraftCode(value);
    
    if (setAnswers && question) {
      setAnswers(prev => ({ ...prev, [question.id]: value }));
    }
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTerminalLogs("Compiling source code...\nInitializing sandbox environment...\nRunning visible test cases...\n");
    setExecutionStats(null);

    const isPractice = window.location.pathname.includes("/practice/");

    try {
      const res = await fetch(`${API_URL}/run-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: draftCode,
          question_id: question?.id,
          language: selectedLang,
          is_practice: isPractice
        })
      });
      const data = await res.json();
      setIsRunningTests(false);

      if (data.terminalLogs) {
        setTerminalLogs(data.terminalLogs);
      }
      if (data.stats) {
        setExecutionStats(data.stats);
      }

      if (res.ok && data.success) {
        if (onRunCode) onRunCode();
        if (addToast) addToast("Testcases passed", "success");
      } else {
        if (addToast) addToast("Some testcases failed", "error");
      }
    } catch (err) {
      console.error("Run tests failed", err);
      setIsRunningTests(false);
      setTerminalLogs(prev => prev + "\n[ERROR] Connection error to code execution sandbox.");
      if (addToast) addToast("Network error running tests.", "error");
    }
  };

  const submitQuestion = async () => {
    setIsSubmittingQuestion(true);
    setTerminalLogs("Compiling and packaging codebase...\nRunning comprehensive suite of hidden test cases...\n");
    setExecutionStats(null);

    const isPractice = window.location.pathname.includes("/practice/");
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email") || "guest@student.com";
    const pathParts = window.location.pathname.split("/");
    const idFromPath = pathParts[pathParts.length - 1];

    if (isPractice) {
      try {
        const res = await fetch(`${API_URL}/run-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: draftCode,
            question_id: question?.id,
            language: selectedLang,
            is_practice: true
          })
        });
        const data = await res.json();
        setIsSubmittingQuestion(false);

        if (data.terminalLogs) {
          setTerminalLogs(data.terminalLogs.replace("[RESULTS]", "[SUBMIT RESULTS]"));
        }
        if (data.stats) {
          setExecutionStats(data.stats);
        }

        if (res.ok && data.success) {
          if (onSubmitQuestion) onSubmitQuestion(draftCode, selectedLang);
          if (addToast) addToast("Practice question submitted successfully!", "success");
        } else {
          if (addToast) addToast("Code logic check failed", "error");
        }
      } catch (err) {
        console.error("Practice submit failed", err);
        setIsSubmittingQuestion(false);
        setTerminalLogs(prev => prev + "\n[ERROR] Connection error to sandbox.");
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/save-coding-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: idFromPath,
          student_email: userEmail,
          question_id: question?.id,
          code_submitted: draftCode,
          language: selectedLang
        })
      });
      const data = await res.json();
      setIsSubmittingQuestion(false);

      if (data.terminalLogs) {
        setTerminalLogs(data.terminalLogs);
      }
      if (data.stats) {
        setExecutionStats(data.stats);
      }

      if (res.ok && data.success) {
        if (onSubmitQuestion) {
          onSubmitQuestion(draftCode, selectedLang);
        }
        if (addToast) addToast("Code submitted successfully", "success");
      } else {
        if (onSubmitQuestion) {
          onSubmitQuestion(draftCode, selectedLang);
        }
        if (addToast) addToast("Code logic check failed", "error");
      }
    } catch (err) {
      console.error("Submit question failed", err);
      setIsSubmittingQuestion(false);
      setTerminalLogs(prev => prev + "\n[ERROR] Connection error to sandbox.");
      if (addToast) addToast("Network error submitting code.", "error");
    }
  };

  
  useImperativeHandle(ref, () => ({
    runTests,
    submitQuestion,
    resetTemplate: () => {
      if (window.confirm("Are you sure you want to reset your code to the default template?")) {
        setDraftCode(getTemplate(selectedLang, question?.question_title));
      }
    }
  }));

  return (
    <div className="coding-wrapper">
      {}
      <div className="editor-header">
        <div className="lang-tabs">
          {["java", "python", "cpp", "javascript"].map((lang) => (
            <button
              key={lang}
              className={`lang-tab ${selectedLang === lang ? "active" : ""}`}
              onClick={() => setSelectedLang(lang)}
            >
              {lang === "javascript" ? "JavaScript" : lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>

        <div className="editor-header-options" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {}
          <button 
            className="nav-btn-run" 
            onClick={runTests}
            disabled={isRunningTests || isSubmittingQuestion}
            style={{ 
              height: "28px", 
              padding: "0 10px", 
              borderRadius: "6px", 
              fontSize: "12px", 
              fontWeight: "600", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--white)"
            }}
          >
            {isRunningTests ? (
              <i className="ri-loader-4-line ri-spin" style={{ color: "var(--green)" }}></i>
            ) : (
              <i className="ri-play-line" style={{ color: "var(--green)" }}></i>
            )}
            <span>Run Code</span>
          </button>

          {}
          <button 
            className="nav-btn-submit" 
            onClick={submitQuestion}
            disabled={isRunningTests || isSubmittingQuestion}
            style={{ 
              height: "28px", 
              padding: "0 10px", 
              borderRadius: "6px", 
              fontSize: "12px", 
              fontWeight: "600", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981"
            }}
          >
            {isSubmittingQuestion ? (
              <i className="ri-loader-4-line ri-spin" style={{ color: "#10b981" }}></i>
            ) : (
              <i className="ri-upload-cloud-line" style={{ color: "#10b981", fontSize: "14px" }}></i>
            )}
            <span>Submit</span>
          </button>

          <span style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }}></span>

          <button
            className="editor-opt-btn"
            title="Reset code template"
            onClick={() => {
              if (window.confirm("Reset code to default template?")) {
                setDraftCode(getTemplate(selectedLang, question?.question_title));
              }
            }}
          >
            <i className="ri-refresh-line"></i>
          </button>
          <button className="editor-opt-btn" title="Editor Settings">
            <i className="ri-settings-4-line"></i>
          </button>
          <button className="editor-opt-btn" title="Fullscreen Editor">
            <i className="ri-fullscreen-line"></i>
          </button>
        </div>
      </div>

      {}
      <div className="editor-container">
        <Editor
          height="100%"
          language={selectedLang}
          value={draftCode}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            fontFamily: "'Fira Code', monospace",
            lineHeight: 22,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6
            }
          }}
        />
      </div>


    </div>
  );
});

CodingPanel.displayName = "CodingPanel";

export default CodingPanel;