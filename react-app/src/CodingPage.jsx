import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

function CodingPage() {
  const { id } = useParams();

  const [language, setLanguage] = useState("java");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);

  
useEffect(() => {
  fetch(`http://localhost:3000/assessment-full/${id}`)
    .then(res => res.json())
    .then(data => {

      console.log("API DATA:", data);

      
      let rawQuestions = [];

      if (typeof data.questions === "string") {
        try {
          rawQuestions = JSON.parse(data.questions);
        } catch (e) {
          console.error("JSON parse error:", e);
          rawQuestions = [];
        }
      } else if (Array.isArray(data.questions)) {
        rawQuestions = data.questions;
      } else if (typeof data.questions === "object" && data.questions !== null) {
        rawQuestions = Object.values(data.questions);
      }

      console.log("RAW QUESTIONS:", rawQuestions);
      console.log("TYPE:", typeof data.questions);
      const formattedQuestions = rawQuestions.map(q => ({
        id: q.id,
        title: q.question_title || "Question",
        problem: q.question_text,
        section: q.section_name,
        type: q.question_type,
        options: q.question_type === "mcq"
          ? [q.option_a, q.option_b, q.option_c, q.option_d]
          : null
      }));

      console.log("FORMATTED:", formattedQuestions);
      setAssessment(data.assessment || {});
      setQuestions(formattedQuestions);

    })
    .catch(err => console.error(err));

}, [id]);

  
  if (!assessment || questions.length === 0) {
    return <h2 style={{ color: "white" }}>Loading...</h2>;
  }

  const current = questions[activeQuestion];

  const codeTemplates = {
    java: `public class Solution {
  public static void main(String[] args){
  //write your code here
  }
}`,
    python: `def solution():
    # write your code
    return None
print(solution())`
  };

  return (
    <div className="container">

      {}
      <div className="header">
        <h2>{assessment.title || "Assessment Page"}</h2>
        <div className="timer-center">00:30:00</div>
        <div className="top-actions">
          <button className="btn submit">Submit</button>
        </div>
      </div>

      <div className="main">

        {}
        <div className="qnav">
          <p className="section-label">
            {current.section || "Section"}
          </p>

          {questions.map((q, index) => (
            <div
              key={index}
              className={`q-item ${activeQuestion === index ? "active" : ""}`}
              onClick={() => {
                setActiveQuestion(index);
                setSelectedOption(null);
              }}
            >
              <strong>{q.id}. {q.title}</strong>
            </div>
          ))}
        </div>

        {}
        {current.section !== "Coding" ? (
          <div className="fullpage">

            <h2>{current.title}</h2>
            <p className="question-text">{current.problem}</p>

            <div className="options">
              {current.options ? current.options.map((opt, i) => (
                <div
                  key={i}
                  className={`option ${selectedOption === opt ? "selected" : ""}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </div>
              )) : <p>No options available</p>}
            </div>

          </div>
        ) : (

          
          <>
            <div className="left">
              <div className="tabs-container">
                <input type="radio" name="tab" id="tab1" defaultChecked />
                <input type="radio" name="tab" id="tab2" />
                <input type="radio" name="tab" id="tab3" />
                <input type="radio" name="tab" id="tab4" />

                <div className="tabs">
                  <label htmlFor="tab1">Problem</label>
                  <label htmlFor="tab2">Test Cases</label>
                  <label htmlFor="tab3">Result</label>
                  <label htmlFor="tab4">Submissions</label>
                </div>

                <div className="content">

                  <div className="content1">
                    <h3>{current.title}</h3>
                    <p>{current.problem}</p>
                  </div>

                  <div className="content2">
                    <pre>{current.testcase || "No testcases"}</pre>
                  </div>

                  <div className="content3">
                    <p>{current.result || "Waiting for execution..."}</p>
                  </div>

                  <div className="content4">
                    <p>No submissions yet</p>
                  </div>

                </div>
              </div>
            </div>

            <div className="right">
              <div className="editor-header">
                <select
                  className="dropdown"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                </select>

                <div className="editor-actions">
                  <button className="btn run">Run Tests</button>
                  <button className="btn submit">Submit</button>
                </div>
              </div>

              <Editor
                height="100%"
                language={language}
                value={codeTemplates[language]}
                theme="vs-dark"
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default CodingPage;