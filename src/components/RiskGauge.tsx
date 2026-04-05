import { useEffect, useState } from "react";

interface Props {
  score: number;
  size?: number;
}

export default function RiskGauge({ score, size = 240 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = animatedScore;
    const diff = score - start;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + diff * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const angle = -90 + (animatedScore / 100) * 180;
  const r = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;

  const getColor = (s: number) => {
    if (s <= 30) return '#06D6A0';
    if (s <= 55) return '#FFB703';
    if (s <= 75) return '#ff8c00';
    return '#E63946';
  };

  const getLabel = (s: number) => {
    if (s <= 30) return 'SAFE';
    if (s <= 55) return 'CAUTION';
    if (s <= 75) return 'HIGH RISK';
    return 'CRITICAL';
  };

  const color = getColor(animatedScore);

  // Arc path
  const startAngle = -180;
  const endAngle = 0;
  const arcStart = { x: cx + r * Math.cos((startAngle * Math.PI) / 180), y: cy + r * Math.sin((startAngle * Math.PI) / 180) };
  const arcEnd = { x: cx + r * Math.cos((endAngle * Math.PI) / 180), y: cy + r * Math.sin((endAngle * Math.PI) / 180) };

  // Filled arc
  const fillAngle = startAngle + (animatedScore / 100) * (endAngle - startAngle);
  const fillEnd = { x: cx + r * Math.cos((fillAngle * Math.PI) / 180), y: cy + r * Math.sin((fillAngle * Math.PI) / 180) };
  const largeArc = fillAngle - startAngle > 180 ? 1 : 0;

  // Needle
  const needleAngle = (angle * Math.PI) / 180;
  const needleLen = r - 15;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx={cx} cy={cy} r="6" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        {/* Score text */}
        <text x={cx} y={cy - 15} textAnchor="middle" className="font-heading" fill={color} fontSize="32" fontWeight="700" fontFamily="Orbitron">{animatedScore}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="DM Sans">/ 100</text>
      </svg>
      <span className="font-heading text-sm tracking-widest mt-1" style={{ color }}>{getLabel(animatedScore)}</span>
    </div>
  );
}
