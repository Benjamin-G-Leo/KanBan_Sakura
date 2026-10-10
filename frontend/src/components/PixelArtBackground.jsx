import { useEffect, useRef, useState } from 'react';

const PETAL_COUNT = 36;
const PETAL_SIZE = 4;

function createPetal(width, height, startInView = true) {
  return {
    x: Math.random() * width,
    y: startInView ? Math.random() * height : -PETAL_SIZE,
    drift: 0.45 + Math.random() * 0.65,
    fall: 0.35 + Math.random() * 0.55,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.012 + Math.random() * 0.012,
    color: ['#f472b6', '#f9a8d4', '#fbcfe8', '#ec4899'][Math.floor(Math.random() * 4)],
    opacity: 0.55 + Math.random() * 0.35,
    size: PETAL_SIZE + (Math.random() > 0.8 ? 1 : 0),
  };
}

function drawLandscape(ctx, width, height, theme, time) {
  const dark = theme === 'dark';
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, dark ? '#10182a' : '#fce7f3');
  sky.addColorStop(0.56, dark ? '#26334c' : '#fbcfe8');
  sky.addColorStop(1, dark ? '#172d42' : '#bfdbfe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const block = Math.max(8, Math.round(width / 90));
  const horizon = height * 0.54;
  ctx.fillStyle = dark ? '#26364a' : '#94a3b8';
  for (let x = 0; x < width; x += block * 2) {
    const peak = horizon - (Math.sin(x * 0.009) * 0.045 + 0.08) * height;
    ctx.fillRect(x, peak, block * 3, height - peak);
  }

  const riverTop = height * 0.63;
  ctx.fillStyle = dark ? '#23485a' : '#7dd3fc';
  ctx.fillRect(0, riverTop, width, height - riverTop);
  ctx.fillStyle = dark ? 'rgba(115, 190, 205, 0.24)' : 'rgba(255, 255, 255, 0.38)';
  for (let row = 0; row < 9; row += 1) {
    const y = riverTop + row * ((height - riverTop) / 9) + block;
    const offset = (time * (0.018 + row * 0.002) + row * block * 3) % (block * 12);
    for (let x = -block * 12 + offset; x < width; x += block * 12) {
      ctx.fillRect(x, y, block * (2 + (row % 3)), Math.max(2, block / 3));
    }
  }

  const treeX = width * 0.78;
  const trunkTop = height * 0.19;
  ctx.fillStyle = dark ? '#423246' : '#783f55';
  ctx.fillRect(treeX, trunkTop + height * 0.16, block * 2, height * 0.35);
  ctx.fillRect(treeX - block * 4, trunkTop + height * 0.38, block * 5, block * 2);
  ctx.fillRect(treeX + block, trunkTop + height * 0.27, block * 5, block * 2);

  const blossoms = dark
    ? ['#9d4b78', '#c45b91', '#e883b2', '#f6b5cf']
    : ['#be185d', '#db2777', '#ec4899', '#f9a8d4'];
  const canopy = [
    [-6, 2], [-5, 0], [-4, -2], [-3, 1], [-2, -3], [-1, -1], [0, -4],
    [1, -2], [2, -4], [3, -2], [4, -1], [5, 1], [6, 3],
    [-5, 3], [-4, 4], [-3, 2], [-2, 0], [-1, 2], [0, 0],
    [1, 1], [2, -1], [3, 1], [4, 3], [5, 4], [-2, 4], [2, 3],
  ];
  canopy.forEach(([column, row], index) => {
    ctx.fillStyle = blossoms[(index + Math.floor(time / 1500)) % blossoms.length];
    ctx.fillRect(treeX + column * block, trunkTop + row * block, block * 3, block * 2);
  });

  ctx.fillStyle = dark ? 'rgba(17, 35, 46, 0.65)' : 'rgba(71, 108, 128, 0.28)';
  ctx.fillRect(0, riverTop - block, width, block * 2);
}

export function PixelArtBackground() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark',
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateTheme = () => setTheme(root.getAttribute('data-theme') || 'dark');
    const updateMotion = (event) => setReducedMotion(event.matches);

    root.addEventListener('themechange', updateTheme);
    mediaQuery.addEventListener('change', updateMotion);
    return () => {
      root.removeEventListener('themechange', updateTheme);
      mediaQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let petals = [];
    let lastFrame = 0;

    const render = (timestamp = 0) => {
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 40) : 16;
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);
      drawLandscape(ctx, width, height, theme, timestamp);

      petals.forEach((petal) => {
        if (!reducedMotion) {
          petal.sway += petal.swaySpeed * elapsed;
          petal.x -= (petal.drift + Math.sin(petal.sway) * 0.22) * elapsed * 0.06;
          petal.y += petal.fall * elapsed * 0.06;
          if (petal.y > height + petal.size || petal.x < -petal.size) {
            Object.assign(petal, createPetal(width, height, false), {
              x: Math.random() * width + width * 0.08,
            });
          }
        }

        ctx.globalAlpha = petal.opacity;
        ctx.fillStyle = petal.color;
        ctx.fillRect(Math.round(petal.x), Math.round(petal.y), petal.size, petal.size);
      });
      ctx.globalAlpha = 1;

      if (!reducedMotion) frameRef.current = requestAnimationFrame(render);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      petals = Array.from({ length: PETAL_COUNT }, () => createPetal(width, height));
      lastFrame = 0;
      if (reducedMotion) render();
    };

    resize();
    if (!reducedMotion) frameRef.current = requestAnimationFrame(render);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion, theme]);

  return (
    <div className="pixel-art-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default PixelArtBackground;
