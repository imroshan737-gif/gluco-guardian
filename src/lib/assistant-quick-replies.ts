// Standalone courtesies and arithmetic only; never medication or symptom queries.
export function quickReply(text: string, turn = 0): string | null {
  const q = text.trim().toLowerCase().replace(/[!?.,~\s]+$/g, "").replace(/\s+/g, " ").trim();
  const choose = (options: string[]) => options[turn % options.length];
  if (/^(?:h+i+|he+y+|hel+o+|hl+o+|hiya|yo+|sup|wa+s+u+p+|namaste|hola|good (?:morning|afternoon|evening|day))(?: (?:there|buddy|friend|bot|guardian|glucoguardian))?$/.test(q)) return choose(["Hi! Nice to hear from you.", "Hello! How’s your day going?", "Hey there! Good to see you."]);
  if (/^(?:(?:h+i+|hel+o+|he+y+)[ ,]+)?how (?:are you|r u|are u|r you|is it going)(?: doing)?$/.test(q) || /^(?:nothing[, ]+)?(?:just (?:asking|checking) )?how (?:are you|r u|are u)$/.test(q)) return choose(["I’m here and ready to chat. Thanks for asking! How are you?", "Thanks for checking in! I’m ready to chat. How’s your day?", "Doing well as an AI—thanks for asking. How about you?"]);
  if (/^(?:ok+|okay|cool|nice|great|got it|alright)$/.test(q)) return choose(["Sounds good.", "Great.", "Alright!"]);
  if (/^(?:good ?night|gn)$/.test(q)) return "Good night. Rest well!";
  if (/^(thanks|thank you|thank you so much|thanks a lot|thx|ty|bye+|goodbye|see you|see ya)$/.test(q)) return /bye/.test(q) ? "Take care. See you next time!" : choose(["You’re welcome!", "Glad I could help.", "Of course!"]);
  const match = q.match(/^(?:(?:what is|what's|calculate)\s+)?(-?\d{1,9}(?:\.\d{1,6})?)\s*([+\-*/×÷])\s*(-?\d{1,9}(?:\.\d{1,6})?)\s*=?$/);
  if (!match) return null;
  const left = Number(match[1]), right = Number(match[3]), operator = match[2];
  if ((operator === "/" || operator === "÷") && right === 0) return "Division by zero is undefined.";
  const value = operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" || operator === "×" ? left * right : left / right;
  return Number.isFinite(value) ? `${match[1]} ${operator} ${match[3]} = ${Number(value.toPrecision(12))}` : null;
}