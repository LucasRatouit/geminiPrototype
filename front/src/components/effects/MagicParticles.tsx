import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function generateParticles(): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < 22; i++) {
    arr.push({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      duration: 8 + Math.random() * 14,
      delay: Math.random() * 12,
      drift: -40 + Math.random() * 80,
      opacity: 0.15 + Math.random() * 0.45,
    });
  }
  return arr;
}

export function MagicParticles() {
  const [visible, setVisible] = useState(true);
  const [particles] = useState<Particle[]>(generateParticles);

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-5px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(201, 162, 39, ${p.opacity}), transparent)`,
            boxShadow: `0 0 ${p.size * 2}px rgba(201, 162, 39, ${p.opacity * 0.5})`,
            animation: `floatUp ${p.duration}s ease-in-out ${p.delay}s infinite`,
            ["--particle-drift" as string]: `${p.drift}px`,
            ["--particle-opacity" as string]: `${p.opacity}`,
          }}
        />
      ))}
    </div>
  );
}