"use client";

import { useState } from "react";

type Particle = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
};

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    left: (i * 137.5) % 100,
    delay: (i * 1.7) % 12,
    duration: 10 + ((i * 3.3) % 9),
    drift: ((i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6)),
    size: 2 + (i % 3),
  }));
}

export default function AmbientParticles() {
  const [particles] = useState(() => makeParticles(14));

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
