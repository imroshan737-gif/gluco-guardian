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

  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const session = getSession();
  const latestLog = getLatestLog();
  const riskScore = latestLog?.riskScore ?? 0;
  const riskLevel = getRiskLevel(riskScore);

  // Prediction chart data
  const glucose = latestLog?.glucoseReading ?? 110;
  const predData = generatePredictionData(glucose, riskScore);

  // Insights
  const insights = latestLog?.insights ?? [];

  const metricCards = [
    { label: 'Last Logged Glucose', value: latestLog?.glucoseReading ? `${latestLog.glucoseReading} mg/dL` : '—', color: '#00F5D4' },
    { label: 'Current Risk Score', value: `${riskScore}/100`, color: riskScore <= 30 ? '#06D6A0' : riskScore <= 55 ? '#FFB703' : riskScore <= 75 ? '#ff8c00' : '#E63946' },
    { label: 'Time Since Last Meal', value: latestLog ? getTimeSince(latestLog.lastMealTime) : '—', color: '#FFB703' },
    { label: 'Insulin Status', value: latestLog ? getInsulinStatus(latestLog.insulinTime) : '—', color: '#00F5D4' },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen page-transition relative">
      <ParticlesBackground />
      <Navbar />

      <main className="pt-20 pb-16 px-4 max-w-7xl mx-auto relative z-10">
        {/* Zone 1 — Risk Meter */}
        <div className="text-center mb-8">
          <RiskGauge score={riskScore} size={280} />
          <p className="text-foreground/40 text-xs font-body mt-2">
            {latestLog ? 'Based on your last logged data' : 'No data logged yet'}
          </p>
          <button onClick={() => setLogModalOpen(true)} className="btn-primary-glow px-6 py-2 rounded-xl text-xs mt-3">
            Update My Status
          </button>
        </div>

        {/* Zone 2 — Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((m, i) => (
            <GlassTiltCard key={i} className="text-center">
              <p className="text-foreground/40 text-[10px] font-heading uppercase tracking-wider mb-2">{m.label}</p>
              <p className="text-2xl font-heading font-bold" style={{ color: m.color }}>{m.value}</p>
              {/* Mini sparkline */}
              <svg width="60" height="20" className="mx-auto mt-2 opacity-30">
                <polyline points="0,15 10,10 20,12 30,5 40,8 50,3 60,7" fill="none" stroke={m.color} strokeWidth="1.5" />
              </svg>
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
                      backgroundColor: 'rgba(2,11,24,0.95)',
                      titleFont: { family: 'Orbitron', size: 10 },
                      bodyFont: { family: 'DM Sans', size: 11 },
                      callbacks: { afterBody: () => riskScore > 50 ? ['⚠ Elevated risk — insulin may still be active'] : ['✓ Glucose trajectory looks stable'] },
                    },
                  },
                  scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'DM Sans', size: 8 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.03)' } },
                    y: { min: 40, max: 180, ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'DM Sans', size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
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

      <StatusBar />
      <QuickLogModal open={logModalOpen} onClose={() => { setLogModalOpen(false); setRefresh(r => r + 1); }} />
    </div>
  );
}

function InsightCardComponent({ insight }: { insight: { severity: string; text: string; explanation: string; action: string } }) {
  const [expanded, setExpanded] = useState(false);
  const colorMap: Record<string, string> = { safe: '#06D6A0', caution: '#FFB703', high: '#ff8c00', critical: '#E63946' };
  const color = colorMap[insight.severity] || '#00F5D4';

  return (
    <div className="glass-card p-3 text-sm">
      <div className="flex items-start gap-2">
        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <div className="flex-1">
          <p className="text-foreground/80 font-body text-xs">{insight.text}</p>
          {expanded && (
            <div className="mt-2 text-[11px] text-foreground/50 font-body space-y-1">
              <p>{insight.explanation}</p>
              <p className="text-primary">→ {insight.action}</p>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary mt-1 hover:underline font-body">
            {expanded ? 'Show less' : 'Learn More'}
          </button>
        </div>
      </div>
    </div>
  );
}
