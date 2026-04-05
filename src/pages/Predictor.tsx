import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import RiskGauge from "@/components/RiskGauge";
import GlassTiltCard from "@/components/GlassTiltCard";
import {
  getSession, calculateRiskScore, getRiskLevel, getRiskLabel,
  generateInsights, saveLog, type LogEntry
} from "@/lib/glucosense";

export default function Predictor() {
  const navigate = useNavigate();
  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const [form, setForm] = useState({
    lastMealTime: new Date(Date.now() - 2 * 3600000).toISOString().slice(0, 16),
    mealType: 'mixed',
    insulinDose: '5',
    insulinTime: new Date(Date.now() - 1 * 3600000).toISOString().slice(0, 16),
    sleepHours: 7,
    activityLevel: 'none',
    stressLevel: 5,
    glucoseReading: '',
  });

  const [result, setResult] = useState<null | { riskScore: number; riskLevel: string; confidence: number; timeToHypo: string; breakdown: { label: string; pct: number; color: string }[]; insights: any[]; summary: string }>(null);
  const [loading, setLoading] = useState(false);

  const filledCount = [form.lastMealTime, form.mealType, form.insulinDose, form.insulinTime, form.sleepHours, form.activityLevel, form.stressLevel, form.glucoseReading].filter(v => v !== '' && v !== undefined).length;

  const predict = () => {
    setLoading(true);
    setTimeout(() => {
      const session = getSession();
      const riskScore = calculateRiskScore({
        insulinDose: parseFloat(form.insulinDose) || 0,
        insulinTime: form.insulinTime,
        lastMealTime: form.lastMealTime,
        mealType: form.mealType,
        sleepHours: form.sleepHours,
        stressLevel: form.stressLevel,
        activityLevel: form.activityLevel,
        glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
        sensitivity: session?.aiSensitivity || 'balanced',
      });

      const riskLevel = getRiskLevel(riskScore);
      const confidence = Math.round((filledCount / 8) * 100);

      // Estimate time to hypo
      let timeToHypo = 'N/A';
      if (riskScore > 55) {
        const insulinHrs = (Date.now() - new Date(form.insulinTime).getTime()) / (1000 * 60 * 60);
        const remainingActive = Math.max(0, 4 - insulinHrs);
        const estimatedMins = Math.round(remainingActive * 60 * (1 - riskScore / 150));
        timeToHypo = estimatedMins > 0 ? `~${estimatedMins} minutes` : 'Imminent risk';
      }

      // Breakdown
      const breakdown = [
        { label: 'Insulin recency & dose', pct: 35, color: '#E63946' },
        { label: 'Meal type & timing', pct: 25, color: '#FFB703' },
        { label: 'Sleep hours', pct: 20, color: '#00F5D4' },
        { label: 'Stress level', pct: 10, color: '#ff8c00' },
        { label: 'Activity level', pct: 10, color: '#06D6A0' },
      ];

      const insights = generateInsights({
        glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
        lastMealTime: form.lastMealTime,
        mealType: form.mealType,
        insulinDose: parseFloat(form.insulinDose) || 0,
        insulinTime: form.insulinTime,
        sleepHours: form.sleepHours,
        activityLevel: form.activityLevel,
        stressLevel: form.stressLevel,
      });

      // Save to log
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
        lastMealTime: form.lastMealTime,
        mealType: form.mealType,
        insulinDose: parseFloat(form.insulinDose) || 0,
        insulinTime: form.insulinTime,
        sleepHours: form.sleepHours,
        activityLevel: form.activityLevel,
        stressLevel: form.stressLevel,
        riskScore,
        riskLevel,
        insights,
      };
      saveLog(entry);

      const summary = `GlucoSense AI Risk Report\n========================\nDate: ${new Date().toLocaleString()}\nRisk Score: ${riskScore}/100 (${getRiskLabel(riskLevel)})\nConfidence: ${confidence}%\nGlucose: ${form.glucoseReading || 'Not provided'} mg/dL\nMeal: ${form.mealType} at ${new Date(form.lastMealTime).toLocaleTimeString()}\nInsulin: ${form.insulinDose}u at ${new Date(form.insulinTime).toLocaleTimeString()}\nSleep: ${form.sleepHours}h | Stress: ${form.stressLevel}/10 | Activity: ${form.activityLevel}\n${timeToHypo !== 'N/A' ? `Est. time to hypo: ${timeToHypo}` : ''}\n\nKey Insights:\n${insights.map(i => `- ${i.text}`).join('\n')}\n\nDisclaimer: This tool is for informational and educational purposes only. Not a substitute for medical advice.`;

      setResult({ riskScore, riskLevel, confidence, timeToHypo, breakdown, insights, summary });
      setLoading(false);
    }, 1500);
  };

  const setReminder = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          setTimeout(() => new Notification('GlucoSense AI', { body: 'Time to recheck your glucose levels!', icon: '/favicon.ico' }), 30 * 60 * 1000);
          alert('Reminder set for 30 minutes from now.');
        }
      });
    }
  };

  const inputClass = "w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50";

  return (
    <div className="min-h-screen page-transition">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-6xl mx-auto">
        <h1 className="font-heading text-2xl mb-8 text-center">Risk <span className="text-primary">Predictor</span></h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Input */}
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Last Meal Time</label>
                <input type="datetime-local" value={form.lastMealTime} onChange={e => setForm(p => ({ ...p, lastMealTime: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Meal Type</label>
                <select value={form.mealType} onChange={e => setForm(p => ({ ...p, mealType: e.target.value }))} className={inputClass}>
                  <option value="fasted">Fasted</option>
                  <option value="protein-heavy">Protein-heavy</option>
                  <option value="mixed">Mixed</option>
                  <option value="carb-heavy">Carb-heavy</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Insulin Dose (units)</label>
                <input type="number" value={form.insulinDose} onChange={e => setForm(p => ({ ...p, insulinDose: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Insulin Time</label>
                <input type="datetime-local" value={form.insulinTime} onChange={e => setForm(p => ({ ...p, insulinTime: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Sleep Hours: {form.sleepHours}</label>
              <input type="range" min="4" max="12" value={form.sleepHours} onChange={e => setForm(p => ({ ...p, sleepHours: parseInt(e.target.value) }))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Activity Level</label>
              <select value={form.activityLevel} onChange={e => setForm(p => ({ ...p, activityLevel: e.target.value }))} className={inputClass}>
                <option value="none">None</option>
                <option value="light">Light walk</option>
                <option value="moderate">Moderate</option>
                <option value="intense">Intense</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Stress Level: {form.stressLevel}/10</label>
              <input type="range" min="1" max="10" value={form.stressLevel} onChange={e => setForm(p => ({ ...p, stressLevel: parseInt(e.target.value) }))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Current Glucose (optional, mg/dL)</label>
              <input type="number" placeholder="e.g. 95" value={form.glucoseReading} onChange={e => setForm(p => ({ ...p, glucoseReading: e.target.value }))} className={inputClass} />
            </div>

            <button onClick={predict} disabled={loading} className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
                  Analyzing...
                </span>
              ) : '🔮 Predict My Risk Now'}
            </button>
          </div>

          {/* Right — Results */}
          <div>
            {result ? (
              <div className="space-y-4">
                <GlassTiltCard className="text-center">
                  <div className={`inline-block px-4 py-1 rounded-full text-xs font-heading mb-3 ${result.riskLevel === 'safe' ? 'risk-badge-safe' : result.riskLevel === 'caution' ? 'risk-badge-caution' : result.riskLevel === 'elevated' ? 'risk-badge-high' : 'risk-badge-critical'}`}>
                    {getRiskLabel(result.riskLevel)}
                  </div>
                  <RiskGauge score={result.riskScore} size={200} />
                  <p className="text-foreground/40 text-xs font-body mt-2">Confidence: {result.confidence}%</p>
                  {result.timeToHypo !== 'N/A' && (
                    <p className="text-warning text-xs font-body mt-1">⏱ Est. time to hypoglycaemia: {result.timeToHypo}</p>
                  )}
                </GlassTiltCard>

                {/* Explainability Breakdown */}
                <div className="glass-card p-4">
                  <h4 className="font-heading text-xs mb-3">Factor Breakdown</h4>
                  <div className="space-y-2">
                    {result.breakdown.map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-body text-foreground/50 mb-1">
                          <span>{b.label}</span>
                          <span>{b.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${b.pct}%`, background: b.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="glass-card p-3 text-[10px] font-heading text-center text-safe hover:bg-safe/10 transition-colors">
                    🍎 Log a Protective Snack
                  </button>
                  <button onClick={setReminder} className="glass-card p-3 text-[10px] font-heading text-center text-warning hover:bg-warning/10 transition-colors">
                    ⏰ Set 30-Min Reminder
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(result.summary)} className="glass-card p-3 text-[10px] font-heading text-center text-primary hover:bg-primary/10 transition-colors">
                    📋 Copy for Doctor
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-foreground/30 font-body">Fill in your data and click "Predict" to see results.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-foreground/30 font-body mt-8 max-w-xl mx-auto">
          ⚕️ This tool is for informational and educational purposes only. Not a substitute for medical advice. Always consult your healthcare provider.
        </p>
      </main>
      <StatusBar />
    </div>
  );
}
