import styles from "@/app/dashboard/oprec/oprec-workspace.module.css";

export function WrittenTestQuestions({ questions, answers, onAnswerChange, idPrefix = "test", preview = false }) {
  return questions.map((question, index) => {
    const inputId = `${idPrefix}-${question.id}`;
    return (
      <div className={styles.testField} key={question.id}>
        <label id={`${inputId}-label`} htmlFor={question.type === "single_choice" ? undefined : inputId}>
          {index + 1}. {question.label || (preview ? "Pertanyaan baru" : "")} {question.required && <b aria-hidden="true">*</b>}
        </label>
        {question.type === "paragraph" ? (
          <textarea
            id={inputId}
            required={question.required}
            maxLength={5000}
            rows={5}
            value={answers[question.id] || ""}
            onChange={(event) => onAnswerChange(question.id, event.target.value)}
          />
        ) : question.type === "single_choice" ? (
          <div className={styles.testChoices} role="radiogroup" aria-labelledby={`${inputId}-label`}>
            {(question.options || []).map((option, optionIndex) => preview && !option.trim() ? "Opsi " + (optionIndex + 1) : option).filter((option) => option.trim()).map((option, optionIndex) => (
              <label key={option + optionIndex}>
                <input
                  type="radio"
                  name={inputId}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => onAnswerChange(question.id, option)}
                />
                {option}
              </label>
            ))}
          </div>
        ) : (
          <input
            id={inputId}
            required={question.required}
            maxLength={500}
            value={answers[question.id] || ""}
            onChange={(event) => onAnswerChange(question.id, event.target.value)}
          />
        )}
      </div>
    );
  });
}
