import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUser, loginUser, getSession } from "@/lib/glucosense";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Medication {
  id: string;
  name: string;
  timing: string;   // "before" | "after"
  schedule: string; // e.g. "1-0-1"
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [diabetesDropdownOpen, setDiabetesDropdownOpen] = useState(false);

  // Step tracking: 1 = basic form, 2 = profile popup, 3 = meal/medication popup
  const [step, setStep] = useState(1);

  const [profileData, setProfileData] = useState({
    age: '', diabetesType: 'Type 1', bloodPressure: '', height: '', weight: '',
  });

  const [mealTimes, setMealTimes] = useState({
    breakfast: '08:00', lunch: '13:00', dinner: '19:00',
  });

  const [onMedication, setOnMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', timing: 'before', schedule: '1-0-1' }
  ]);
  const [stressLevel, setStressLevel] = useState(5);

  const navigate = useNavigate();
  useEffect(() => { if (getSession()) navigate('/dashboard'); }, []);
  useEffect(() => {
  const handleClickOutside = () => setDiabetesDropdownOpen(false);
  if (diabetesDropdownOpen) document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, [diabetesDropdownOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill all required fields.'); return;
    }
    setStep(2);
  };

  const handleProfileNext = () => {
    setError('');
    if (!profileData.age || !profileData.bloodPressure || !profileData.height || !profileData.weight) {
      setError('Please fill all profile fields.'); return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setError('');
    const medicationList = onMedication ? medications.filter(m => m.name.trim()) : [];

    // 1. Register with Supabase — this triggers the welcome email automatically
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2. Save to localStorage as before so rest of app still works
    saveUser({
      ...form,
      age: parseInt(profileData.age),
      diabetesType: profileData.diabetesType,
      bloodPressure: profileData.bloodPressure,
      height: profileData.height,
      weight: profileData.weight,
      glucoseRange: '70–140',
      mealTimes,
      medications: medicationList,
      stressLevel,
    });
    loginUser(form.email, form.password);
    navigate('/dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = loginUser(loginForm.email, loginForm.password);
    if (!user) { setError('Invalid email or password.'); return; }
    navigate('/dashboard');
  };

  const addMedication = () => {
    setMedications(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', timing: 'before', schedule: '1-0-0' }
    ]);
  };

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Parse schedule string to readable label e.g. "1-0-1" → "Breakfast & Dinner"
  const scheduleLabel = (schedule: string) => {
    const [b, l, d] = schedule.split('-');
    const parts = [];
    if (b === '1') parts.push('Breakfast');
    if (l === '1') parts.push('Lunch');
    if (d === '1') parts.push('Dinner');
    return parts.length ? parts.join(' & ') : 'None';
  };

  // Stress bar color
  const stressColor = stressLevel <= 3 ? '#00f5d4' : stressLevel <= 6 ? '#f5a623' : '#f54242';

  const inputClass = "w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50 placeholder:text-foreground/30";
  const labelClass = "text-xs text-foreground/50 font-body mb-1 block";

  return (
    <div className="min-h-screen flex page-transition">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(220,30%,6%), hsl(220,25%,10%))' }}>
        <div className="text-center px-12 relative z-10">
          <div className="relative w-48 h-48 mx-auto mb-8" style={{ perspective: '600px' }}>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <div key={i} className="absolute w-4 h-4 rounded-full bg-primary" style={{
                  top: `${50 + 40 * Math.sin(deg * Math.PI / 180)}%`,
                  left: `${50 + 40 * Math.cos(deg * Math.PI / 180)}%`,
                  boxShadow: '0 0 15px rgba(0,245,212,0.6)',
                  transform: 'translate(-50%, -50%)',
                }} />
              ))}
              <div className="absolute w-6 h-6 rounded-full bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ boxShadow: '0 0 25px rgba(0,245,212,0.8)' }} />
            </div>
          </div>
          <blockquote className="text-foreground/50 font-body text-lg italic mb-4">
            "The greatest wealth is health."
          </blockquote>
          <p className="text-foreground/30 text-sm font-body">— Virgil</p>
          <p className="mt-8 text-primary/60 text-xs font-heading tracking-widest">GLUCOSENSE AI</p>
        </div>
      </div>

      {/* ── Right: Step 1 — Basic signup / login ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="glass-card p-8 w-full max-w-md">
          <h2 className="font-heading text-2xl font-bold mb-1 text-center">
            {mode === 'signup' ? 'Create Your Profile' : 'Welcome Back'}
          </h2>
          <p className="text-foreground/40 text-sm text-center font-body mb-6">
            {mode === 'signup' ? 'Start your journey to safer glucose management.' : 'Log in to your GlucoSense dashboard.'}
          </p>

          <div className="flex mb-6 glass-card p-1" style={{ borderRadius: 10 }}>
            {(['signup', 'login'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-heading rounded-lg transition-all ${mode === m ? 'bg-primary/20 text-primary' : 'text-foreground/40'}`}>
                {m === 'signup' ? 'Sign Up' : 'Login'}
              </button>
            ))}
          </div>

          {error && step === 1 && <p className="text-destructive text-xs font-body mb-4 text-center">{error}</p>}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-3">
              <input placeholder="Full Name" value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputClass} />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} />
              <button type="submit" className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2">
                Create My GlucoSense Profile
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email" value={loginForm.email}
                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              <input type="password" placeholder="Password" value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} className={inputClass} />
              <button type="submit" className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2">Login</button>
              <p className="text-center text-xs text-foreground/30 font-body mt-2 cursor-pointer hover:text-primary transition-colors">
                Forgot Password?
              </p>
            </form>
          )}
        </div>
      </div>

      {/* ── Step 2 Popup — Profile details ───────────────────────────────── */}
      {step === 2 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 w-full max-w-md">
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 h-1 rounded-full"
                  style={{ background: s <= 2 ? 'rgba(0,245,212,0.8)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            <h2 className="font-heading text-2xl font-bold mb-1 text-center">One More Step 👋</h2>
            <p className="text-foreground/40 text-sm text-center font-body mb-6">
              Help us personalise your glucose monitoring
            </p>

            {error && <p className="text-destructive text-xs font-body mb-4 text-center">{error}</p>}

            <div className="space-y-3">
              <input type="number" placeholder="Age" value={profileData.age}
                onChange={e => setProfileData(p => ({ ...p, age: e.target.value }))} className={inputClass} />
            <div className="relative">
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); setDiabetesDropdownOpen(p => !p); }}
    className={inputClass}
    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
  >
    <span>{profileData.diabetesType}</span>
    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{diabetesDropdownOpen ? '▲' : '▼'}</span>
  </button>

  {diabetesDropdownOpen && (
    <div
      className="absolute w-full z-50 rounded-lg overflow-hidden"
      style={{ background: '#0f0f1a', border: '1px solid rgba(0,245,212,0.2)', top: '110%' }}
    >
      {['No Diabetes', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Pre-diabetic', 'At Risk'].map(option => (
        <div
          key={option}
          onClick={(e) => {
            e.stopPropagation();
            setProfileData(p => ({ ...p, diabetesType: option }));
            setDiabetesDropdownOpen(false);
          }}
          className="px-4 py-3 text-sm font-body cursor-pointer transition-all"
          style={{
            color: profileData.diabetesType === option ? '#00f5d4' : '#ffffff',
            background: profileData.diabetesType === option ? 'rgba(0,245,212,0.1)' : 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,245,212,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = profileData.diabetesType === option ? 'rgba(0,245,212,0.1)' : 'transparent')}
        >
          {option}
        </div>
      ))}
    </div>
  )}
