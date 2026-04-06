import { generateNotificationsFromLogs } from "@/lib/notifications";
import { useState } from "react";
import {
  calculateRiskScore, getRiskLevel, generateInsights,
  saveLog, getSession, type LogEntry
} from "@/lib/glucosense";

interface Props { open: boolean; onClose: () => void; }

export default function QuickLogModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    glucoseReading: '',
    lastMealTime: new Date(Date.now() - 2 * 3600000).toISOString().slice(0, 16),
    mealType: 'mixed',
    insulinDose: '5',
    insulinTime: new Date(Date.now() - 1 * 3600000).toISOString().slice(0, 16),
    sleepHours: '7',
    stressLevel: 5,
    activityLevel: 'none',
  });

  if (!open) return null;

  const handleSubmit = () => {
    const session = getSession();
    const riskScore = calculateRiskScore({
      insulinDose: parseFloat(form.insulinDose) || 0,
      insulinTime: form.insulinTime,
      lastMealTime: form.lastMealTime,
      mealType: form.mealType,
      sleepHours: parseFloat(form.sleepHours) || 7,
      stressLevel: form.stressLevel,
      activityLevel: form.activityLevel,
      glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
      sensitivity: session?.aiSensitivity || 'balanced',
    });

    const insights = generateInsights({
      glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
      lastMealTime: form.lastMealTime,
      mealType: form.mealType,
      insulinDose: parseFloat(form.insulinDose) || 0,
      insulinTime: form.insulinTime,
      sleepHours: parseFloat(form.sleepHours) || 7,
      activityLevel: form.activityLevel,
      stressLevel: form.stressLevel,
    });

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      glucoseReading: form.glucoseReading ? parseFloat(form.glucoseReading) : undefined,
      lastMealTime: form.lastMealTime,
      mealType: form.mealType,
      insulinDose: parseFloat(form.insulinDose) || 0,
      insulinTime: form.insulinTime,
      sleepHours: parseFloat(form.sleepHours) || 7,
      activityLevel: form.activityLevel,
      stressLevel: form.stressLevel,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      insights,
    };

    saveLog(entry);
    generateNotificationsFromLogs();
    onClose();
  };

  const inputClass = "w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-heading text-lg text-primary mb-4">Quick Log</h2>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Current Glucose (optional, mg/dL)</label>
            <input type="number" placeholder="e.g. 95" value={form.glucoseReading} onChange={e => setForm(p => ({ ...p, glucoseReading: e.target.value }))} className={inputClass} />
          </div>
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
            <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Sleep Hours</label>
            <input type="number" min="0" max="16" value={form.sleepHours} onChange={e => setForm(p => ({ ...p, sleepHours: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Stress Level: {form.stressLevel}/10</label>
            <input type="range" min="1" max="10" value={form.stressLevel} onChange={e => setForm(p => ({ ...p, stressLevel: parseInt(e.target.value) }))} className="w-full accent-primary" />
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
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 glass-card text-sm text-foreground/50 hover:text-foreground transition-colors text-center">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 btn-primary-glow py-2 rounded-xl text-sm">Log & Calculate</button>
        </div>
      </div>
    </div>
  );
}
