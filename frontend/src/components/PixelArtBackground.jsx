import { useEffect, useRef, useState } from 'react';

const PETAL_COUNT = 48;
const STAR_COUNT = 96;
const CLOUD_COUNT = 6;
const TREE_COUNT_PER_LAYER = 8;
const CANOPY_LAYERS = 3;
const TRUNK_BLOCK = 2;
const BRANCH_BLOCK = 1;
const THEME_TRANSITION_MS = 900;

// Petal creation function
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

// Color utility functions
function getLeafColor(index, theme) {
  const darkColors = ['#8f4778', '#bd5a91', '#e483ad', '#f3b1ca'];
  const lightColors = ['#d44c82', '#f06f9b', '#ff8da1', '#ffb7c5'];
  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[index % colors.length];
}

function getStarColor(index, theme, time) {
  const darkColors = ['#f8fafc', '#f1f5f9', '#e2e8f0'];
  const lightColors = ['#2d3748', '#4a5568', '#64748b'];
  const colors = theme === 'dark' ? darkColors : lightColors;
  // Twinkling effect based on time
  const twinkle = Math.sin(time * 0.001 + index) > 0 ? 0 : 1;
  return {
    color: colors[index % colors.length],
    opacity: 0.8 + twinkle * 0.2,
  };
}

