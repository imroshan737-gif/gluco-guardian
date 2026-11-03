// Standalone courtesies and arithmetic only; never medication or symptom queries.
export function quickReply(text: string, turn = 0): string | null {
  const q = text.trim().toLowerCase().replace(/[!?.,]+$/g, "").trim();
  const choose = (options: string[]) => options[turn % options.length];
  if (/^(hi|hello|hey|hiya|good morning|good afternoon|good evening)$/.test(q)) return choose(["Hi! Nice to hear from you.", "Hello! How’s your day going?", "Hey there! Good to see you."]);
  if (/^(?:(?:hi|hello|hey)[ ,]+)?how (?:are you|r u|are u)(?: doing)?$/.test(q) || /^(?:nothing[, ]+)?(?:just (?:asking|checking) )?how (?:are you|r u|are u)$/.test(q)) return choose(["I’m here and ready to chat. Thanks for asking! How are you?", "Thanks for checking in! I’m ready to chat. How’s your day?", "Doing well as an AI—thanks for asking. How about you?"]);
  if (/^(thanks|thank you|thank you so much|thx|bye|goodbye)$/.test(q)) return /bye/.test(q) ? "Take care. See you next time!" : choose(["You’re welcome!", "Glad I could help.", "Of course!"]);
  const match = q.match(/^(?:(?:what is|what's|calculate)\s+)?(-?\d{1,9}(?:\.\d{1,6})?)\s*([+\-*/×÷])\s*(-?\d{1,9}(?:\.\d{1,6})?)\s*=?$/);
  if (!match) return null;
  const left = Number(match[1]), right = Number(match[3]), operator = match[2];
  if ((operator === "/" || operator === "÷") && right === 0) return "Division by zero is undefined.";
  const value = operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" || operator === "×" ? left * right : left / right;
  return Number.isFinite(value) ? `${match[1]} ${operator} ${match[3]} = ${Number(value.toPrecision(12))}` : null;
}