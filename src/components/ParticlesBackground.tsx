import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" },
      },
      modes: {
        grab: { distance: 180, links: { opacity: 0.5 } },
      },
    },
    particles: {
      color: { value: ["#00f5d4", "#a97ff0", "#00ffcc", "#ff6ef7"] },
      links: { color: "#00f5d4", distance: 160, enable: true, opacity: 0.15, width: 0.6 },
      move: { enable: true, speed: 0.5, direction: "none" as const, outModes: { default: "bounce" as const } },
      number: { value: 50, density: { enable: true } },
      opacity: { value: { min: 0.15, max: 0.4 } },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2.5 } },
    },
    detectRetina: true,
  }), []);

  if (!init) return null;

  return (
    <Particles
      className="absolute inset-0"
      options={options}
    />
  );
}
