import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import GlassTiltCard from "@/components/GlassTiltCard";
import { getSession, getLogs, getRiskLabel, getTimelineSummary } from "@/lib/glucosense";

export default function Timeline() {
  const navigate = useNavigate();
  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const [filter, setFilter] = useState('all');
  const logs = getLogs();
  const summary = getTimelineSummary(logs);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'high') return l.riskScore > 55;
    if (filter === 'caution') return l.riskScore > 30 && l.riskScore <= 55;
    if (filter === 'safe') return l.riskScore <= 30;
    return true;
  });

  const handleDownload = () => {
    const text = logs.map(l =>
      `Date: ${new Date(l.timestamp).toLocaleString()}\nRisk: ${l.riskScore}/100 (${getRiskLabel(l.riskLevel)})\nGlucose: ${l.glucoseReading ?? 'N/A'} mg/dL\nMeal: ${l.mealType}\nInsulin: ${l.insulinDose}u\nInsights: ${l.insights.map(i => i.text).join('; ')}\n${'─'.repeat(40)}`
    ).join('\n\n');

    const blob = new Blob([`GlucoSense AI — Health Timeline Report\nGenerated: ${new Date().toLocaleString()}\n${'═'.repeat(40)}\n\n${text || 'No sessions logged.'}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glucosense-timeline.txt';
    a.click();
  };

  const colorMap: Record<string, string> = { safe: '#06D6A0', caution: '#FFB703', elevated: '#ff8c00', critical: '#E63946' };

  return (
    <div className="min-h-screen page-transition">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="font-heading text-2xl mb-8 text-center">Health <span className="text-primary">Timeline</span></h1>

        {logs.length > 0 ? (
          <>
            {/* AI Summary */}
            <GlassTiltCard className="mb-8 border-primary/30">
              <h3 className="font-heading text-xs text-primary mb-3">🧠 AI PATTERN ANALYSIS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div><p className="text-lg font-heading text-primary">{summary.mostCommonRiskTime}</p><p className="text-[10px] text-foreground/40 font-body">Most Common Risk Time</p></div>
                <div><p className="text-lg font-heading text-warning">{summary.avgRiskScore}</p><p className="text-[10px] text-foreground/40 font-body">Average Risk Score</p></div>
                <div><p className="text-lg font-heading text-destructive">{summary.highRiskCount}</p><p className="text-[10px] text-foreground/40 font-body">High-Risk Events</p></div>
                <div><p className="text-lg font-heading text-safe">{logs.length}</p><p className="text-[10px] text-foreground/40 font-body">Total Sessions</p></div>
              </div>
              <p className="text-xs text-foreground/50 font-body">{summary.pattern}</p>
            </GlassTiltCard>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all', 'high', 'caution', 'safe'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`text-xs font-heading px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-primary/20 text-primary' : 'glass-card text-foreground/40'}`}>
                  {f === 'all' ? 'All' : f === 'high' ? 'High Risk' : f === 'caution' ? 'Caution' : 'Safe'}
                </button>
              ))}
              <button onClick={handleDownload} className="ml-auto text-xs font-heading px-3 py-1.5 rounded-lg glass-card text-foreground/40 hover:text-primary transition-colors">
                📥 Download Report
              </button>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 border-l border-primary/20">
              {filteredLogs.map((log, i) => (
                <div key={log.id} className="mb-6 relative">
                  <div className="absolute -left-[30px] top-2 w-3 h-3 rounded-full border-2 border-background" style={{ background: colorMap[log.riskLevel] || '#00F5D4', boxShadow: `0 0 8px ${colorMap[log.riskLevel]}` }} />
                  <div className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-foreground/40 font-body">{new Date(log.timestamp).toLocaleString()}</p>
                        <span className={`inline-block mt-1 text-[10px] font-heading px-2 py-0.5 rounded-full ${log.riskLevel === 'safe' ? 'risk-badge-safe' : log.riskLevel === 'caution' ? 'risk-badge-caution' : log.riskLevel === 'elevated' ? 'risk-badge-high' : 'risk-badge-critical'}`}>
                          {getRiskLabel(log.riskLevel)} — {log.riskScore}/100
                        </span>
                      </div>
                      {log.glucoseReading && <span className="text-primary font-heading text-sm">{log.glucoseReading} <span className="text-[10px] text-foreground/40">mg/dL</span></span>}
                    </div>
                    <div className="text-[11px] text-foreground/40 font-body flex flex-wrap gap-3">
                      <span>Meal: {log.mealType}</span>
                      <span>Insulin: {log.insulinDose}u</span>
                      <span>Sleep: {log.sleepHours}h</span>
                    </div>
                    {log.insights[0] && (
                      <p className="text-[11px] text-foreground/60 font-body mt-2 italic">💡 {log.insights[0].text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="font-heading text-lg mb-2">No Sessions Logged Yet</h3>
            <p className="text-foreground/40 font-body text-sm mb-6">Start logging your health data to see your timeline.</p>
            <Link to="/predictor" className="btn-primary-glow px-6 py-2 rounded-xl text-sm inline-block">Log Your First Session</Link>
          </div>
        )}
      </main>
      <StatusBar />
    </div>
  );
}
