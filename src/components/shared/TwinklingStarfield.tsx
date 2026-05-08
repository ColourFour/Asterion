import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  phase: number;
  freq: number;
  size: number;
}

const TWO_PI = Math.PI * 2;

function randomGenerator(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function range(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function buildStars(width: number, height: number): Star[] {
  const random = randomGenerator(Math.round(width * 31 + height * 17));
  const starCount = Math.max(180, Math.min(360, Math.round((width * height) / 9200)));

  return Array.from({ length: starCount }, () => ({
    x: range(random, -200, width + 200),
    y: range(random, -200, height + 200),
    phase: range(random, 0, TWO_PI),
    freq: (TWO_PI / 1000) * range(random, 0.1, 1),
    size: range(random, 0.75, 2.7),
  }));
}

export function TwinklingStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return undefined;

    const context = canvasElement.getContext('2d');
    if (!context) return undefined;
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;
    let stars: Star[] = [];
    let width = 0;
    let height = 0;

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stars = buildStars(width, height);
    }

    function draw(timestamp: number) {
      ctx.fillStyle = 'rgb(0, 0, 12)';
      ctx.fillRect(0, 0, width, height);

      const driftX = reducedMotion ? 0 : Math.sin(timestamp / 18000) * 16;
      const driftY = reducedMotion ? 0 : Math.cos(timestamp / 22000) * 10;

      for (const star of stars) {
        const alpha = reducedMotion
          ? 0.62
          : ((Math.sin(timestamp * star.freq + star.phase) + 1) / 2) * 0.7 + 0.3;
        ctx.beginPath();
        ctx.arc(star.x + driftX, star.y + driftY, star.size, 0, TWO_PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    resize();
    draw(performance.now());

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas className="twinkling-starfield" ref={canvasRef} aria-hidden="true" />;
}
