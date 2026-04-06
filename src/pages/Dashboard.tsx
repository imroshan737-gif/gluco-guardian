import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from "chart.js";
import ParticlesBackground from "@/components/ParticlesBackground";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import RiskGauge from "@/components/RiskGauge";
import GlassTiltCard from "@/components/GlassTiltCard";
import QuickLogModal from "@/components/QuickLogModal";
import { useRef } from "react";
import {
  getSession, getLatestLog, getRiskLevel, getRiskLabel,
  getInsulinStatus, getTimeSince, generatePredictionData, getLogs
} from "@/lib/glucosense";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('3H');
  const [, setRefresh] = useState(0);
  const [showMedPanel, setShowMedPanel] = useState(false);
const [mealPopup, setMealPopup] = useState<{ meal: string; time: string } | null>(null);
const [mealChoices, setMealChoices] = useState<Record<string, 'yes' | 'no'>>({});
const mealCheckedRef = useRef<Set<string>>(new Set());

  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const session = getSession();
  // ── Meal time reminder checker ─────────────────────────────────────────────
useEffect(() => {
  const interval = setInterval(() => {
    const user = getSession();
    if (!user?.mealTimes) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const meals = [
      { meal: 'Breakfast', time: user.mealTimes.breakfast },
      { meal: 'Lunch',     time: user.mealTimes.lunch     },
      { meal: 'Dinner',    time: user.mealTimes.dinner    },
    ];

    for (const { meal, time } of meals) {
      const key = `${meal}-${time}-${now.toDateString()}`;
      if (currentTime === time && !mealCheckedRef.current.has(key)) {
        mealCheckedRef.current.add(key);
        setMealPopup({ meal, time });
        break;
      }
    }
  }, 10000); // checks every 10 seconds

  return () => clearInterval(interval);
}, []);
  const latestLog = getLatestLog();
  const riskScore = latestLog?.riskScore ?? 0;
  const riskLevel = getRiskLevel(riskScore);

  // Prediction chart data
  const glucose = latestLog?.glucoseReading ?? 110;
  const predData = generatePredictionData(glucose, riskScore);

  // Insights
  const insights = latestLog?.insights ?? [];

  const metricCards = [
    { label: 'Last Logged Glucose', value: latestLog?.glucoseReading ? `${latestLog.glucoseReading} mg/dL` : '—', color: '#00ffcc' },
    { label: 'Current Risk Score', value: `${riskScore}/100`, color: riskScore <= 30 ? '#00ffcc' : riskScore <= 55 ? '#FFB703' : riskScore <= 75 ? '#ff8c00' : '#E63946' },
    { label: 'Time Since Last Meal', value: latestLog ? getTimeSince(latestLog.lastMealTime) : '—', color: '#ff6ef7' },
    { label: 'Insulin Status', value: latestLog ? getInsulinStatus(latestLog.insulinTime) : '—', color: '#a97ff0' },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen page-transition relative">
      {/* Particles handled globally */}
      <Navbar />

      <main className="pt-20 pb-16 px-4 max-w-7xl mx-auto relative z-10">
        {/* Zone 1 — Risk Meter */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #a97ff0 0%, transparent 70%)' }} />
            <RiskGauge score={riskScore} size={300} />
          </div>
          <p className="text-foreground/40 text-xs font-body mt-3 tracking-widest uppercase">
            {latestLog ? 'Based on your last logged data' : 'No data logged yet'}
          </p>
          <button
            onClick={() => setLogModalOpen(true)}
            className="mt-4 px-8 py-2.5 rounded-full text-xs font-heading uppercase tracking-widest text-black font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #00ffcc, #a97ff0)', boxShadow: '0 0 24px #a97ff055' }}
          >
            Update My Status
          </button>
        </div>

        {/* Zone 2 — Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((m, i) => (
            <GlassTiltCard key={i} className="text-center group transition-all duration-300 hover:scale-[1.03]"
              style={{ borderTop: `2px solid ${m.color}22`, background: 'rgba(123,76,224,0.12)' }}>
              <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}44` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
              </div>
              <p className="text-foreground/40 text-[10px] font-heading uppercase tracking-wider mb-2">{m.label}</p>
              <p className="text-2xl font-heading font-bold" style={{ color: m.color, textShadow: `0 0 12px ${m.color}66` }}>{m.value}</p>
             
            </GlassTiltCard>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Zone 3 — Prediction Graph */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm">Glucose Prediction</h3>
              <div className="flex gap-1">
                {['1H', '3H', '6H', '24H'].map(t => (
                  <button key={t} onClick={() => setTimeRange(t)} className={`text-[10px] font-heading px-2 py-1 rounded-md transition-colors ${timeRange === t ? 'bg-primary/20 text-primary' : 'text-foreground/30 hover:text-foreground/60'}`}>{t}</button>
                ))}
              </div>
            </div>
            {latestLog ? (
              <Line
                data={{
                  labels: predData.labels,
                  datasets: [
                    { label: 'Actual', data: predData.actual, borderColor: '#00F5D4', backgroundColor: 'rgba(0,245,212,0.05)', fill: true, tension: 0.4, spanGaps: false, pointRadius: 2 },
                    { label: 'Predicted', data: predData.predicted, borderColor: '#FFB703', borderDash: [6, 4], backgroundColor: 'rgba(255,183,3,0.03)', fill: true, tension: 0.4, pointRadius: 0 },
                    { label: 'Upper bound', data: predData.upper, borderColor: 'transparent', backgroundColor: 'rgba(255,183,3,0.05)', fill: '+1', pointRadius: 0 },
                    { label: 'Lower bound', data: predData.lower, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, pointRadius: 0 },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(60,28,140,0.97)',
                      borderColor: 'rgba(169,127,240,0.3)',
                      borderWidth: 1,
                      titleFont: { family: 'Orbitron', size: 10 },
                      bodyFont: { family: 'DM Sans', size: 11 },
                      padding: 12,
                      callbacks: { afterBody: () => riskScore > 50 ? ['⚠ Elevated risk — insulin may still be active'] : ['✓ Glucose trajectory looks stable'] },
                    },
                  },
                  scales: {
                    x: { ticks: { color: 'rgba(169,127,240,0.5)', font: { family: 'DM Sans', size: 8 }, maxTicksLimit: 8 }, grid: { color: 'rgba(123,76,224,0.08)' } },
                    y: { min: 40, max: 180, ticks: { color: 'rgba(169,127,240,0.5)', font: { family: 'DM Sans', size: 9 } }, grid: { color: 'rgba(123,76,224,0.12)' } },
                  },
                }}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-foreground/30 text-sm font-body">
                Log your first session to see predictions.
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-[10px] text-foreground/30 font-body">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block" style={{ borderBottom: '1px dashed' }} /> Predicted</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block" /> Hypo threshold (70 mg/dL)</span>
            </div>
          </div>

          {/* Zone 4 — AI Insight Feed */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-sm mb-4">AI Insights</h3>
            {insights.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {insights.map(insight => (
                  <InsightCardComponent key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <p className="text-foreground/30 text-sm font-body">Log data to receive AI-generated insights.</p>
            )}
          </div>
        </div>
      </main>
{/* ── Floating Medication Icon ─────────────────────────────────────── */}
<button
  onClick={() => setShowMedPanel(true)}
  className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
  style={{ background: 'rgba(0,245,212,0.15)', border: '1px solid rgba(0,245,212,0.4)' }}
  title="My Medications"
>
  <span style={{ fontSize: 24 }}>💊</span>
  {(session?.medications?.length ?? 0) > 0 && (
    <span
      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-heading flex items-center justify-center"
      style={{ background: '#00f5d4', color: '#000' }}
    >
      {session.medications.length}
    </span>
  )}
</button>

{/* ── Medication Side Panel ─────────────────────────────────────────── */}
{showMedPanel && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
    onClick={() => setShowMedPanel(false)}
  >
    <div
      className="glass-card w-80 h-full p-6 overflow-y-auto rounded-none rounded-l-2xl"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-bold">My Medications 💊</h3>
        <button
          onClick={() => setShowMedPanel(false)}
          className="text-foreground/40 hover:text-foreground transition-colors text-xl"
        >✕</button>
      </div>

      {/* Meal Times Summary */}
      <div className="mb-6">
        <p className="text-xs text-primary font-heading tracking-widest uppercase mb-3">Meal Schedule</p>
        {[
          { label: '🌅 Breakfast', time: session?.mealTimes?.breakfast },
          { label: '☀️  Lunch',     time: session?.mealTimes?.lunch     },
          { label: '🌙 Dinner',    time: session?.mealTimes?.dinner    },
        ].map(({ label, time }) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-primary/10">
            <span className="text-sm font-body text-foreground/60">{label}</span>
            <span className="text-sm font-heading text-primary">{time ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Medications List */}
      {(session?.medications?.length ?? 0) > 0 ? (
        <div>
          <p className="text-xs text-primary font-heading tracking-widest uppercase mb-3">Medicines</p>
          {session.medications.map((med: any, i: number) => {
            const mealNames = ['Breakfast', 'Lunch', 'Dinner'];
            const activeMeals = med.schedule
              .split('-')
              .map((v: string, idx: number) => v === '1' ? mealNames[idx] : null)
              .filter(Boolean)
              .join(' & ');
            return (
              <div key={i} className="bg-muted/20 border border-primary/10 rounded-xl p-4 mb-3">
                <p className="font-heading text-sm text-foreground mb-1">{med.name}</p>
                <p className="text-xs text-foreground/40 font-body">📅 {activeMeals || 'No schedule set'}</p>
                <p className="text-xs text-foreground/40 font-body mt-1">
                  🕐 {med.timing === 'before' ? 'Before food' : 'After food'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-foreground/30 font-body text-center mt-8">
          No medications added
        </p>
      )}

      {/* Past Meal Choices */}
      {Object.keys(mealChoices).length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-primary font-heading tracking-widest uppercase mb-3">Today's Meal Log</p>
          {Object.entries(mealChoices).map(([meal, choice]) => (
            <div key={meal} className="flex justify-between items-center py-2 border-b border-primary/10">
              <span className="text-sm font-body text-foreground/60">{meal}</span>
              <span className={`text-xs font-heading px-2 py-1 rounded-full ${choice === 'yes' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {choice === 'yes' ? '✓ Had meal' : '✗ Skipped'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* ── Meal Time Popup Reminder ──────────────────────────────────────── */}
{mealPopup && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="glass-card p-8 w-full max-w-sm text-center">
      <div className="text-5xl mb-4">
        {mealPopup.meal === 'Breakfast' ? '🌅' : mealPopup.meal === 'Lunch' ? '☀️' : '🌙'}
      </div>
      <h3 className="font-heading text-xl font-bold mb-2">
        {mealPopup.meal} Time!
      </h3>
      <p className="text-foreground/50 text-sm font-body mb-6">
        It's {mealPopup.time}. Did you have your {mealPopup.meal.toLowerCase()}?
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setMealChoices(p => ({ ...p, [mealPopup.meal]: 'yes' }));
            setMealPopup(null);
          }}
          className="flex-1 py-3 rounded-xl font-heading text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'rgba(0,245,212,0.2)', border: '1px solid rgba(0,245,212,0.5)', color: '#00f5d4' }}
        >
          ✓ Yes I did
        </button>
        <button
          onClick={() => {
            setMealChoices(p => ({ ...p, [mealPopup.meal]: 'no' }));
            setMealPopup(null);
          }}
          className="flex-1 py-3 rounded-xl font-heading text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'rgba(229,57,70,0.15)', border: '1px solid rgba(229,57,70,0.4)', color: '#E63946' }}
        >
          ✗ Not yet
        </button>
      </div>

      {/* Medication reminder for this meal */}
      {(session?.medications ?? [])
        .filter((med: any) => {
          const idx = ['Breakfast', 'Lunch', 'Dinner'].indexOf(mealPopup.meal);
          return idx !== -1 && med.schedule.split('-')[idx] === '1';
        })
        .map((med: any, i: number) => (
          <div key={i} className="mt-4 p-3 rounded-xl text-left"
            style={{ background: 'rgba(169,127,240,0.1)', border: '1px solid rgba(169,127,240,0.2)' }}>
            <p className="text-xs font-heading text-purple-300">
              💊 Remember: Take <strong>{med.name}</strong> {med.timing} your meal
            </p>
          </div>
        ))
      }
    </div>
  </div>
)}
      <StatusBar />
      <QuickLogModal open={logModalOpen} onClose={() => { setLogModalOpen(false); setRefresh(r => r + 1); }} />
    </div>
  );
}

function InsightCardComponent({ insight }: { insight: { severity: string; text: string; explanation: string; action: string } }) {
  const [expanded, setExpanded] = useState(false);
  const colorMap: Record<string, string> = { safe: '#00ffcc', caution: '#FFB703', high: '#ff8c00', critical: '#E63946' };
  const color = colorMap[insight.severity] || '#a97ff0';

  return (
    <div
      className="p-3 text-sm rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(123,76,224,0.15)',
        border: `1px solid ${color}28`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <div className="flex-1">
          <p className="text-foreground/85 font-body text-xs leading-relaxed">{insight.text}</p>
          {expanded && (
            <div className="mt-2 text-[11px] text-foreground/50 font-body space-y-1 border-t border-white/5 pt-2">
              <p>{insight.explanation}</p>
              <p style={{ color }} className="font-semibold">→ {insight.action}</p>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] mt-1.5 hover:underline font-body"
            style={{ color }}
          >
            {expanded ? 'Show less ↑' : 'Learn more ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
