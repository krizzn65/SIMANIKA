// The page's single text effect: words rise in one after another. Words stay
// plain text in the HTML; CSS only animates them when motion is allowed.
export function RevealWords({ text, startIndex = 0 }) {
  return text.split(/(\s+)/).map((part, index) =>
    part.trim()
      ? <span key={index} className="reveal-word" style={{ "--reveal-i": startIndex + index / 2 }}>{part}</span>
      : part,
  );
}

export const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
