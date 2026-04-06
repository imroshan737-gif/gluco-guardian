import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";

// DNA Helix Icon
function DNAIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M2 9c6.667 6 13.333 0 20 6" />
      <path d="M6.5 12.5l1 1" />
      <path d="M16.5 10.5l1 1" />
      <path d="M11.5 11l1 1" />
    </svg>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MEDICAL_SYSTEM_PROMPT = `You are GlucoGuardian AI, a highly knowledgeable medical and biological sciences assistant specialized in:
- Diabetes (Type 1, Type 2, gestational, pre-diabetes)
- Blood glucose management and hypoglycemia/hyperglycemia
- Blood pressure, heart health, cardiovascular diseases
- Human biology, anatomy, and physiology
- Nutrition, metabolism, and diet for health conditions
- Medications, insulin therapy, and drug interactions
- Exercise physiology and its effects on blood sugar
- Mental health impacts on physical health
- General medical conditions, symptoms, and treatments

RULES:
- Answer ALL medical/biological questions with clear scientific reasoning
- Use simple language but include scientific explanations
- Always mention "consult your doctor" for specific medical advice
- Be empathetic, supportive, and thorough
- Use bullet points and structure for readability
- If a question is NOT related to medical/biological topics, politely redirect to medical topics
- Keep responses concise but comprehensive`;

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Use a simple client-side response since no backend is set up
      const response = await generateResponse(userMsg.content, newMessages);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating DNA Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-5 bottom-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 group"
          style={{
            background: "linear-gradient(135deg, rgba(0,245,212,0.2), rgba(169,127,240,0.2))",
            border: "1.5px solid rgba(0,245,212,0.5)",
            boxShadow: "0 0 30px rgba(0,245,212,0.3), 0 0 60px rgba(0,245,212,0.1)",
          }}
          title="AI Medical Assistant"
        >
          <DNAIcon size={26} className="text-primary group-hover:animate-spin" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed left-5 bottom-5 z-50 flex flex-col"
          style={{
            width: "380px",
            height: "520px",
            background: "rgba(10, 14, 26, 0.95)",
            border: "1px solid rgba(0,245,212,0.25)",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,245,212,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,245,212,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,245,212,0.15)", border: "1px solid rgba(0,245,212,0.3)" }}>
                <DNAIcon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xs font-bold text-foreground">GlucoGuardian AI</h3>
                <p className="text-[10px] text-primary font-body">Medical Assistant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-foreground/40 hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <DNAIcon size={40} className="text-primary/30 mx-auto mb-3" />
                <p className="text-foreground/40 text-xs font-body mb-2">Ask me anything about health!</p>
                <div className="space-y-1.5">
                  {["What causes low blood sugar?", "How does insulin work?", "Tips for managing Type 2 diabetes"].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="block w-full text-left text-[11px] font-body px-3 py-2 rounded-lg transition-colors text-foreground/50 hover:text-primary hover:bg-primary/5"
                      style={{ border: "1px solid rgba(0,245,212,0.1)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs font-body leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "rgba(0,245,212,0.15)", border: "1px solid rgba(0,245,212,0.2)", color: "hsl(180,100%,95%)" }
                      : { background: "rgba(169,127,240,0.1)", border: "1px solid rgba(169,127,240,0.15)", color: "hsl(180,100%,90%)" }
                  }
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(169,127,240,0.1)", border: "1px solid rgba(169,127,240,0.15)" }}>
                  <Loader2 size={16} className="text-primary animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,245,212,0.15)" }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about health, glucose, BP..."
                className="flex-1 bg-muted/30 border border-primary/20 rounded-xl px-3 py-2.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50 placeholder:text-foreground/30"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "rgba(0,245,212,0.2)", border: "1px solid rgba(0,245,212,0.3)" }}
              >
                <Send size={14} className="text-primary" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Client-side medical knowledge response generator
