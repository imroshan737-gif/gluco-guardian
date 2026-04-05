import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUser, loginUser, getSession } from "@/lib/glucosense";
import { useEffect } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', age: '', diabetesType: 'Type 1', glucoseRange: '70–140' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { if (getSession()) navigate('/dashboard'); }, []);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password || !form.age) { setError('Please fill all required fields.'); return; }
    saveUser({ ...form, age: parseInt(form.age) });
    // Auto login
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

  const inputClass = "w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50 placeholder:text-foreground/30";

  return (
    <div className="min-h-screen flex page-transition">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(214,80%,5%), hsl(214,60%,10%))' }}>
        <div className="text-center px-12 relative z-10">
          {/* CSS 3D molecule */}
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
              <div className="absolute w-6 h-6 rounded-full bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ boxShadow: '0 0 25px rgba(0,245,212,0.8)' }} />
            </div>
          </div>
          <blockquote className="text-foreground/50 font-body text-lg italic mb-4">
            "The greatest wealth is health."
          </blockquote>
          <p className="text-foreground/30 text-sm font-body">— Virgil</p>
          <p className="mt-8 text-primary/60 text-xs font-heading tracking-widest">GLUCOSENSE AI</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="glass-card p-8 w-full max-w-md">
          <h2 className="font-heading text-2xl font-bold mb-1 text-center">
            {mode === 'signup' ? 'Create Your Profile' : 'Welcome Back'}
          </h2>
          <p className="text-foreground/40 text-sm text-center font-body mb-6">
            {mode === 'signup' ? 'Start your journey to safer glucose management.' : 'Log in to your GlucoSense dashboard.'}
          </p>

          {/* Tab toggle */}
          <div className="flex mb-6 glass-card p-1" style={{ borderRadius: 10 }}>
            {(['signup', 'login'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} className={`flex-1 py-2 text-sm font-heading rounded-lg transition-all ${mode === m ? 'bg-primary/20 text-primary' : 'text-foreground/40'}`}>
                {m === 'signup' ? 'Sign Up' : 'Login'}
              </button>
            ))}
          </div>

          {error && <p className="text-destructive text-xs font-body mb-4 text-center">{error}</p>}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-3">
              <input placeholder="Full Name" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputClass} />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} />
              <input type="number" placeholder="Age" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} className={inputClass} />
              <select value={form.diabetesType} onChange={e => setForm(p => ({ ...p, diabetesType: e.target.value }))} className={inputClass}>
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
                <option value="Pre-diabetic">Pre-diabetic</option>
                <option value="At Risk">At Risk</option>
              </select>
              <select value={form.glucoseRange} onChange={e => setForm(p => ({ ...p, glucoseRange: e.target.value }))} className={inputClass}>
                <option value="Below 70">Below 70 mg/dL</option>
                <option value="70–140">70–140 mg/dL</option>
                <option value="140–180">140–180 mg/dL</option>
                <option value="Above 180">Above 180 mg/dL</option>
              </select>
              <button type="submit" className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2">Create My GlucoSense Profile</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} className={inputClass} />
              <button type="submit" className="btn-primary-glow w-full py-3 rounded-xl text-sm mt-2">Login</button>
              <p className="text-center text-xs text-foreground/30 font-body mt-2 cursor-pointer hover:text-primary transition-colors">Forgot Password?</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