function lightenColor(color, factor) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(255 * factor);
  const r = Math.min(255, ((num >> 16) + amt) | 0);
  const g = Math.min(255, (((num >> 8) & 0x0000ff) + amt) | 0);
  const b = Math.min(255, ((num & 0x000000ff) + amt) | 0);
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function drawPixelTree(ctx, height, block, x, baseY, scale, theme, time, treeIndex) {
  const dark = theme === 'dark';
  const unit = block * scale;
  const trunkColor = dark ? ['#302c43', '#373044', '#403149'][treeIndex] : ['#704650', '#83505b', '#694451'][treeIndex];
  const branchColor = dark ? '#44354b' : '#925766';
  const canopyColors = dark
    ? ['#8f4778', '#bd5a91', '#e483ad', '#f3b1ca']
    : ['#d44c82', '#f06f9b', '#ff8da1', '#ffb7c5'];
  const topY = baseY - height * scale * 0.55;

  ctx.fillStyle = trunkColor;
  ctx.fillRect(x - unit, topY + unit * 8, unit * 3, baseY - topY - unit * 8);
  ctx.fillRect(x - unit * 3, baseY - unit * 5, unit * 7, unit * 5);

  const branches = [
    [[0, 11], [-1, 9], [-3, 8], [-5, 6], [-7, 5]],
    [[0, 10], [1, 8], [3, 7], [5, 5], [7, 4]],
    [[0, 7], [-1, 5], [-2, 3], [-4, 2], [-5, 0]],
    [[1, 8], [2, 6], [4, 5], [5, 3], [7, 2]],
    [[-1, 9], [-2, 7], [-4, 6], [-5, 4], [-7, 3]],
  ];
  const endpoints = [];

  branches.forEach((branch, branchIndex) => {
    const points = branch.map(([column, row]) => [x + column * unit, topY + row * unit]);
    ctx.strokeStyle = branchIndex % 2 === 0 ? trunkColor : branchColor;
    ctx.lineWidth = Math.max(unit * (branchIndex < 2 ? 2.4 : 1.8), 3);
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach(([pointX, pointY], index) => {
      const previousPoint = points[index];
      ctx.lineTo(previousPoint[0], pointY);
      ctx.lineTo(pointX, pointY);
    });
    ctx.stroke();
    endpoints.push(points[points.length - 1]);
  });

  const clusters = [
    [-8, 4], [-7, 2], [-6, 6], [-5, 0], [-4, 3], [-3, 6], [-2, 1], [-1, -1],
    [0, 2], [1, -2], [2, 1], [3, 4], [4, -1], [5, 2], [6, 0], [7, 3],
    [-6, 8], [-3, 8], [1, 6], [4, 7],
  ];

  clusters.forEach(([column, row], index) => {
    const clusterX = x + column * unit;
    const clusterY = topY + row * unit;
    const colorIndex = (index + Math.floor(time / 1800) + treeIndex) % canopyColors.length;
    const size = unit * (index % 4 === 0 ? 3.4 : 2.6);
    ctx.fillStyle = canopyColors[colorIndex];
    ctx.fillRect(clusterX, clusterY, size, unit * 1.8);
    ctx.fillRect(clusterX + unit * 0.7, clusterY - unit, size * 0.65, unit);
    ctx.fillRect(clusterX + unit * 1.4, clusterY + unit * 1.8, size * 0.6, unit);
  });

  renderForestLayers(ctx, width, height, theme, time) {
  const dark = theme === 'dark';
  const unit = 32;
  const trunkBlock = TRUNK_BLOCK;
  const branchBlock = BRANCH_BLOCK;

  // Layer configs: foreground, midground, background
  const layerConfigs = [
    {
      trunkColor: dark ? '#302c43' : '#704650',
      branchColor: dark ? '#44354b' : '#925766',
      canopyColors: dark
        ? ['#8f4778', '#bd5a91', '#e483ad', '#f3b1ca']
        : ['#d44c82', '#f06f9b', '#ff8da1', '#ffb7c5'],
      treeCount: TREE_COUNT_PER_LAYER * 2,
      parallaxFactor: 0.8,
      offsetY: 0,
    },
    {
      trunkColor: dark ? '#373044' : '#83505b',
      branchColor: dark ? '#5a4566' : '#a0657a',
      canopyColors: dark
        ? ['#bd5a91', '#e483ad', '#f3b1ca', '#d44c82']
        : ['#f06f9b', '#ff8da1', '#ffb7c5', '#d44c82'],
      treeCount: TREE_COUNT_PER_LAYER,
      parallaxFactor: 0.5,
      offsetY: height * 0.15,
    },
    {
      trunkColor: dark ? '#403149' : '#694451',
      branchColor: dark ? '#6b5b7a' : '#8a6c84',
      canopyColors: dark
        ? ['#e483ad', '#f3b1ca', '#d44c82', '#f06f9b']
        : ['#ff8da1', '#ffb7c5', '#d44c82', '#f06f9b'],
      treeCount: TREE_COUNT_PER_LAYER,
      parallaxFactor: 0.3,
      offsetY: height * 0.35,
    },
  ];

  const allEndpoints = [];

  layerConfigs.forEach((layer, li) => {
    for (let ti = 0; ti < layer.treeCount; ti++) {
      const treeIndex = ti % 3;
      const x = (ti * 100 + time * layer.parallaxFactor) % width;
      const baseY = height + layer.offsetY + Math.random() * height * 0.3;

      ctx.save();
      ctx.scale(0.6 - li * 0.15, 0.6 - li * 0.15);
      ctx.fillStyle = layer.trunkColor;
      ctx.fillRect(
        (x - trunkBlock) / (0.6 - li * 0.15),
        (baseY + 80) / (0.6 - li * 0.15),
        trunkBlock * 3 / (0.6 - li * 0.15),
        80 / (0.6 - li * 0.15)
      );

      const canopyColors = layer.canopyColors;
      for (let ci = 0; ci < 8; ci++) {
        const column = (ci - 3.5) * 1.5;
        const row = (ci % 2 === 0 ? -(ci + 1) / 2 : (ci + 1) / 2);
        const clusterX = x / (0.6 - li * 0.15) + column;
        const clusterY = (baseY + 40) / (0.6 - li * 0.15) + row;
        const colorIndex = (ci + Math.floor(time / 1200) + treeIndex) % canopyColors.length;
        ctx.fillStyle = canopyColors[colorIndex];
        ctx.beginPath();
        ctx.arc(clusterX, clusterY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      allEndpoints.push({ x, baseY });
    }
  });

  return allEndpoints;
}

function drawCelestialBodies(ctx, width, height, theme, celestialTime) {
  const dark = theme === 'dark';
  const sunColor = dark ? '#f6ad55' : '#f6ad55';
  const moonColor = dark ? '#faf0e6' : '#2d3748';

  // Sun
  const sunRadius = Math.min(width, height) * 0.12;
  const sunAngle = (celestialTime / 10000) % (Math.PI * 2);
  const sunX = width * 0.82 + Math.cos(sunAngle) * width * 0.18;
  const sunY = height * 0.18 + Math.sin(sunAngle) * height * 0.15;

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Moon
  const moonRadius = Math.min(width, height) * 0.08;
  const moonAngle = (celestialTime / 8000) % (Math.PI * 2) + Math.PI;
  const moonX = width * 0.18 + Math.cos(moonAngle) * width * 0.35;
  const moonY = height * 0.82 + Math.sin(moonAngle) * height * 0.18;

  ctx.fillStyle = moonColor;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw stars
  const starCount = Math.min(20, STAR_COUNT);
  for (let si = 0; si < starCount; si++) {
    const starX = (si * 31 + time * 0.0001) % width;
    const starY = (Math.sin(si * 0.00005 + time) * 0.3 + 0.4) * height;
    const starSize = Math.random() > 0.8 ? 2 : 1;
    ctx.fillStyle = '#f8fafc';
    ctx.globalAlpha = Math.random() > 0.5 ? 0.6 : 1.0;
    ctx.beginPath();
    ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawClouds(ctx, width, height, theme, time) {
  const cloudCount = Math.min(CLOUD_COUNT, 4);
  for (let ci = 0; ci < cloudCount; ci++) {
    const cloudX = (time * 0.00003 + ci * 50) % width - 50;
    const cloudY = height * 0.25 + Math.sin(time * 0.0001 + ci) * 20;
    ctx.fillStyle = dark ? '#2d3748' : '#f8fafc';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 15, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY, 10, 0, Math.PI * 2);
    ctx.arc(cloudX - 20, cloudY, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawLandscape(ctx, width, height, theme, time, stars, clouds) {
  // ... (rest of landscape drawing will be added later)
}
  const x = width * 0.83;
  const y = height * 0.17;
  const size = block * 5;
  ctx.save();
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * 0.22;
  ctx.fillStyle = '#ffca77';
  ctx.fillRect(x - size * 1.7, y - size * 1.7, size * 4.4, size * 4.4);
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillRect(x - size * 1.15, y - size * 1.15, size * 3.3, size * 3.3);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#fff1b8';
  ctx.fillRect(x + block, y + block, size - block * 2, size - block * 2);
  ctx.fillStyle = 'rgba(255, 239, 177, 0.82)';
  ctx.fillRect(x + size * 0.35, y - size * 0.8, size * 0.3, size * 0.5);
  ctx.fillRect(x + size * 0.35, y + size * 1.3, size * 0.3, size * 0.5);
  ctx.fillRect(x - size * 0.8, y + size * 0.35, size * 0.5, size * 0.3);
  ctx.fillRect(x + size * 1.3, y + size * 0.35, size * 0.5, size * 0.3);
  ctx.fillRect(x - size * 0.55, y - size * 0.55, size * 0.3, size * 0.3);
  ctx.fillRect(x + size * 1.25, y - size * 0.55, size * 0.3, size * 0.3);
  ctx.fillRect(x - size * 0.55, y + size * 1.25, size * 0.3, size * 0.3);
  ctx.fillRect(x + size * 1.25, y + size * 1.25, size * 0.3, size * 0.3);
  ctx.restore();
}

function drawMoon(ctx, width, height, block) {
  const x = width * 0.82;
  const y = height * 0.15;
  const size = block * 5;
  ctx.save();
  ctx.shadowColor = 'rgba(190, 213, 255, 0.9)';
  ctx.shadowBlur = size * 3;
  ctx.fillStyle = 'rgba(189, 211, 255, 0.2)';
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
    { x: width * 0.12, scale: 0.78 },
    { x: width * 0.52, scale: 0.58 },
    { x: width * 0.91, scale: 0.92 },
  ];
  trees.forEach((tree, index) => {
    drawPixelTree(ctx, height, block, tree.x, height * (0.72 + (index === 1 ? 0.01 : 0)), tree.scale, theme, time, index);
  });

  ctx.fillStyle = dark ? 'rgba(17, 35, 46, 0.65)' : 'rgba(71, 108, 128, 0.28)';
  ctx.fillRect(0, riverTop - block, width, block * 2);
}

function mixColor(from, to, progress) {
  const parse = (color) => color.match(/\w\w/g).map((part) => Number.parseInt(part, 16));
  const fromRgb = parse(from.slice(1));
  const toRgb = parse(to.slice(1));
  const channels = fromRgb.map((channel, index) => Math.round(channel + (toRgb[index] - channel) * progress));
  return `rgb(${channels.join(',')})`;
}

export function PixelArtBackground() {
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const root = document.documentElement;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let petals = [];
    let lastFrame = 0;
    let frameId = null;
    let targetTheme = root.getAttribute('data-theme') || 'dark';
    let previousTheme = targetTheme;
    let transitionStart = 0;

    const updateTheme = () => {
      const nextTheme = root.getAttribute('data-theme') || 'dark';
      if (nextTheme === targetTheme) return;
      previousTheme = targetTheme;
      targetTheme = nextTheme;
      transitionStart = reducedMotion ? 0 : performance.now();
      if (reducedMotion) {
        previousTheme = targetTheme;
        render(performance.now());
      }
    };

    const updateMotion = (event) => setReducedMotion(event.matches);
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    mediaQuery.addEventListener('change', updateMotion);

    const render = (timestamp = 0) => {
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 40) : 16;
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);

      const progress = transitionStart
        ? Math.min((timestamp - transitionStart) / THEME_TRANSITION_MS, 1)
        : 1;

// Render forest layers with parallax
const forestEndpoints = renderForestLayers(ctx, width, height, previousTheme, timestamp);

// Draw celestial bodies (sun, moon, stars, clouds)
drawCelestialBodies(ctx, width, height, previousTheme, timestamp);
drawClouds(ctx, width, height, previousTheme, timestamp);

// Draw horizon and ground
const horizon = height * 0.57;
ctx.fillStyle = previousTheme === 'dark' ? '#26364a' : '#94a3b8';
for (let x = 0; x < width; x += 32) {
  const peak = horizon - (Math.sin(x * 0.009) * 0.045 + 0.08) * height;
  ctx.fillRect(x, peak, 32, height - peak);
}

// Draw rivers
const riverTop = height * 0.68;
ctx.fillStyle = previousTheme === 'dark' ? '#23485a' : '#7dd3fc';
ctx.fillRect(0, riverTop, width, height - riverTop);
ctx.fillStyle = previousTheme === 'dark' ? 'rgba(115, 190, 205, 0.24)' : 'rgba(255, 255, 255, 0.38)';
for (let row = 0; row < 9; row += 1) {
  const y = riverTop + row * ((height - riverTop) / 9) + 32;
  const offset = (timestamp * (0.018 + row * 0.002) + row * 32 * 3) % (32 * 12);
  for (let x = -32 * 12 + offset; x < width; x += 32 * 12) {
    ctx.fillRect(x, y, 32 * (2 + (row % 3)), Math.max(2, 32 / 3));
  }
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
        const colorForTheme = (value) => value === 'dark' ? darkColor : lightColor;
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

    resize();
    if (!reducedMotion) frameId = requestAnimationFrame(render);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateMotion);
      window.removeEventListener('resize', resize);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [reducedMotion]);

  return (
    <div className="pixel-art-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default PixelArtBackground;
