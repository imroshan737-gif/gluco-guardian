import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { logout } from "@/lib/glucosense";
import { useInView } from "react-intersection-observer";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from "chart.js";
import heroPhoto from "@/assets/glucoguardian-hero.png.asset.json";
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
    <span ref={ref} className="hl-teal">
      {displayed}
      <span className="animate-pulse hl-caret font-light">|</span>
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
    { icon: <Brain size={20} />, title: 'Predictive Risk Engine', desc: 'Multi-factor AI model that weighs insulin, meals, sleep, and stress to predict glucose drops.' },
    { icon: <BarChart3 size={20} />, title: 'Explainability Layer', desc: 'See exactly which factors contribute to your risk score with plain-English explanations.' },
    { icon: <Zap size={20} />, title: 'Smart Snack Suggestions', desc: 'Context-aware food recommendations based on your current metabolic state.' },
    { icon: <Shield size={20} />, title: 'Emergency Alert System', desc: 'Instant SOS access with pre-written emergency messages and action steps.' },
    { icon: <Activity size={20} />, title: 'Pattern Memory AI', desc: 'Learns your personal glucose patterns over time to improve predictions.' },
    { icon: <Watch size={20} />, title: 'Wearable Integration Simulator', desc: 'Simulates CGM data integration for a complete health monitoring experience.' },
  ];

  const stats = [
    { value: 500, suffix: 'M+', label: 'Diabetics worldwide', source: 'Source: IDF Diabetes Atlas 2021' },
    { value: 1, suffix: ' in 3', label: 'Hypoglycaemic episodes go undetected', source: 'Source: ADA Standards of Care 2023' },
    { value: 60, suffix: '%', label: 'Reduction in emergency events with early warning', source: 'Source: Diabetes Technology & Therapeutics, 2020' },
    { value: 100, suffix: '%', label: 'Contextual AI outperforms single-sensor tracking', source: 'Source: The Lancet Digital Health, 2022' },
  ];

  const C = "max-w-[1160px] mx-auto px-6";

  return (
    <div className="home-light page-transition">
      {/* Navbar */}
      <header className="hl-nav sticky top-0 z-50">
        <div className={`${C} h-16 flex items-center justify-between`}>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg hl-icon flex items-center justify-center"><Activity size={16} /></span>
            <span className="font-bold text-[17px] hl-ink">GlucoGuardian</span>
          </Link>
          <nav className="flex items-center gap-2.5">
            <Link to="/auth" className="hl-btn-outline px-4 py-2 text-sm">Login</Link>
            <Link to="/auth" className="hl-btn-primary px-4 py-2 text-sm">Sign Up</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hl-bg">
        <div className={`${C} grid md:grid-cols-[1.2fr_1fr] gap-12 items-center py-16 md:py-24`}>
          <div>
            <p className="hl-teal-dark text-sm font-semibold mb-4">Predict · Protect · Prevail</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-5">
              Your body knows <TypewriterText text="before you do." speed={100} />
            </h1>
            <p className="hl-muted text-lg mb-8 max-w-md leading-relaxed">
              Understand your glucose risk before it catches you off guard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="hl-btn-primary px-6 py-3 text-sm inline-block">Get Started — Free</Link>
              <button onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hl-btn-outline px-6 py-3 text-sm">See a Live Demo</button>
            </div>
          </div>
          <img src={heroPhoto.url} alt="Person checking blood glucose with a meter and test strip" className="w-full aspect-[4/3] object-cover rounded-[18px]" style={{ objectPosition: '72% center' }} />
        </div>
      </section>

      {/* Stats */}
      <section className="hl-alt border-y hl-border">
        <div className={`${C} grid grid-cols-2 lg:grid-cols-4 gap-6 py-12`}>
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold hl-teal-dark"><CountUp end={s.value} suffix={s.suffix} /></div>
              <p className="hl-muted text-sm mt-2">{s.label}</p>
              <p className="hl-faint text-[11px] mt-1">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="hl-bg py-24">
        <div className={C}>
          <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Connect Your Health Context', desc: 'CGM data, meals, medications, sleep — all in one place.' },
              { step: '02', title: 'AI Learns Your Patterns', desc: 'Our algorithm adapts to your personal glucose behaviour over time.' },
              { step: '03', title: 'Receive Predictive Alerts', desc: 'Get warnings before a hypoglycaemic episode occurs — not after.' },
            ].map((item, i) => (
              <div key={i} className="hl-card p-7">
                <div className="w-11 h-11 rounded-xl hl-icon flex items-center justify-center mb-5 font-bold text-sm">{item.step}</div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="hl-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section ref={demoRef} className="hl-alt py-24">
        <div className={C}>
          <h2 className="text-3xl font-bold text-center mb-3">Interactive demo</h2>
          <p className="text-center hl-muted text-sm mb-12">Enter values below to see a simulated glucose prediction.</p>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
            <div className="hl-card p-7 space-y-4">
              {([['mealTime', 'Hours since last meal'], ['insulinDose', 'Insulin dose (units)'], ['sleepHours', 'Hours of sleep']] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs font-medium hl-muted block mb-1.5">{label}</label>
                  <input type="number" value={demoInputs[k]} onChange={e => setDemoInputs(p => ({ ...p, [k]: e.target.value }))} className="hl-input" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium hl-muted block mb-1.5">Activity level</label>
                <select value={demoInputs.activityLevel} onChange={e => setDemoInputs(p => ({ ...p, activityLevel: e.target.value }))} className="hl-input">
                  <option value="none">None</option>
                  <option value="light">Light walk</option>
                  <option value="moderate">Moderate</option>
                  <option value="intense">Intense</option>
                </select>
              </div>
              <button onClick={runDemo} className="hl-btn-primary w-full py-3 text-sm">Simulate Risk Prediction</button>
            </div>

            <div className="hl-card p-7 relative min-h-[320px]">
              <div className="absolute top-4 right-4 hl-badge-warn text-[11px] font-semibold px-2.5 py-1 rounded-md">DEMO — Not medical advice</div>
              {demoResult ? (
                <div className="pt-8">
                  <Line
                    data={{
                      labels: demoResult.labels,
                      datasets: [
                        { label: 'Actual', data: demoResult.data, borderColor: '#00A98F', backgroundColor: 'rgba(0,169,143,0.1)', fill: false, tension: 0.4, spanGaps: false, pointRadius: 2 },
                        { label: 'Predicted', data: demoResult.predicted, borderColor: '#D98E04', borderDash: [6, 4], backgroundColor: 'rgba(217,142,4,0.06)', fill: true, tension: 0.4, pointRadius: 0 },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: true, labels: { color: '#61727A', font: { family: 'Manrope' } } }, tooltip: { backgroundColor: '#102A36', titleFont: { family: 'Manrope' }, bodyFont: { family: 'Manrope' } } },
                      scales: {
                        x: { ticks: { color: '#7A8A90', font: { family: 'Manrope', size: 9 } }, grid: { color: '#EEF4F2' } },
                        y: { min: 40, max: 160, ticks: { color: '#7A8A90', font: { family: 'Manrope', size: 10 } }, grid: { color: '#EEF4F2' } },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[260px] flex items-center justify-center hl-faint text-sm text-center">Enter values and click "Simulate" to see the prediction chart.</div>
              )}
              {demoResult && <div className="mt-3 text-[11px] hl-danger text-center">Hypoglycaemia threshold: 70 mg/dL</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="hl-bg py-24">
        <div className={C}>
          <h2 className="text-3xl font-bold text-center mb-14">Powerful features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="hl-card p-7">
                <div className="w-11 h-11 rounded-xl hl-icon flex items-center justify-center mb-5">{f.icon}</div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="hl-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hl-footer py-12">
        <div className={`${C} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--hl-teal))' }}>
              <span className="hl-footer-strong text-xs font-bold">GS</span>
            </div>
            <span className="text-sm font-semibold hl-footer-strong">GlucoSense AI</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>SDG-3: Good Health & Well-being</span>
            <span>•</span>
            <a href="https://github.com" target="_blank" rel="noopener" className="transition-colors hover:opacity-80" style={{ color: 'hsl(var(--hl-teal))' }}>GitHub</a>
            <span>•</span>
            <span>Team GlucoSense</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
