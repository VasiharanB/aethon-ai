function MCQView({ question, answers, setAnswers, addToast }) {
  if (!question) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        Loading options...
      </div>
    );
  }

  const selectedOption = answers && question ? answers[question.id] || "" : "";

  const handleOptionClick = (opt) => {
    if (setAnswers && question) {
      setAnswers(prev => ({ ...prev, [question.id]: opt }));
      if (addToast) {
        addToast("Option selected", "success");
      }
    }
  };

  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d
  ].filter(Boolean);

  return (
    <div className="mcq-options-list">
      {options.map((opt, i) => {
        const isSelected = selectedOption === opt;
        return (
          <div
            key={i}
            className={`mcq-option-card ${isSelected ? "selected" : ""}`}
            onClick={() => handleOptionClick(opt)}
          >
            <div className="mcq-option-radio">
              <div className="mcq-option-radio-dot"></div>
            </div>
            <div className="mcq-option-text">{opt}</div>
          </div>
        );
      })}
    </div>
  );
}

export default MCQView;