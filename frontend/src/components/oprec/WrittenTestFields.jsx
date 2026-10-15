import styles from "@/app/dashboard/oprec/oprec-workspace.module.css";

export function WrittenTestFields({ questions, answers, onAnswerChange, idPrefix = "test", preview = false }) {
  return questions.map((question, index) => {
    const id = `${idPrefix}-${question.id}`;
    const value = typeof answers[question.id] === "string" ? answers[question.id] : "";
    const label = `${index + 1}. ${question.label || (preview ? "Pertanyaan baru" : "")}`;
    const options = (question.options || []).map((option, optionIndex) => preview && !option.trim() ? `Opsi ${optionIndex + 1}` : option).filter((option) => option.trim());
    const setValue = (next) => onAnswerChange(question.id, next);
    let control;

    if (question.type === "paragraph") {
      control = <textarea id={id} required={question.required} maxLength={5000} rows={5} value={value} onChange={(event) => setValue(event.target.value)} />;
    } else if (question.type === "select") {
      control = <select id={id} required={question.required} value={value} onChange={(event) => setValue(event.target.value)}><option value="">Pilih jawaban</option>{options.map((option, optionIndex) => <option key={`${option}-${optionIndex}`} value={option}>{option}</option>)}</select>;
    } else if (question.type === "single_choice") {
      control = <div className={styles.testChoices} role="radiogroup" aria-labelledby={`${id}-label`}>{options.map((option, optionIndex) => <label key={`${option}-${optionIndex}`}><input type="radio" name={id} value={option} required={question.required} checked={value === option} onChange={() => setValue(option)} />{option}</label>)}</div>;
    } else if (question.type === "checkbox") {
      control = <label className={styles.testConsent}><input type="checkbox" checked={value === "on"} required={question.required} onChange={(event) => setValue(event.target.checked ? "on" : "")} />Saya menyetujui pernyataan ini.</label>;
    } else if (question.type === "file") {
      control = <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" required={question.required} onChange={(event) => setValue(event.target.files?.[0] || null)} />;
    } else {
      const type = ["email", "tel", "url", "number", "date"].includes(question.type) ? question.type : "text";
      control = <input id={id} type={type} required={question.required} maxLength={type === "text" ? 500 : 200} value={value} onChange={(event) => setValue(event.target.value)} />;
    }

    return <div className={`${styles.testField} ${["paragraph", "single_choice", "checkbox", "file"].includes(question.type) ? styles.testFieldWide : ""}`} key={`${question.id}-${question.type}`}>
      <label id={`${id}-label`} htmlFor={["single_choice", "checkbox"].includes(question.type) ? undefined : id}>{label} {question.required && <b aria-hidden="true">*</b>}</label>
      {control}
      {question.help && <small className={styles.testHelp}>{question.help}</small>}
      {question.type === "file" && <small className={styles.testHelp}>PDF, JPG, atau PNG · maksimal 5 MB.</small>}
    </div>;
  });
}
