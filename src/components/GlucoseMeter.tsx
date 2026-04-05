import { useEffect, useRef } from "react";

export default function GlucoseMeter() {
  const needleRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    let angle = -30;
    let dir = 1;
    const interval = setInterval(() => {
      angle += dir * (0.5 + Math.random() * 0.5);
      if (angle > 30) dir = -1;
      if (angle < -30) dir = 1;
      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${angle} 100 110)`);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg width="260" height="200" viewBox="0 0 200 160" className="drop-shadow-2xl">
      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06D6A0" />
          <stop offset="40%" stopColor="#FFB703" />
          <stop offset="70%" stopColor="#ff8c00" />
          <stop offset="100%" stopColor="#E63946" />
        </linearGradient>
      </defs>

      {/* Meter body */}
      <rect x="20" y="20" width="160" height="120" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(0,245,212,0.2)" strokeWidth="1" />

      {/* Arc */}
      <path d="M 40 110 A 60 60 0 0 1 160 110" fill="none" stroke="url(#arcGrad)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)" />

      {/* Tick marks */}
      {[-60, -30, 0, 30, 60].map((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        const x1 = 100 + 52 * Math.cos(rad);
        const y1 = 110 + 52 * Math.sin(rad);
        const x2 = 100 + 62 * Math.cos(rad);
        const y2 = 110 + 62 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />;
      })}

      {/* Labels */}
      <text x="35" y="118" fill="#06D6A0" fontSize="7" fontFamily="DM Sans">Low</text>
      <text x="92" y="55" fill="#FFB703" fontSize="7" fontFamily="DM Sans">Normal</text>
      <text x="152" y="118" fill="#E63946" fontSize="7" fontFamily="DM Sans">High</text>

      {/* Needle */}
      <line ref={needleRef} x1="100" y1="110" x2="100" y2="60" stroke="#00F5D4" strokeWidth="2" strokeLinecap="round" filter="url(#glow)" />
      <circle cx="100" cy="110" r="4" fill="#00F5D4" filter="url(#glow)" />

      {/* Label */}
      <text x="100" y="140" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Orbitron">GLUCOSE MONITOR</text>
    </svg>
  );
}
