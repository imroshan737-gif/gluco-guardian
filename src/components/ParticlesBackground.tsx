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
      color: { value: ["#a97ff0", "#00ffcc", "#ff6ef7"] },
      links: { color: "#a97ff0", distance: 150, enable: true, opacity: 0.2, width: 0.8 },
      move: { enable: true, speed: 0.6, direction: "none" as const, outModes: { default: "bounce" as const } },
      number: { value: 70, density: { enable: true } },
      opacity: { value: { min: 0.2, max: 0.5 } },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2.5 } },
    },
    detectRetina: true,
  }), []);

  if (!init) return null;

  return (
    <Particles
      className="absolute inset-0 -z-10"
      options={options}
    />
  );
}
