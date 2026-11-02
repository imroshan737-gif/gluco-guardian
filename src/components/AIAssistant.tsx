import { useState, useRef, useEffect } from "react";
import { Dna, X, Send, Loader2, RotateCcw, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Source { id: number; title: string; url: string }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; evidenceStatus?: string }
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, loading]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  const request = async (history: Message[]) => {
    setLoading(true); setError("");
    try {
      const { data, error: failure } = await supabase.functions.invoke("health-assistant", { body: { messages: history.slice(-16).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })) } });
      if (failure) {
        let detail = "The assistant is unavailable. Please try again later.";
        if ("context" in failure && failure.context instanceof Response) {
          const body = await failure.context.json().catch(() => null);
          if (typeof body?.error === "string") detail = body.error;
        }
        throw new Error(detail);
      }
      if (typeof data?.answer !== "string") throw new Error("No answer was received. Please try again.");
      setMessages(previous => [...previous, { role: "assistant", content: data.answer, sources: data.sources, evidenceStatus: data.evidenceStatus }]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The assistant is unavailable."); }
    finally { setLoading(false); }
  };
  const send = () => {
    if (!input.trim() || loading) return;
    const history = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(history); setInput(""); void request(history);
  };
  return <>
    {!open && <Button size="icon" className="fixed right-5 bottom-5 z-50 h-12 w-12 rounded-lg shadow-lg" aria-label="AI Medical Assistant" title="AI Medical Assistant" onClick={() => setOpen(true)}><Dna className="h-6 w-6" /></Button>}
    {open && <section aria-label="Medical assistant conversation" className="fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-50 flex flex-col w-[calc(100vw-1.5rem)] sm:w-[420px] h-[min(620px,calc(100svh-1.5rem))] bg-card border border-border rounded-lg shadow-xl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
        <div className="flex items-center gap-2"><Dna className="text-primary h-6 w-6" /><div><h3 className="font-heading text-sm">GlucoGuardian AI</h3><p className="text-xs text-muted-foreground">Health & biology</p></div></div>
        <div className="flex"><Button variant="ghost" size="icon" disabled={loading} aria-label="Clear conversation" title="Clear conversation" onClick={() => { setMessages([]); setError(""); }}><Trash2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Close assistant" title="Close assistant" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></div>
      </header>
      <p className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border">Educational AI, not a diagnosis. Replies can be wrong. Avoid sharing identifying details.</p>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4" aria-live="polite">
        {!messages.length && <div className="py-6"><Dna className="text-primary mx-auto h-10 w-10 mb-4" /><p className="font-heading text-sm text-center mb-4">What would you like to ask?</p>{["Why can glucose rise while fasting?", "How does insulin work?", "What is the difference between arteries and veins?"].map(q => <Button key={q} variant="outline" className="w-full h-auto whitespace-normal text-left justify-start text-xs mb-2 py-3" onClick={() => setInput(q)}>{q}</Button>)}</div>}
        {messages.map((message, i) => <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[95%] rounded-md px-3 py-3 text-sm leading-relaxed border ${message.role === "user" ? "bg-primary/10 border-primary/20" : "bg-secondary border-border"}`}>
          <ReactMarkdown components={{ p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>, ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>, ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>, a: ({ children }) => <span>{children}</span> }}>{message.content}</ReactMarkdown>
          {!!message.sources?.length && <div className="border-t border-border mt-3 pt-2"><p className="text-xs font-semibold mb-1">Sources: MedlinePlus / National Library of Medicine</p>{message.sources.filter(s => { try { const u = new URL(s.url); return u.protocol === "https:" && u.hostname === "medlineplus.gov"; } catch { return false; } }).map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block text-xs text-primary underline mt-1">[{source.id}] {source.title}</a>)}<p className="text-[10px] text-muted-foreground mt-2">Informational summary; not endorsed by NLM.</p></div>}
          {message.evidenceStatus && !["retrieved", "out_of_scope"].includes(message.evidenceStatus) && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">No supporting live reference was retrieved for this reply.</p>}
        </div></div>)}
        {loading && <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Reviewing your question…</div>}
        {error && <div role="alert" className="text-sm text-destructive"><p>{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => void request(messages)}><RotateCcw className="h-4 w-4 mr-2" />Retry</Button></div>}
        <div ref={endRef} />
      </div>
      <form className="flex gap-2 px-4 py-3 border-t border-border" onSubmit={e => { e.preventDefault(); send(); }}>
        <input ref={inputRef} aria-label="Health question" value={input} maxLength={2000} onChange={e => setInput(e.target.value)} placeholder="Ask a health or biology question…" className="min-w-0 flex-1 bg-muted border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" disabled={loading} />
        <Button type="submit" size="icon" aria-label="Send question" title="Send question" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </section>}
  </>;
}
