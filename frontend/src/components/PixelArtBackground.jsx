import { useEffect, useRef } from 'react';

const PETAL_COUNT = 48;
const STAR_COUNT = 96;
const CLOUD_COUNT = 6;
const THEME_TRANSITION_MS = 900;

const LIGHT_BLOSSOMS = ['#d44c82', '#f06f9b', '#ff8da1', '#ffb7c5'];
const DARK_BLOSSOMS = ['#8f4778', '#bd5a91', '#e483ad', '#f3b1ca'];

function createPetal(width, height, startInView = true) {
  return {
    x: Math.random() * width,
    y: startInView ? Math.random() * height : -5,
    drift: 0.45 + Math.random() * 0.65,
    fall: 0.35 + Math.random() * 0.55,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.012 + Math.random() * 0.012,
    opacity: 0.55 + Math.random() * 0.35,
    size: 4 + (Math.random() > 0.8 ? 1 : 0),
  };
}

function createStars() {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random() * 0.57,
    size: Math.random() > 0.84 ? 3 : 2,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0008 + Math.random() * 0.0018,
  }));
}

function createClouds() {
  return Array.from({ length: CLOUD_COUNT }, (_, index) => ({
    x: index / CLOUD_COUNT + Math.random() * 0.12,
    y: 0.12 + Math.random() * 0.27,
    scale: 0.75 + Math.random() * 0.65,
    speed: 0.000008 + Math.random() * 0.00001,
  }));
}

function drawTree(ctx, width, height, block, tree, theme, time, index) {
  const dark = theme === 'dark';
  const unit = block * tree.scale;
  const centerX = tree.x * width;
  const baseY = height * tree.base;
  const topY = baseY - height * tree.scale * 0.55;
  const trunk = dark ? ['#302c43', '#373044', '#403149'][index] : ['#704650', '#83505b', '#694451'][index];
  const branch = dark ? '#44354b' : '#925766';
  const blossoms = dark ? DARK_BLOSSOMS : LIGHT_BLOSSOMS;

  ctx.fillStyle = trunk;
  ctx.fillRect(centerX - unit, topY + unit * 8, unit * 3, baseY - topY - unit * 8);
  ctx.fillRect(centerX - unit * 3, baseY - unit * 5, unit * 7, unit * 5);

  const branches = [
    [[0, 11], [-1, 9], [-3, 8], [-5, 6], [-7, 5]],
    [[0, 10], [1, 8], [3, 7], [5, 5], [7, 4]],
    [[0, 7], [-1, 5], [-2, 3], [-4, 2], [-5, 0]],
    [[1, 8], [2, 6], [4, 5], [5, 3], [7, 2]],
    [[-1, 9], [-2, 7], [-4, 6], [-5, 4], [-7, 3]],
  ];

  branches.forEach((points, branchIndex) => {
    ctx.fillStyle = branchIndex % 2 === 0 ? trunk : branch;
    points.slice(1).forEach(([column, row], pointIndex) => {
      const [previousColumn, previousRow] = points[pointIndex];
      const x1 = centerX + previousColumn * unit;
      const y1 = topY + previousRow * unit;
      const x2 = centerX + column * unit;
      const y2 = topY + row * unit;
      const thickness = Math.max(unit * (branchIndex < 2 ? 2.2 : 1.6), 2);
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + thickness, Math.abs(y2 - y1) + thickness);
    });
  });

  const clusters = [
    [-8, 4], [-7, 2], [-6, 6], [-5, 0], [-4, 3], [-3, 6], [-2, 1], [-1, -1],
    [0, 2], [1, -2], [2, 1], [3, 4], [4, -1], [5, 2], [6, 0], [7, 3],
    [-6, 8], [-3, 8], [1, 6], [4, 7],
  ];

  clusters.forEach(([column, row], clusterIndex) => {
    const x = centerX + column * unit;
    const y = topY + row * unit;
    const size = unit * (clusterIndex % 4 === 0 ? 3.4 : 2.6);
    ctx.fillStyle = blossoms[(clusterIndex + Math.floor(time / 1800) + index) % blossoms.length];
    ctx.fillRect(x, y, size, unit * 1.8);
    ctx.fillRect(x + unit * 0.7, y - unit, size * 0.65, unit);
    ctx.fillRect(x + unit * 1.4, y + unit * 1.8, size * 0.6, unit);
  });
}

