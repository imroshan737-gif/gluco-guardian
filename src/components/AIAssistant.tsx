import { useState, useRef, useEffect } from "react";
import { Dna, X, Send, Loader2, RotateCcw, Trash2, ShieldCheck } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message as ChatMessage, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { quickReply } from "@/lib/assistant-quick-replies";
import { Button } from "@/components/ui/button";
import { streamHealthAnswer, type AssistantSource } from "@/lib/health-assistant-client";

type Source = AssistantSource;
interface Message { role: "user" | "assistant"; parts: { type: "text"; text: string }[]; sources?: Source[]; evidenceStatus?: string }
function thinkingSteps(q: string): string[] {
  const t = q.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words <= 6) return ["Thinking…"];
  const topic = /insulin|glucose|sugar|diabet|hypo/.test(t) ? ["Checking glucose and insulin references…"] : /heart|blood pressure|cardio|artery/.test(t) ? ["Looking into heart health sources…"] : /medicine|drug|dose|tablet|side effect/.test(t) ? ["Checking medicine safety information…"] : /pain|symptom|fever|dizzy|sweat/.test(t) ? ["Reviewing the symptoms you described…"] : ["Searching trusted health references…"];
  const steps = ["Thinking…", "Understanding your question…", ...topic, "Weighing the evidence…"];
  if (words > 15 || /why|how|difference|compare|explain/.test(t)) steps.push("Connecting the details…", "Putting the answer together…");
  steps.push("Almost done…");
  return steps;
}
function useThinkingStatus(active: boolean, question: string) {
  const [index, setIndex] = useState(0);
  const steps = thinkingSteps(question);
  useEffect(() => {
    setIndex(0);
    if (!active) return;
    const id = setInterval(() => setIndex(i => Math.min(i + 1, steps.length - 1)), 1600);
    return () => clearInterval(id);
  }, [active, question, steps.length]);
  return steps[Math.min(index, steps.length - 1)];
}
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => { if (open && !loading) panelRef.current?.querySelector("textarea")?.focus(); }, [open, loading, messages]);
  useEffect(() => { if (open) panelRef.current?.querySelector("textarea")?.focus(); }, [open]);
  const [streaming, setStreaming] = useState(false);
  const lastQuestion = [...messages].reverse().find(m => m.role === "user")?.parts[0]?.text ?? "";
  const status = useThinkingStatus(loading && !streaming, lastQuestion);
  const request = async (history: Message[]) => {
    setLoading(true); setStreaming(false); setError(""); setMessages(history);
    let started = false;
    try {
      const result = await streamHealthAnswer(history.map(({ role, parts }) => ({ role, content: parts.map(part => part.text).join("\n") })), delta => {
        if (!started) { started = true; setStreaming(true); setMessages([...history, { role: "assistant", parts: [{ type: "text", text: delta }] }]); return; }
        setMessages(previous => { const last = previous[previous.length - 1]; return [...previous.slice(0, -1), { ...last, parts: [{ type: "text", text: last.parts[0].text + delta }] }]; });
      });
      if (!started) throw new Error("No answer was received. Please press Retry.");
      setMessages(previous => { const last = previous[previous.length - 1]; return [...previous.slice(0, -1), { ...last, sources: result.sources, evidenceStatus: result.evidenceStatus }]; });
    } catch (failure) { setMessages(history); setError(failure instanceof Error ? failure.message : "The assistant is unavailable."); }
    finally { setLoading(false); setStreaming(false); }
  };
  const send = (text = input) => {
    if (!text.trim() || loading) return;
    const history: Message[] = [...messages, { role: "user", parts: [{ type: "text", text: text.trim() }] }];
    setInput(""); setError("");
    const instant = quickReply(text, messages.filter(m => m.role === "assistant").length);
    if (instant) {
      setMessages([...history, { role: "assistant", parts: [{ type: "text", text: instant }] }]);
      panelRef.current?.querySelector("textarea")?.focus(); return;
    }
    setMessages(history); void request(history);
  };
  return <>
    {!open && <Button size="icon" className="fixed right-5 bottom-5 z-50 h-12 w-12 rounded-lg shadow-lg" aria-label="AI Medical Assistant" title="AI Medical Assistant" onClick={() => setOpen(true)}><Dna className="h-6 w-6" /></Button>}
    {open && <section ref={panelRef} aria-label="Medical assistant conversation" className="fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-50 flex flex-col w-[calc(100vw-1.5rem)] sm:w-[420px] h-[min(620px,calc(100svh-1.5rem))] health-chat rounded-lg">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border health-chat-header rounded-t-lg">
        <div className="flex items-center gap-2"><Dna className="h-6 w-6" /><div><h3 className="font-heading text-sm">GlucoGuardian AI</h3><p className="text-xs opacity-90">Health & biology</p></div></div>
        <div className="flex"><Button variant="ghost" size="icon" disabled={loading} aria-label="Clear conversation" title="Clear conversation" onClick={() => { setMessages([]); setError(""); }}><Trash2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Close assistant" title="Close assistant" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></div>
      </header>
      <p className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border bg-surface-green flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-accent shrink-0" />Educational AI, not a diagnosis. Replies can be wrong. Avoid sharing identifying details.</p>
      <Conversation className="min-h-0" aria-live="polite"><ConversationContent className="gap-5">
        {!messages.length && <div className="py-6"><Dna className="text-primary mx-auto h-10 w-10 mb-4" /><p className="font-heading text-sm text-center mb-4">What would you like to ask?</p>{["Why can glucose rise while fasting?", "How does insulin work?", "What is the difference between arteries and veins?"].map(q => <Button key={q} variant="outline" className="w-full h-auto whitespace-normal text-left justify-start text-xs mb-2 py-3" onClick={() => setInput(q)}>{q}</Button>)}</div>}
        {messages.map((message, i) => <ChatMessage key={i} from={message.role}>
          <MessageContent className={message.role === "user" ? "health-chat-user" : "w-full leading-relaxed"}>
            {message.parts.map((part, index) => <MessageResponse key={index} components={{ a: ({ children }) => <span>{children}</span> }}>{part.text}</MessageResponse>)}
          {!!message.sources?.length && <div className="border-t border-border mt-3 pt-2"><p className="text-xs font-semibold mb-1">Sources: MedlinePlus / National Library of Medicine</p>{message.sources.filter(s => { try { const u = new URL(s.url); return u.protocol === "https:" && u.hostname === "medlineplus.gov"; } catch { return false; } }).map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block text-xs text-primary underline mt-1">[{source.id}] {source.title}</a>)}<p className="text-[10px] text-muted-foreground mt-2">Informational summary; not endorsed by NLM.</p></div>}
          {message.evidenceStatus === "unavailable" && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">No supporting live reference was retrieved for this reply.</p>}
        </MessageContent></ChatMessage>)}
        {loading && !streaming && <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span>{status}</span></div>}
        {error && <div role="alert" className="text-sm text-destructive"><p>{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => void request(messages)}><RotateCcw className="h-4 w-4 mr-2" />Retry</Button></div>}
      </ConversationContent><ConversationScrollButton aria-label="Latest messages" title="Latest messages" /></Conversation>
      <div className="px-3 py-2 border-t border-border bg-secondary rounded-b-lg">
        <PromptInput onSubmit={({ text }) => send(text)} className="[&_[data-slot=input-group]]:flex-row [&_[data-slot=input-group]]:flex-nowrap [&_[data-slot=input-group]]:items-center [&_[data-slot=input-group]]:bg-background [&_[data-slot=input-group]]:border-primary">
          <PromptInputTextarea aria-label="Health question" value={input} maxLength={2000} onChange={e => setInput(e.target.value)} placeholder="Ask a question…" className="min-h-0 h-10 max-h-20 py-2.5 flex-1 text-sm" />
          <PromptInputFooter className="w-auto shrink-0 justify-end p-1 pr-2">
            <PromptInputSubmit status={loading ? "submitted" : "ready"} aria-label="Send question" title="Send question" disabled={loading || !input.trim()} className="h-7 w-7 shrink-0"><Send className="h-4 w-4" /></PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>}
  </>;
}