async function generateResponse(question: string, _history: Message[]): Promise<string> {
  const q = question.toLowerCase();
  
  // Simulate slight delay for realism
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

  if (q.includes("blood sugar") || q.includes("glucose") || q.includes("low blood sugar") || q.includes("hypogly")) {
    return `**Low Blood Sugar (Hypoglycemia)**

Blood glucose below 70 mg/dL is considered hypoglycemia. Here's what happens:

• **Cause**: Too much insulin, skipped meals, excessive exercise, or alcohol consumption
• **Symptoms**: Shakiness, sweating, confusion, rapid heartbeat, dizziness
• **Immediate Action**: Follow the "15-15 Rule" — eat 15g of fast-acting carbs (glucose tablets, juice), wait 15 minutes, recheck

**Scientific Reason**: Your brain depends on glucose as its primary fuel. When levels drop, your body releases counter-regulatory hormones (glucagon, epinephrine) causing those symptoms as an alarm system.

⚕️ Always consult your healthcare provider for personalized guidance.`;
  }

  if (q.includes("insulin") && (q.includes("work") || q.includes("how"))) {
    return `**How Insulin Works**

Insulin is a peptide hormone produced by beta cells in the pancreas (Islets of Langerhans).

• **Function**: Acts as a "key" that unlocks cells to absorb glucose from the bloodstream
• **Process**: After eating → blood sugar rises → pancreas releases insulin → cells absorb glucose → blood sugar normalizes
• **Type 1**: Immune system destroys beta cells → no insulin production
• **Type 2**: Cells become resistant to insulin → glucose can't enter efficiently

**Key Facts**:
- Insulin has a half-life of ~5-6 minutes in blood
- Rapid-acting insulin peaks in 1-2 hours
- Long-acting insulin provides baseline coverage for 24 hours

⚕️ Insulin dosing should always be managed with your endocrinologist.`;
  }

  if (q.includes("type 2") || q.includes("type 1") || q.includes("diabetes")) {
    return `**Understanding Diabetes**

Diabetes is a metabolic disorder affecting how your body processes glucose:

**Type 1 Diabetes**:
• Autoimmune condition — immune system attacks insulin-producing beta cells
• Usually diagnosed in childhood/young adulthood
• Requires lifelong insulin therapy
• ~5-10% of all diabetes cases

**Type 2 Diabetes**:
• Body becomes resistant to insulin or doesn't produce enough
• Strongly linked to lifestyle factors (obesity, inactivity, diet)
• Can often be managed with diet, exercise, and oral medications
• ~90-95% of all diabetes cases

**Management Tips**:
• Monitor blood glucose regularly
• Maintain a balanced diet (low glycemic index foods)
• Exercise 150+ minutes/week
• Take medications as prescribed
• Manage stress levels

⚕️ Regular check-ups with your healthcare team are essential.`;
  }

  if (q.includes("blood pressure") || q.includes("bp") || q.includes("hypertension")) {
    return `**Blood Pressure Explained**

Blood pressure measures the force of blood against artery walls, expressed as systolic/diastolic (e.g., 120/80 mmHg).

**Categories**:
• Normal: <120/80 mmHg
• Elevated: 120-129/<80 mmHg
• Stage 1 Hypertension: 130-139/80-89 mmHg
• Stage 2 Hypertension: ≥140/≥90 mmHg

**Why It Matters for Diabetics**:
• Diabetes + high BP doubles cardiovascular risk
• High BP damages blood vessels already stressed by high glucose
• Target for diabetics is typically <130/80 mmHg

**Natural Management**:
• Reduce sodium intake (<2,300 mg/day)
• DASH diet (fruits, vegetables, whole grains)
• Regular aerobic exercise
• Maintain healthy weight
• Limit alcohol and quit smoking

⚕️ Consult your doctor for blood pressure medication decisions.`;
  }

  if (q.includes("heart") || q.includes("cardiovascular") || q.includes("cardiac")) {
    return `**Heart Health & Diabetes**

People with diabetes are 2-4x more likely to develop cardiovascular disease.

**Why**: High blood sugar damages blood vessels and nerves that control the heart over time. This leads to:
• Atherosclerosis (plaque buildup in arteries)
• Coronary artery disease
• Increased risk of heart attack and stroke

**Key Markers to Monitor**:
• HbA1c (target: <7% for most)
• LDL cholesterol (<100 mg/dL)
• Blood pressure (<130/80 mmHg)
• Triglycerides (<150 mg/dL)

**Heart-Protective Steps**:
• Control blood glucose levels
• Exercise regularly (strengthens the heart muscle)
• Eat heart-healthy fats (omega-3, olive oil)
• Avoid trans fats and excessive saturated fats
• Don't smoke

⚕️ Get regular cardiac screenings as recommended by your doctor.`;
  }

  if (q.includes("food") || q.includes("diet") || q.includes("eat") || q.includes("nutrition") || q.includes("meal")) {
    return `**Nutrition for Blood Sugar Control**

What you eat directly impacts your glucose levels:

**Best Foods**:
• Non-starchy vegetables (broccoli, spinach, peppers)
• Lean proteins (chicken, fish, tofu, lentils)
• Whole grains (oats, quinoa, brown rice)
• Healthy fats (avocado, nuts, olive oil)
• Low-glycemic fruits (berries, apples, pears)

**Foods to Limit**:
• Refined carbs (white bread, white rice)
• Sugary beverages and juices
• Processed snacks and fried foods
• High-sugar desserts

**Meal Timing Tips**:
• Eat at consistent times daily
• Don't skip meals (especially if on insulin)
• Balance carbs with protein and fat
• The "plate method": ½ vegetables, ¼ protein, ¼ whole grains

⚕️ Consider working with a registered dietitian for personalized meal planning.`;
  }

  if (q.includes("exercise") || q.includes("workout") || q.includes("physical")) {
    return `**Exercise & Blood Sugar**

Physical activity is one of the most powerful tools for glucose management:

**How Exercise Helps**:
• Muscles absorb glucose without needing insulin during exercise
• Improves insulin sensitivity for 24-72 hours after
• Lowers HbA1c by 0.5-0.7% on average
• Reduces cardiovascular risk

**Recommended**:
• 150 minutes/week of moderate aerobic activity
• 2-3 sessions of resistance training
• Flexibility exercises (yoga, stretching)

**Safety Tips**:
• Check glucose before exercise
• If <100 mg/dL → eat 15g carbs first
• Carry fast-acting glucose during workouts
• Stay hydrated
• Avoid exercise if glucose >250 mg/dL with ketones

⚕️ Always discuss new exercise programs with your healthcare provider.`;
  }

  if (q.includes("stress") || q.includes("anxiety") || q.includes("mental")) {
    return `**Stress & Blood Sugar Connection**

Stress directly impacts glucose levels through hormonal pathways:

**The Science**:
• Stress triggers cortisol and adrenaline release
• These hormones signal the liver to release stored glucose
• Result: Blood sugar rises even without eating
• Chronic stress keeps levels persistently elevated

**Impact on Diabetes**:
• Makes blood sugar harder to predict
• Can lead to emotional eating
• Disrupts sleep (which further impacts glucose)
• Reduces motivation for self-care

**Stress Management**:
• Deep breathing exercises (4-7-8 technique)
• Regular physical activity
• Adequate sleep (7-9 hours)
• Mindfulness meditation
• Social support and community
• Professional counseling when needed

⚕️ Mental health is as important as physical health in diabetes management.`;
  }

  // Default response for other medical questions
  return `That's a great question! Here's what I can share:

Based on medical science, your question touches on important health concepts. While I have extensive knowledge of medical and biological topics, I want to make sure I give you the most accurate information.

**Key Points**:
• The human body is an interconnected system — changes in one area affect others
• Evidence-based approaches are always recommended
• Individual responses vary based on genetics, lifestyle, and existing conditions

**What I Can Help With**:
• Diabetes management (Type 1, Type 2, pre-diabetes)
• Blood glucose monitoring and optimization
• Blood pressure and cardiovascular health
• Nutrition and diet planning
• Exercise and physical activity guidance
• Medication understanding
• Stress and mental health impacts

Feel free to ask me anything specific about these topics!

⚕️ For personalized medical advice, always consult your healthcare provider.`;
}
