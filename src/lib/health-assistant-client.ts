export interface AssistantSource { id: number; title: string; url: string }
export interface AssistantResult { sources: AssistantSource[]; evidenceStatus?: string }

const endpoint = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/health-assistant`;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/** Streams a health answer; calls onDelta for each text piece as it arrives. Throws with a readable message. */
export async function streamHealthAnswer(messages: { role: "user" | "assistant"; content: string }[], onDelta: (text: string) => void, signal?: AbortSignal): Promise<AssistantResult> {
  let res: Response;
  try {
    res = await fetch(endpoint, { method: "POST", signal, headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify({ messages }) });
  } catch {
    throw new Error("Could not reach the assistant. Check your connection and press Retry.");
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.error === "string" ? body.error : "The assistant is unavailable. Please press Retry.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AssistantResult | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf("\n\n")) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 2);
      if (!line.startsWith("data:")) continue;
      const event = JSON.parse(line.slice(5));
      if (event.type === "delta" && typeof event.text === "string") onDelta(event.text);
      else if (event.type === "done") result = { sources: Array.isArray(event.sources) ? event.sources : [], evidenceStatus: event.evidenceStatus };
      else if (event.type === "error") throw new Error(typeof event.error === "string" ? event.error : "The assistant could not finish this reply.");
    }
  }
  if (!result) throw new Error("The reply was cut off. Please press Retry.");
  return result;
}