function drawSun(ctx, width, height, block) {
  const x = width * 0.82;
  const y = height * 0.15;
  const size = block * 5;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 202, 119, 0.18)';
  ctx.fillRect(x - size * 1.7, y - size * 1.7, size * 4.4, size * 4.4);
  ctx.fillStyle = 'rgba(255, 202, 119, 0.32)';
  ctx.fillRect(x - size * 1.15, y - size * 1.15, size * 3.3, size * 3.3);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#fff1b8';
  ctx.fillRect(x + block, y + block, size - block * 2, size - block * 2);
  ctx.fillStyle = 'rgba(255, 239, 177, 0.85)';
  ctx.fillRect(x + size * 0.35, y - size * 0.8, size * 0.3, size * 0.5);
  ctx.fillRect(x + size * 0.35, y + size * 1.3, size * 0.3, size * 0.5);
  ctx.fillRect(x - size * 0.8, y + size * 0.35, size * 0.5, size * 0.3);
  ctx.fillRect(x + size * 1.3, y + size * 0.35, size * 0.5, size * 0.3);
  ctx.restore();
}

function drawMoon(ctx, width, height, block) {
  const x = width * 0.82;
  const y = height * 0.15;
  const size = block * 5;

  ctx.save();
  ctx.shadowColor = 'rgba(190, 213, 255, 0.9)';
  ctx.shadowBlur = size * 3;
  ctx.fillStyle = 'rgba(189, 211, 255, 0.24)';
  ctx.fillRect(x - size, y - size, size * 3, size * 3);
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#f8f5e8';
  ctx.fillRect(x + block, y + block, size - block * 2, size - block * 2);
  ctx.fillStyle = '#111a2e';
  ctx.fillRect(x + size * 0.52, y - block, size * 0.9, size * 0.9);
  ctx.fillRect(x + size * 0.62, y + size * 0.2, size * 0.9, size * 0.9);
  ctx.restore();
}

function drawCloud(ctx, cloud, width, height, block, time) {
  const x = ((cloud.x + time * cloud.speed) % 1.2 - 0.1) * width;
  const y = cloud.y * height;
  const unit = block * cloud.scale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
  ctx.fillRect(x, y + unit * 2, unit * 10, unit * 2);
  ctx.fillRect(x + unit * 2, y + unit, unit * 6, unit * 3);
  ctx.fillRect(x + unit * 4, y, unit * 3, unit * 3);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.72)';
  ctx.fillRect(x + unit, y + unit * 3, unit * 8, unit);
}

function drawLandscape(ctx, width, height, theme, time, stars, clouds) {
  const dark = theme === 'dark';
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, dark ? '#080f20' : '#7dd3fc');
  sky.addColorStop(0.42, dark ? '#1c2942' : '#bfdbfe');
  sky.addColorStop(0.72, dark ? '#38405a' : '#fce7f3');
  sky.addColorStop(1, dark ? '#172d42' : '#bfdbfe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const block = Math.max(6, Math.round(width / 120));
  if (dark) {
    const sceneAlpha = ctx.globalAlpha;
    stars.forEach((star) => {
      const twinkle = 0.32 + (Math.sin(time * star.speed + star.phase) + 1) * 0.32;
      ctx.globalAlpha = sceneAlpha * twinkle;
      ctx.fillStyle = star.size > 2 ? '#d9e8ff' : '#ffffff';
      ctx.fillRect(Math.round(star.x * width), Math.round(star.y * height), star.size, star.size);
    });
    ctx.globalAlpha = sceneAlpha;
    drawMoon(ctx, width, height, block);
  } else {
    drawSun(ctx, width, height, block);
    clouds.forEach((cloud) => drawCloud(ctx, cloud, width, height, block, time));
  }

  const horizon = height * 0.57;
  ctx.fillStyle = dark ? '#26364a' : '#94a3b8';
  for (let x = 0; x < width; x += block * 2) {
    const peak = horizon - (Math.sin(x * 0.009) * 0.045 + 0.08) * height;
    ctx.fillRect(x, peak, block * 3, height - peak);
  }

  const riverTop = height * 0.68;
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

  const trees = [
    { x: 0.12, base: 0.73, scale: 0.72 },
    { x: 0.52, base: 0.75, scale: 0.56 },
    { x: 0.91, base: 0.73, scale: 0.84 },
  ];
  trees.forEach((tree, index) => drawTree(ctx, width, height, block, tree, theme, time, index));

  ctx.fillStyle = dark ? 'rgba(17, 35, 46, 0.65)' : 'rgba(71, 108, 128, 0.28)';
  ctx.fillRect(0, riverTop - block, width, block * 2);
}

