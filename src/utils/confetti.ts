// Lightweight, smooth canvas-based confetti engine with zero external dependencies

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export function fireConfetti(durationMs: number = 2500) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = [
    '#6750a4', // M3 Primary
    '#d0bcff', // M3 Light Primary
    '#006874', // M3 Secondary
    '#ffb1c8', // M3 Tertiary
    '#ffd700', // Gold
    '#38d39f', // Emerald
    '#ff6b6b', // Coral
  ];

  const particles: Particle[] = [];
  const count = Math.min(80, Math.floor(width / 15)); // Low-end device friendly cap

  for (let i = 0; i < count; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 120,
      y: height * 0.45 + (Math.random() - 0.5) * 60,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -18 - 4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }

  const startTime = performance.now();
  let animationFrame: number;

  function render(time: number) {
    const elapsed = time - startTime;
    if (elapsed > durationMs) {
      cancelAnimationFrame(animationFrame);
      canvas.remove();
      return;
    }

    ctx?.clearRect(0, 0, width, height);
    const progress = elapsed / durationMs;
    const fadeOutProgress = progress > 0.7 ? (progress - 0.7) / 0.3 : 0;

    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.45; // gravity
      p.vx *= 0.98; // drag
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - fadeOutProgress);

      if (!ctx) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      ctx.restore();
    }

    animationFrame = requestAnimationFrame(render);
  }

  animationFrame = requestAnimationFrame(render);
}
