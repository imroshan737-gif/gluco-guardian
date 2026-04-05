import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import GlassTiltCard from "@/components/GlassTiltCard";
import { getSession, updateProfile, clearAllData, exportDataAsJson } from "@/lib/glucosense";

export default function Settings() {
  const navigate = useNavigate();
  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const session = getSession();
  const [form, setForm] = useState({
    fullName: session?.fullName || '',
    age: session?.age?.toString() || '',
    diabetesType: session?.diabetesType || 'Type 1',
    glucoseRange: session?.glucoseRange || '70–140',
    emergencyContactName: session?.emergencyContactName || '',
    heightCm: session?.heightCm?.toString() || '',
    weightKg: session?.weightKg?.toString() || '',
  });
  const [alerts, setAlerts] = useState(session?.alertPreferences || { sound: true, notification: true, vibration: false });
  const [sensitivity, setSensitivity] = useState(session?.aiSensitivity || 'balanced');
  const [saved, setSaved] = useState(false);

  // ── This is the fix — reads from form, not session ──
  const hasBodyData = !!form.heightCm && !!form.weightKg;

  const handleSave = () => {
    updateProfile({
      fullName: form.fullName,
      age: parseInt(form.age),
      diabetesType: form.diabetesType,
      glucoseRange: form.glucoseRange,
      emergencyContactName: form.emergencyContactName,
      alertPreferences: alerts,
      aiSensitivity: sensitivity as any,
      heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
      weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      clearAllData();
      navigate('/');
    }
  };

  const handleExport = () => {
    const data = exportDataAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glucosense-data.json';
    a.click();
  };

  const inputClass = "w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50";

  if (!session) return null;

  return (
    <div className="min-h-screen page-transition">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl mb-8 text-center">
          <span className="text-primary">Settings</span>
        </h1>

        <div className="space-y-6">

          {/* Profile */}
          <GlassTiltCard>
            <h3 className="font-heading text-xs text-primary mb-4">HEALTH PROFILE</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Diabetes Type</label>
                  <select
                    value={form.diabetesType}
                    onChange={e => setForm(p => ({ ...p, diabetesType: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="Type 1">Type 1</option>
                    <option value="Type 2">Type 2</option>
                    <option value="Pre-diabetic">Pre-diabetic</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Typical Glucose Range</label>
                <select
                  value={form.glucoseRange}
                  onChange={e => setForm(p => ({ ...p, glucoseRange: e.target.value }))}
                  className={inputClass}
                >
                  <option value="Below 70">Below 70 mg/dL</option>
                  <option value="70–140">70–140 mg/dL</option>
                  <option value="140–180">140–180 mg/dL</option>
                  <option value="Above 180">Above 180 mg/dL</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 170"
                    value={form.heightCm}
                    onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={form.weightKg}
                    onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </GlassTiltCard>

          {/* Emergency Contact */}
          <GlassTiltCard>
            <h3 className="font-heading text-xs text-primary mb-4">EMERGENCY CONTACT</h3>
            <div>
              <label className="text-[10px] text-foreground/40 font-heading uppercase block mb-1">Contact Name</label>
              <input
                placeholder="Name of emergency contact"
                value={form.emergencyContactName}
                onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                className={inputClass}
              />
            </div>
          </GlassTiltCard>

          {/* Alert Preferences */}
          <GlassTiltCard>
            <h3 className="font-heading text-xs text-primary mb-4">ALERT PREFERENCES</h3>
            <div className="space-y-3">
              {(['sound', 'notification', 'vibration'] as const).map(key => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-body text-foreground/70 capitalize">
                    {key === 'notification' ? 'Browser Notification' : key} Alert
                  </span>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${alerts[key] ? 'bg-primary/40' : 'bg-muted'}`}
                    onClick={() => setAlerts(p => ({ ...p, [key]: !p[key] }))}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${alerts[key] ? 'left-5 bg-primary' : 'left-0.5 bg-foreground/30'}`} />
                  </div>
                </label>
              ))}
            </div>
          </GlassTiltCard>

          {/* AI Sensitivity */}
          <GlassTiltCard>
            <h3 className="font-heading text-xs text-primary mb-4">AI SENSITIVITY</h3>
            <div className="flex gap-2">
              {(['conservative', 'balanced', 'aggressive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`flex-1 py-2 text-xs font-heading rounded-lg transition-colors ${sensitivity === s ? 'bg-primary/20 text-primary' : 'glass-card text-foreground/40'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-foreground/30 font-body mt-2">
              {sensitivity === 'conservative'
                ? 'Lower sensitivity — fewer alerts, higher thresholds.'
                : sensitivity === 'aggressive'
                ? 'Higher sensitivity — more alerts, lower thresholds.'
                : 'Balanced approach for most users.'}
            </p>
          </GlassTiltCard>

          {/* Save */}
          <button onClick={handleSave} className="btn-primary-glow w-full py-3 rounded-xl text-sm">
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>

          {/* Health Plan Button — shows as soon as height + weight are typed */}
          {hasBodyData && (
            <button
              onClick={() => { handleSave(); navigate('/health-plan'); }}
              className="w-full py-3 text-sm font-heading text-center transition-colors rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,212,0.15), rgba(169,127,240,0.15))',
                border: '1px solid rgba(0,245,212,0.3)',
                color: '#00F5D4',
              }}
            >
              💪 View My Health & Workout Plan
            </button>
          )}

          {/* Data Management */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 glass-card py-3 text-sm font-heading text-primary text-center hover:bg-primary/10 transition-colors"
              style={{ borderRadius: 12 }}
            >
              📤 Export Data as JSON
            </button>
            <button
              onClick={handleReset}
              className="flex-1 glass-card py-3 text-sm font-heading text-destructive text-center hover:bg-destructive/10 transition-colors"
              style={{ borderRadius: 12 }}
            >
              🗑️ Reset All Data
            </button>
          </div>

        </div>
      </main>
      <StatusBar />
    </div>
  );
}