</div>
              <input type="text" placeholder="Blood Pressure (e.g. 120/80 mmHg)" value={profileData.bloodPressure}
                onChange={e => setProfileData(p => ({ ...p, bloodPressure: e.target.value }))} className={inputClass} />
              <div className="flex gap-3">
                <input type="number" placeholder="Height (cm)" value={profileData.height}
                  onChange={e => setProfileData(p => ({ ...p, height: e.target.value }))} className={inputClass} />
                <input type="number" placeholder="Weight (kg)" value={profileData.weight}
                  onChange={e => setProfileData(p => ({ ...p, weight: e.target.value }))} className={inputClass} />
              </div>
              <button onClick={handleProfileNext} className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2">
                Next →
              </button>
              <button onClick={() => { setStep(1); setError(''); }}
                className="w-full text-foreground/30 hover:text-primary text-xs font-body mt-1 transition-colors">
                ← Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 Popup — Meals, Medication & Stress ────────────────────── */}
      {step === 3 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card p-8 w-full max-w-lg my-8">

            {/* Progress */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 h-1 rounded-full"
                  style={{ background: 'rgba(0,245,212,0.8)' }} />
              ))}
            </div>

            <h2 className="font-heading text-2xl font-bold mb-1 text-center">Your Daily Routine 🍽️</h2>
            <p className="text-foreground/40 text-sm text-center font-body mb-6">
              Set your meal times, medications & stress baseline
            </p>

            {/* ── Meal Times ─────────────────────────────────────────────── */}
            <div className="mb-6">
              <p className="font-heading text-sm text-primary mb-3 tracking-widest uppercase">Meal Times</p>
              <div className="grid grid-cols-3 gap-3">
                {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                  <div key={meal}>
                    <label className={labelClass}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</label>
                    <input
                      type="time"
                      value={mealTimes[meal]}
                      onChange={e => setMealTimes(p => ({ ...p, [meal]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Medication Checkbox ────────────────────────────────────── */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setOnMedication(p => !p)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    borderColor: onMedication ? '#00f5d4' : 'rgba(255,255,255,0.2)',
                    background: onMedication ? 'rgba(0,245,212,0.2)' : 'transparent'
                  }}
                >
                  {onMedication && <span style={{ color: '#00f5d4', fontSize: 12 }}>✓</span>}
                </div>
                <span className="text-sm font-body text-foreground/70 group-hover:text-foreground transition-colors">
                  I am currently on medication
                </span>
              </label>
            </div>

            {/* ── Medication List (shown only if checked) ────────────────── */}
            {onMedication && (
              <div className="mb-6 space-y-4">
                <p className="font-heading text-sm text-primary tracking-widest uppercase">Medications</p>

                {medications.map((med, idx) => (
                  <div key={med.id} className="bg-muted/20 border border-primary/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/40 font-body">Medicine #{idx + 1}</span>
                      {medications.length > 1 && (
                        <button onClick={() => removeMedication(med.id)}
                          className="text-xs text-destructive hover:text-red-400 transition-colors">
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Medicine name */}
                    <input
                      placeholder="Medicine name (e.g. Metformin)"
                      value={med.name}
                      onChange={e => updateMedication(med.id, 'name', e.target.value)}
                      className={inputClass}
                    />

                    {/* Schedule: 1-0-1 style */}
                    <div>
                      <label className={labelClass}>
                        Schedule — {scheduleLabel(med.schedule)}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Breakfast', 'Lunch', 'Dinner'].map((meal, mealIdx) => {
                          const parts = med.schedule.split('-');
                          const isOn = parts[mealIdx] === '1';
                          return (
                            <button
                              key={meal}
                              type="button"
                              onClick={() => {
                                const p = med.schedule.split('-');
                                p[mealIdx] = isOn ? '0' : '1';
                                updateMedication(med.id, 'schedule', p.join('-'));
                              }}
                              className="py-2 rounded-lg text-xs font-heading transition-all"
                              style={{
                                background: isOn ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${isOn ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                color: isOn ? '#00f5d4' : 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {meal}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Before / After food */}
                    <div>
                      <label className={labelClass}>Take medicine</label>
                      <div className="flex gap-2">
                        {['before', 'after'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateMedication(med.id, 'timing', t)}
                            className="flex-1 py-2 rounded-lg text-xs font-heading transition-all"
                            style={{
                              background: med.timing === t ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${med.timing === t ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                              color: med.timing === t ? '#00f5d4' : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)} food
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addMedication}
                  className="w-full py-2 rounded-xl text-xs font-heading text-primary border border-primary/20 hover:border-primary/50 transition-all">
                  + Add Another Medicine
                </button>
              </div>
            )}

            {/* ── Stress Level ───────────────────────────────────────────── */}
            <div className="mb-6">
              <p className="font-heading text-sm text-primary mb-3 tracking-widest uppercase">Baseline Stress Level</p>

              {/* Bar graph visual */}
              <div className="flex items-end gap-1 h-16 mb-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                  <div key={level} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm transition-all cursor-pointer"
                      style={{
                        height: `${level * 10}%`,
                        background: level <= stressLevel
                          ? (level <= 3 ? '#00f5d4' : level <= 6 ? '#f5a623' : '#f54242')
                          : 'rgba(255,255,255,0.08)',
                        opacity: level <= stressLevel ? 1 : 0.4,
                      }}
                      onClick={() => setStressLevel(level)}
                    />
                  </div>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min={1} max={10}
                value={stressLevel}
                onChange={e => setStressLevel(parseInt(e.target.value))}
                className="w-full accent-primary"
              />

              <div className="flex justify-between text-xs text-foreground/30 font-body mt-1">
                <span>😌 Calm</span>
                <span style={{ color: stressColor }} className="font-heading">
                  {stressLevel}/10 — {stressLevel <= 3 ? 'Low' : stressLevel <= 6 ? 'Moderate' : 'High'}
                </span>
                <span>😰 High Stress</span>
              </div>
            </div>

            {/* ── Final Submit ───────────────────────────────────────────── */}
            <button
              onClick={handleFinalSubmit}
              className="btn-primary-glow w-full py-3 rounded-xl text-sm"
            >
              Let's Go 🚀
            </button>
            <button onClick={() => { setStep(2); setError(''); }}
              className="w-full text-foreground/30 hover:text-primary text-xs font-body mt-3 transition-colors">
              ← Go back
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
