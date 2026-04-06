import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { logout } from "@/lib/glucosense";
import { useInView } from "react-intersection-observer";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from "chart.js";
import ParticlesBackground from "@/components/ParticlesBackground";
import GlassTiltCard from "@/components/GlassTiltCard";
import { Activity, Brain, Zap, Shield, BarChart3, Watch } from "lucide-react";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

function CountUp({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });
  const started = useRef(false);

  if (inView && !started.current) {
    started.current = true;
    const startTime = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - startTime) / duration, 1);
      setCount(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  return <span ref={ref}>{count}{suffix}</span>;
}

function TypewriterText({ text, speed = 80 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const { ref, inView } = useInView({ triggerOnce: true });
  const started = useRef(false);

  useEffect(() => {
    if (inView && !started.current) {
      started.current = true;
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [inView, text, speed]);

  return (
    <span ref={ref} className="text-primary text-glow">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function LandingPage() {
  const [demoInputs, setDemoInputs] = useState({ mealTime: '2', insulinDose: '6', sleepHours: '5', activityLevel: 'moderate' });

  useEffect(() => {
    logout();
  }, []);
  const [demoResult, setDemoResult] = useState<null | { labels: string[]; data: number[]; predicted: number[] }>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);

  const runDemo = () => {
    const labels: string[] = [];
    const data: number[] = [];
    const predicted: number[] = [];
    const now = new Date();

    // Generate simulated demo data
    let glucose = 120;
    for (let i = -120; i <= 120; i += 15) {
      const t = new Date(now.getTime() + i * 60000);
      labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      if (i <= 0) {
        glucose += (Math.random() - 0.5) * 8;
        data.push(Math.round(glucose));
        predicted.push(Math.round(glucose));
      } else {
        data.push(NaN);
        const mealHrs = parseFloat(demoInputs.mealTime);
        const dose = parseFloat(demoInputs.insulinDose);
        const sleep = parseFloat(demoInputs.sleepHours);
        const actFactor = demoInputs.activityLevel === 'intense' ? 1.3 : demoInputs.activityLevel === 'moderate' ? 1.0 : 0.7;
        const dropRate = (dose / 10) * actFactor * (mealHrs / 4) * (8 - sleep) / 8;
        glucose -= dropRate * (Math.random() * 0.6 + 0.7) * 3;
        predicted.push(Math.round(Math.max(45, glucose)));
      }
    }
    setDemoResult({ labels, data, predicted });
  };

  const features = [
    { icon: <Brain size={28} />, title: 'Predictive Risk Engine', desc: 'Multi-factor AI model that weighs insulin, meals, sleep, and stress to predict glucose drops.' },
    { icon: <BarChart3 size={28} />, title: 'Explainability Layer', desc: 'See exactly which factors contribute to your risk score with plain-English explanations.' },
    { icon: <Zap size={28} />, title: 'Smart Snack Suggestions', desc: 'Context-aware food recommendations based on your current metabolic state.' },
    { icon: <Shield size={28} />, title: 'Emergency Alert System', desc: 'Instant SOS access with pre-written emergency messages and action steps.' },
    { icon: <Activity size={28} />, title: 'Pattern Memory AI', desc: 'Learns your personal glucose patterns over time to improve predictions.' },
    { icon: <Watch size={28} />, title: 'Wearable Integration Simulator', desc: 'Simulates CGM data integration for a complete health monitoring experience.' },
  ];

  const stats = [
    { value: 500, suffix: 'M+', label: 'Diabetics worldwide', source: 'Source: IDF Diabetes Atlas 2021' },
    { value: 1, suffix: ' in 3', label: 'Hypoglycaemic episodes go undetected', source: 'Source: ADA Standards of Care 2023' },
    { value: 60, suffix: '%', label: 'Reduction in emergency events with early warning', source: 'Source: Diabetes Technology & Therapeutics, 2020' },
    { value: 100, suffix: '%', label: 'Contextual AI outperforms single-sensor tracking', source: 'Source: The Lancet Digital Health, 2022' },
  ];

  return (
    <div className="page-transition">

      {/* ── Top-right Login / Sign Up buttons ── */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}>
        <Link
          to="/auth"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 1.1rem',
            borderRadius: '100px',
            border: '1.5px solid rgba(0,255,204,0.6)',
            color: '#00ffcc',
            background: 'rgba(0,255,204,0.08)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Login
        </Link>

        <Link
          to="/auth"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 1.2rem',
            borderRadius: '100px',
            border: 'none',
            color: '#0a0020',
            background: 'linear-gradient(135deg, #00ffcc, #a97ff0)',
            boxShadow: '0 0 20px #00ffcc55',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'transform 0.2s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          Sign Up
        </Link>
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Particles handled globally */}
<div className="max-w-4xl mx-auto px-4 pt-10 pb-20 flex flex-col items-center text-center relative z-10"><div
  className="transition-all duration-700 overflow-hidden"
style={{ maxHeight: scrolled ? '0px' : '200px', opacity: scrolled ? 0 : 1, marginBottom: scrolled ? '0' : '1.5rem', marginTop: '1rem' }}>
  <h1
    className="font-heading font-black text-foreground text-center"
    style={{
      fontSize: 'clamp(3rem, 10vw, 7rem)',
      letterSpacing: '-0.03em',
      lineHeight: 1,
      background: 'linear-gradient(135deg, #ffffff 30%, #00F5D4 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}
  >
    GlucoGuardian
  </h1>
</div>
<p className="font-heading text-primary text-xs tracking-[0.3em] uppercase mb-4 animate-fade-slide-up">Predict · Protect · Prevail</p>  <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
    Your body knows <TypewriterText text="before you do." speed={100} />
  </h1>
  <p className="text-foreground/60 font-body text-lg mb-10 max-w-2xl">
    GlucoSense uses AI to predict hypoglycaemic episodes up to 60 minutes before they happen — by analysing your medication schedule, meal timing, sleep patterns, and daily lifestyle context.
  </p>
  <div className="flex flex-wrap gap-4 justify-center">
    <Link to="/auth" className="btn-primary-glow px-8 py-3 rounded-xl text-sm inline-block">Get Started — Free</Link>
    <button onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-outline-glow px-8 py-3 rounded-xl text-sm">See a Live Demo</button>
  </div>
</div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-8 border-y border-primary/10" style={{ background: 'rgba(0,245,212,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center py-4">
              <div className="font-heading text-3xl md:text-4xl font-bold text-primary text-glow">
                <CountUp end={s.value} suffix={s.suffix} />
              </div>
              <p className="text-foreground/60 text-sm mt-1 font-body">{s.label}</p>
              <p className="text-foreground/30 text-[10px] mt-1 font-body">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-16">How It <span className="text-primary">Works</span></h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Your Health Context', desc: 'CGM data, meals, medications, sleep — all in one place.' },
              { step: '02', title: 'AI Learns Your Patterns', desc: 'Our algorithm adapts to your personal glucose behaviour over time.' },
              { step: '03', title: 'Receive Predictive Alerts', desc: 'Get warnings before a hypoglycaemic episode occurs — not after.' },
            ].map((item, i) => (
              <GlassTiltCard key={i} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="font-heading text-2xl text-primary font-bold">{item.step}</span>
                </div>
                <h3 className="font-heading text-sm font-semibold mb-2">{item.title}</h3>
                <p className="text-foreground/50 text-sm font-body">{item.desc}</p>
              </GlassTiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section ref={demoRef} className="py-24 relative" style={{ background: 'rgba(0,245,212,0.02)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-4">Interactive <span className="text-primary">Demo</span></h2>
          <p className="text-center text-foreground/40 text-sm mb-12 font-body">Enter values below to see a simulated glucose prediction.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <GlassTiltCard>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-foreground/50 font-body block mb-1">Hours since last meal</label>
                  <input type="number" value={demoInputs.mealTime} onChange={e => setDemoInputs(p => ({ ...p, mealTime: e.target.value }))} className="w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 font-body block mb-1">Insulin dose (units)</label>
                  <input type="number" value={demoInputs.insulinDose} onChange={e => setDemoInputs(p => ({ ...p, insulinDose: e.target.value }))} className="w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 font-body block mb-1">Hours of sleep</label>
                  <input type="number" value={demoInputs.sleepHours} onChange={e => setDemoInputs(p => ({ ...p, sleepHours: e.target.value }))} className="w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 font-body block mb-1">Activity level</label>
                  <select value={demoInputs.activityLevel} onChange={e => setDemoInputs(p => ({ ...p, activityLevel: e.target.value }))} className="w-full bg-muted/30 border border-primary/20 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50">
                    <option value="none">None</option>
                    <option value="light">Light walk</option>
                    <option value="moderate">Moderate</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>
                <button onClick={runDemo} className="btn-primary-glow w-full py-3 rounded-xl text-sm">Simulate Risk Prediction</button>
              </div>
            </GlassTiltCard>

            <div className="glass-card p-6 relative">
              <div className="absolute top-3 right-3 bg-warning/20 text-warning text-[10px] font-heading px-2 py-1 rounded-full border border-warning/30">DEMO — Not medical advice</div>
              {demoResult ? (
                <Line
                  data={{
                    labels: demoResult.labels,
                    datasets: [
                      { label: 'Actual', data: demoResult.data, borderColor: '#00F5D4', backgroundColor: 'rgba(0,245,212,0.1)', fill: false, tension: 0.4, spanGaps: false, pointRadius: 2 },
                      { label: 'Predicted', data: demoResult.predicted, borderColor: '#FFB703', borderDash: [6, 4], backgroundColor: 'rgba(255,183,3,0.05)', fill: true, tension: 0.4, pointRadius: 0 },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: true, labels: { color: 'rgba(255,255,255,0.5)', font: { family: 'DM Sans' } } }, tooltip: { backgroundColor: 'rgba(2,11,24,0.9)', titleFont: { family: 'Orbitron' }, bodyFont: { family: 'DM Sans' } } },
                    scales: {
                      x: { ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'DM Sans', size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      y: {
                        min: 40, max: 160,
                        ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'DM Sans', size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                      },
                    },
                    
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-foreground/30 text-sm font-body">Enter values and click "Simulate" to see the prediction chart.</div>
              )}
              {demoResult && <div className="mt-2 text-[10px] text-destructive font-body text-center">— Hypoglycaemia threshold: 70 mg/dL (red zone) —</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-16">Powerful <span className="text-primary">Features</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <GlassTiltCard key={i}>
                <div className="text-primary mb-4">{f.icon}</div>
                <h3 className="font-heading text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-foreground/50 text-sm font-body">{f.desc}</p>
              </GlassTiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-primary/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="font-heading text-primary text-xs font-bold">GS</span>
            </div>
            <span className="font-heading text-sm text-primary">GlucoSense AI</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-foreground/40 font-body">
            <span>SDG-3: Good Health & Well-being</span>
            <span>•</span>
            <a href="https://github.com" target="_blank" rel="noopener" className="hover:text-primary transition-colors">GitHub</a>
            <span>•</span>
            <span>Team GlucoSense</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