function mixColor(from, to, progress) {
  const parse = (color) => color.match(/\w\w/g).map((part) => Number.parseInt(part, 16));
  const fromRgb = parse(from.slice(1));
  const toRgb = parse(to.slice(1));
  const channels = fromRgb.map((channel, index) => (
    Math.round(channel + (toRgb[index] - channel) * progress)
  ));
  return `rgb(${channels.join(',')})`;
}

export function PixelArtBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let petals = [];
    const stars = createStars();
    const clouds = createClouds();
    let lastFrame = 0;
    let frameId = null;
    let reducedMotion = mediaQuery.matches;
    let targetTheme = root.getAttribute('data-theme') || 'dark';
    let previousTheme = targetTheme;
    let transitionStart = 0;

    const render = (timestamp = 0) => {
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 40) : 16;
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);

      const progress = transitionStart
        ? Math.min((timestamp - transitionStart) / THEME_TRANSITION_MS, 1)
        : 1;
      drawLandscape(ctx, width, height, previousTheme, timestamp, stars, clouds);
      if (progress < 1) {
        ctx.save();
        ctx.globalAlpha = progress;
        drawLandscape(ctx, width, height, targetTheme, timestamp, stars, clouds);
        ctx.restore();
      } else {
        previousTheme = targetTheme;
        transitionStart = 0;
      }

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

        const lightColor = petal.size > 4 ? '#ff8da1' : '#ffb7c5';
        const darkColor = petal.size > 4 ? '#ff4fa3' : '#f472b6';
        const colorForTheme = (theme) => (theme === 'dark' ? darkColor : lightColor);
        ctx.save();
        ctx.globalAlpha = petal.opacity;
        ctx.fillStyle = mixColor(colorForTheme(previousTheme), colorForTheme(targetTheme), progress);
        if (targetTheme === 'dark' || previousTheme === 'dark') {
          ctx.shadowColor = '#ff4fa3';
          ctx.shadowBlur = 7 * (targetTheme === 'dark' ? progress : 1 - progress);
        }
        ctx.fillRect(Math.round(petal.x), Math.round(petal.y), petal.size, petal.size);
        ctx.restore();
      });

      if (!reducedMotion) frameId = requestAnimationFrame(render);
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
      if (reducedMotion) render(performance.now());
    };

    const stopAnimation = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };
    const startAnimation = () => {
      if (!reducedMotion && frameId === null) frameId = requestAnimationFrame(render);
    };
    const updateTheme = () => {
      const nextTheme = root.getAttribute('data-theme') || 'dark';
      if (nextTheme === targetTheme) return;
      previousTheme = targetTheme;
      targetTheme = nextTheme;
      transitionStart = reducedMotion ? 0 : performance.now();
      if (reducedMotion) {
        previousTheme = targetTheme;
        render(performance.now());
      } else {
        startAnimation();
      }
    };
    const updateMotion = (event) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopAnimation();
        render(performance.now());
      } else {
        lastFrame = 0;
        startAnimation();
      }
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    mediaQuery.addEventListener('change', updateMotion);
    window.addEventListener('resize', resize);
    resize();
    startAnimation();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateMotion);
      window.removeEventListener('resize', resize);
      stopAnimation();
    };
  }, []);

  return (
    <div className="pixel-art-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default PixelArtBackground;
