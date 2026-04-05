import { Link } from "react-router-dom";
import { getLatestLog, getRiskLevel, getRiskLabel } from "@/lib/glucosense";

export default function StatusBar() {
  const log = getLatestLog();
  if (!log) return null;

  const level = getRiskLevel(log.riskScore);
  const colorMap: Record<string, string> = { safe: '#06D6A0', caution: '#FFB703', elevated: '#ff8c00', critical: '#E63946' };
  const color = colorMap[level];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 status-bar py-2 px-4 flex items-center justify-center gap-3 text-sm font-body">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-foreground/70">
        Risk: <strong style={{ color }}>{getRiskLabel(level)}</strong> ({log.riskScore}/100)
      </span>
      <Link to="/predictor" className="text-primary text-xs hover:underline ml-2">Update Status →</Link>
    </div>
  );
}
