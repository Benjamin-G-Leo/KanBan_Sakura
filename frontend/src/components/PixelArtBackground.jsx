import { useEffect, useRef } from 'react';

const PETAL_COUNT = 48;
const STAR_COUNT = 96;
const CLOUD_COUNT = 6;
const RIPPLE_COUNT = 38;
const THEME_TRANSITION_MS = 900;
const CELESTIAL_CYCLE_MS = 180_000;
const PIXEL = 3;
const TREES = [
  { x: 0.08, scale: 0.96, depth: 'back', bend: -0.24 },
  { x: 0.34, scale: 1.08, depth: 'front', bend: 0.18 },
  { x: 0.68, scale: 0.94, depth: 'back', bend: -0.16 },
  { x: 0.94, scale: 1.15, depth: 'front', bend: 0.2 },
];

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
    y: Math.random() * 0.58,
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

function drawOrganicStroke(ctx, points, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    const [x, y] = points[index];
    const [previousX, previousY] = points[index - 1];
    ctx.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
  }
  ctx.lineTo(...points[points.length - 1]);
  ctx.stroke();
}

function drawTaperedOrganicStroke(ctx, points, color, startWidth, endWidth) {
  for (let index = 1; index < points.length; index += 1) {
    const progress = index / (points.length - 1);
    const width = startWidth + (endWidth - startWidth) * progress;
    const segment = index === 1
      ? points.slice(0, 2)
      : [points[index - 2], points[index - 1], points[index]];
    drawOrganicStroke(ctx, segment, color, width);
  }
}

function drawBezierStroke(ctx, start, controls, end, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.bezierCurveTo(
    controls[0][0],
    controls[0][1],
    controls[1][0],
    controls[1][1],
    end[0],
    end[1],
  );
  ctx.stroke();
}

function drawCanopy(ctx, centerX, centerY, unit, colors, seed, layer = 'all') {
  const cloudWidth = 13;
  const cloudHeight = 9;
  const cell = Math.max(1, unit * 0.62);
  const [shadow, middle, highlight] = colors;

  for (let row = -cloudHeight; row <= cloudHeight; row += 1) {
    for (let column = -cloudWidth; column <= cloudWidth; column += 1) {
      const edge = (column / cloudWidth) ** 2 + (row / cloudHeight) ** 2;
      const wobble = Math.sin((column * 17 + row * 11 + seed) * 0.7) * 0.08;
      if (edge > 1.08 + wobble) continue;

      const normalizedY = (row + cloudHeight) / (cloudHeight * 2);
      const tone = normalizedY > 0.63
        ? 0
        : normalizedY < 0.28
          ? 2
          : 1;
      if ((layer === 'inner' && tone === 2) || (layer === 'highlight' && tone !== 2)) continue;
      ctx.fillStyle = [shadow, middle, highlight][tone];
      ctx.fillRect(
        Math.round(centerX + column * cell),
        Math.round(centerY + row * cell),
        Math.ceil(cell + 0.6),
        Math.ceil(cell + 0.6),
      );
    }
  }
}

function drawTree(ctx, width, height, tree, theme, time, index) {
  const dark = theme === 'dark';
  const unit = Math.max(2, PIXEL * tree.scale);
  const centerX = tree.x * width;
  const bankY = height * 0.68;
  const topY = bankY - height * 0.45 * tree.scale;
  const trunk = dark ? '#302638' : '#56353c';
  const outline = dark ? '#241821' : '#47252c';
  const woodLight = dark ? '#705362' : '#a36a68';
  const colors = [dark ? '#702d5d' : '#8f285b', '#ff8da1', '#ffb7c5'];
  const baseWidth = unit * (tree.depth === 'back' ? 7 : 10);
  const trunkTop = [centerX + tree.bend * unit * 4, topY + unit * 12];
  const trunkControls = [
    [centerX + tree.bend * unit * 2, bankY - height * 0.12],
    [centerX - tree.bend * unit * 2, topY + height * 0.16],
  ];

  ctx.save();
  ctx.globalAlpha *= tree.depth === 'back' ? 0.62 : 1;
  drawBezierStroke(ctx, [centerX, bankY + unit * 2], trunkControls, trunkTop, outline, baseWidth + unit * 2);
  drawBezierStroke(ctx, [centerX, bankY + unit * 2], trunkControls, trunkTop, trunk, baseWidth);
  drawBezierStroke(ctx, [centerX, bankY + unit * 2], trunkControls, trunkTop, woodLight, Math.max(2, unit));

  ctx.fillStyle = outline;
  ctx.fillRect(centerX - baseWidth * 0.9, bankY - unit, baseWidth * 1.8, unit * 3);

  const primaryBranches = [
    { direction: -1, reach: 26, lift: 13, bend: -2, offset: -1 },
    { direction: 1, reach: 25, lift: 15, bend: 2, offset: 1 },
    { direction: -1, reach: 19, lift: 21, bend: 3, offset: -2 },
    { direction: 1, reach: 20, lift: 20, bend: -3, offset: 2 },
  ];
  const primaryLimbs = [];
  const midLimbs = [];
  const midLeafAnchors = [];
  const accentTwigs = [];
  const canopyAnchors = [];

  primaryBranches.forEach((branch, branchIndex) => {
    const start = [
      trunkTop[0] + branch.offset * unit,
      trunkTop[1] - unit * (branchIndex + 1) * 0.8,
    ];
    const points = [
      start,
      [start[0] + branch.direction * unit * 5, start[1] - unit * 2],
      [start[0] + branch.direction * unit * (branch.reach * 0.55), start[1] - unit * (branch.lift * 0.48)],
      [start[0] + branch.direction * unit * (branch.reach + branch.bend), start[1] - unit * branch.lift],
    ];
    primaryLimbs.push(points);
    canopyAnchors.push(...points);

    for (let twigIndex = 1; twigIndex < points.length; twigIndex += 1) {
      const [x, y] = points[twigIndex];
      [-1, 1].forEach((side, sideIndex) => {
        const direction = branch.direction * side;
        const twig = [
          [x, y],
          [x + direction * unit * 3, y - unit * (2.2 + twigIndex * 0.35)],
          [x + direction * unit * 5.5, y - unit * (4.6 + twigIndex * 0.45)],
          [x + direction * unit * (7 + twigIndex), y - unit * (6 + twigIndex * 0.55)],
        ];
        canopyAnchors.push(...twig.slice(1));
        if ((twigIndex + sideIndex + branchIndex) % 2 === 0) accentTwigs.push(twig);
      });
    }
  });

  const midBranches = [
    { direction: -1, height: 0.4, reach: 20, lift: 4, bend: -3 },
    { direction: 1, height: 0.48, reach: 22, lift: 6, bend: 3 },
    { direction: -1, height: 0.59, reach: 24, lift: 8, bend: 4 },
    { direction: 1, height: 0.66, reach: 21, lift: 5, bend: -4 },
  ];
  midBranches.forEach((branch, branchIndex) => {
    const startY = bankY - (bankY - topY) * branch.height;
    const start = [
      centerX + tree.bend * unit * (branch.height * 5),
      startY,
    ];
    const points = [
      start,
      [start[0] + branch.direction * unit * 5, start[1] - unit * 1.5],
      [start[0] + branch.direction * unit * (branch.reach * 0.52), start[1] - unit * (branch.lift * 0.35)],
      [start[0] + branch.direction * unit * (branch.reach + branch.bend), start[1] - unit * branch.lift],
    ];
    midLimbs.push(points);
    midLeafAnchors.push(points[2], points[3]);
    canopyAnchors.push(...points.slice(1));

    // A restrained fork at each mid-level tip keeps the silhouette expansive
    // without recreating a dense foreground grid.
    [-1, 1].forEach((side, sideIndex) => {
      const [x, y] = points[2];
      const direction = branch.direction * side;
      const twig = [
        [x, y],
        [x + direction * unit * 4, y - unit * (2.5 + sideIndex)],
        [x + direction * unit * 7, y - unit * (5 + branchIndex * 0.5)],
        [x + direction * unit * 9, y - unit * (6.5 + branchIndex * 0.5)],
      ];
      midLeafAnchors.push(twig[2], twig[3]);
      canopyAnchors.push(...twig.slice(1));
      accentTwigs.push(twig);
    });
  });

  // Layer 1: paint the wood beneath the canopy, with a visibly tapered silhouette.
  primaryLimbs.forEach((points, branchIndex) => {
    const startWidth = unit * (branchIndex < 2 ? 3.5 : 2.9);
    drawTaperedOrganicStroke(ctx, points, outline, startWidth + unit, unit * 1.3);
    drawTaperedOrganicStroke(ctx, points, trunk, startWidth, unit * 0.8);
    drawTaperedOrganicStroke(ctx, points, woodLight, unit * 0.7, Math.max(1, unit * 0.25));
  });
  midLimbs.forEach((points, branchIndex) => {
    const startWidth = unit * (branchIndex % 2 === 0 ? 2.7 : 2.5);
    drawTaperedOrganicStroke(ctx, points, outline, startWidth + unit * 0.9, unit * 0.9);
    drawTaperedOrganicStroke(ctx, points, trunk, startWidth, unit * 0.55);
    drawTaperedOrganicStroke(ctx, points, woodLight, unit * 0.55, Math.max(1, unit * 0.2));
  });
  const roots = [
    [[centerX, bankY], [centerX - unit * 7, bankY + unit], [centerX - unit * 14, bankY + unit * 2]],
    [[centerX, bankY], [centerX + unit * 6, bankY + unit], [centerX + unit * 13, bankY + unit * 2]],
  ];
  roots.forEach((root) => {
    drawOrganicStroke(ctx, root, outline, unit * 2.4);
    drawOrganicStroke(ctx, root, trunk, unit * 1.5);
  });

  // Layer 2: build one continuous, overlapping inner canopy over every branch joint.
  for (let row = -8; row <= 12; row += 2) {
    for (let column = -19; column <= 19; column += 3) {
      const x = trunkTop[0] + column * unit;
      const y = topY + unit * (row + 10);
      drawCanopy(ctx, x, y, unit * 1.12, colors, index * 41 + row * 7 + column, 'inner');
    }
  }
  canopyAnchors.forEach(([x, y], anchorIndex) => {
    const seed = index * 97 + anchorIndex * 13 + Math.floor(time / 5000);
    drawCanopy(ctx, x, y + unit * 0.5, unit * 1.7, colors, seed, 'inner');
    drawCanopy(ctx, x + unit * 1.5, y - unit * 1.3, unit * 1.45, colors, seed + 1, 'inner');
    drawCanopy(ctx, x - unit * 1.4, y + unit * 1.2, unit * 1.35, colors, seed + 2, 'inner');
  });
  midLeafAnchors.forEach(([x, y], anchorIndex) => {
    const seed = index * 173 + anchorIndex * 19 + Math.floor(time / 5000);
    drawCanopy(ctx, x, y, unit * 1.2, colors, seed, 'inner');
    drawCanopy(ctx, x + unit * 1.1, y - unit * 0.8, unit * 0.85, colors, seed + 1, 'inner');
  });

  // Layer 3: let only a few thin, warm twigs peek through around the edges.
  accentTwigs.forEach((points) => {
    drawOrganicStroke(ctx, points, outline, Math.max(1, unit * 0.55));
    drawOrganicStroke(ctx, points, woodLight, Math.max(1, unit * 0.26));
  });

  // Layer 4: cap the upper cloud edges with compact pastel highlights.
  canopyAnchors.forEach(([x, y], anchorIndex) => {
    const seed = index * 131 + anchorIndex * 17;
    drawCanopy(ctx, x + unit * 0.35, y - unit * 2.1, unit * 1.05, colors, seed, 'highlight');
  });

  ctx.restore();
}

function createForestCache(width, height, theme) {
  const createLayer = (depth) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    TREES.forEach((tree, index) => {
      if (tree.depth === depth) drawTree(ctx, width, height, tree, theme, 0, index);
    });
    return canvas;
  };

  return {
    back: createLayer('back'),
    front: createLayer('front'),
  };
}

function drawSun(ctx, width, height, time) {
  const size = Math.min(width, height) * 0.075;
  const cycle = (time % CELESTIAL_CYCLE_MS) / CELESTIAL_CYCLE_MS;
  const x = cycle * (width + size * 2) - size;
  const arc = Math.sin(cycle * Math.PI);
  const y = height * (0.54 - arc * 0.43);

  ctx.save();
  ctx.shadowColor = 'rgba(255, 198, 114, 0.85)';
  ctx.shadowBlur = size * 0.65;
  ctx.fillStyle = 'rgba(255, 202, 119, 0.18)';
  ctx.fillRect(x - size * 0.4, y - size * 0.4, size * 1.8, size * 1.8);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#fff1b8';
  ctx.fillRect(x + size * 0.18, y + size * 0.18, size * 0.64, size * 0.64);
  ctx.restore();
}

function drawMoon(ctx, width, height, time) {
  const size = Math.min(width, height) * 0.065;
  const cycle = (time % CELESTIAL_CYCLE_MS) / CELESTIAL_CYCLE_MS;
  const x = width - (cycle * (width + size * 2) - size);
  const arc = Math.sin(cycle * Math.PI);
  const y = height * (0.54 - arc * 0.43);

  ctx.save();
  ctx.shadowColor = 'rgba(190, 213, 255, 0.9)';
  ctx.shadowBlur = size * 0.7;
  ctx.fillStyle = 'rgba(189, 211, 255, 0.28)';
  ctx.fillRect(x - size * 0.4, y - size * 0.4, size * 1.8, size * 1.8);
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#111a2e';
  ctx.fillRect(x + size * 0.45, y - size * 0.08, size * 0.7, size * 0.72);
  ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.6, size * 0.65);
  ctx.restore();
}

function drawCloud(ctx, cloud, width, height, block, time, celestialTime) {
  const x = ((cloud.x + time * cloud.speed + celestialTime / CELESTIAL_CYCLE_MS * 0.08) % 1.2 - 0.1) * width;
  const y = cloud.y * height + Math.sin(celestialTime * 0.0001 + cloud.x * 10) * 5;
  const unit = block * cloud.scale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
  ctx.fillRect(x, y + unit * 2, unit * 10, unit * 2);
  ctx.fillRect(x + unit * 2, y + unit, unit * 6, unit * 3);
  ctx.fillRect(x + unit * 4, y, unit * 3, unit * 3);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.72)';
  ctx.fillRect(x + unit, y + unit * 3, unit * 8, unit);
}

function drawSky(ctx, width, height, theme, time, celestialTime, stars, clouds) {
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
      const starX = ((star.x + celestialTime / CELESTIAL_CYCLE_MS * 0.03) % 1) * width;
      ctx.globalAlpha = sceneAlpha * (0.35 + (Math.sin(time * star.speed + star.phase) + 1) * 0.3);
      ctx.fillStyle = star.size > 2 ? '#d9e8ff' : '#ffffff';
      ctx.fillRect(Math.round(starX), Math.round(star.y * height), star.size, star.size);
    });
    ctx.globalAlpha = sceneAlpha;
    drawMoon(ctx, width, height, celestialTime);
  } else {
    drawSun(ctx, width, height, celestialTime);
    clouds.forEach((cloud) => drawCloud(ctx, cloud, width, height, block, time, celestialTime));
  }
}

function drawWater(ctx, width, height, theme, time) {
  const dark = theme === 'dark';
  const block = Math.max(6, Math.round(width / 120));
  const horizon = height * 0.57;
  ctx.fillStyle = dark ? '#26364a' : '#94a3b8';
  for (let x = 0; x < width; x += block * 2) {
    const peak = horizon - (Math.sin(x * 0.009) * 0.045 + 0.08) * height;
    ctx.fillRect(x, peak, block * 3, height - peak);
  }

  const riverTop = height * 0.76;
  const shoreTop = height * 0.62;
  drawCoast(ctx, width, height, shoreTop, riverTop, block, dark, time);
  ctx.fillStyle = dark ? 'rgba(115, 190, 205, 0.24)' : 'rgba(255, 255, 255, 0.38)';
  drawRipples(ctx, width, riverTop, height - riverTop, block, time);
}

// Layered sines give an irregular but smooth, non-repeating-looking edge (-1..1)
function coastNoise(x, phase) {
  return (
    Math.sin(x * 0.011 + phase) * 0.55
    + Math.sin(x * 0.027 + phase * 2.3) * 0.3
    + Math.sin(x * 0.067 + phase * 0.7) * 0.15
  );
}

// Sand bank and waterline, drawn in pixel columns so the edges stay chunky like
// the rest of the scene: dry sand with scattered pebbles, a darker band of wet
// sand, the water itself, a shade line under the bank, and broken foam that
// pulses gently as if lapping at the shore.
function drawCoast(ctx, width, height, shoreTop, riverTop, block, dark, time) {
  const step = Math.max(3, Math.round(block / 2));
  const snap = (value) => Math.round(value / step) * step;
  const sceneAlpha = ctx.globalAlpha;
  const columns = [];
  for (let x = 0; x < width + step; x += step) {
    const top = snap(shoreTop + Math.sin(x * 0.014) * block * 0.7);
    const water = snap(riverTop + coastNoise(x, 1.8) * block);
    const wet = water - Math.max(step, snap(block * (1.1 + 0.6 * coastNoise(x, 4.2))));
    columns.push({ x, top, water, wet });
  }

  ctx.fillStyle = dark ? '#b58a68' : '#e2c9a1';
  // Columns overlap by 1px: at fractional device-pixel ratios, abutting edges
  // antialias and let the hillside behind show through as vertical seams
  columns.forEach(({ x, top, water }) => ctx.fillRect(x, top, step + 1, water - top));
  ctx.fillStyle = dark ? '#8f6b54' : '#cfae84';
  columns.forEach(({ x, wet, water }) => ctx.fillRect(x, wet, step + 1, water - wet));

  // Pebbles and glints scattered on the dry sand
  const speckles = Math.floor(width / (block * 2.2));
  for (let k = 0; k < speckles; k += 1) {
    const column = columns[Math.floor(seeded(k * 3 + 1) * (columns.length - 1))];
    const span = column.wet - column.top - step * 3;
    if (span <= 0) continue;
    const y = snap(column.top + step * 2 + seeded(k * 3 + 2) * span);
    const glint = seeded(k * 3 + 3) > 0.72;
    ctx.fillStyle = glint ? (dark ? '#cfa784' : '#f3e2c3') : (dark ? '#80604f' : '#b5936b');
    ctx.fillRect(column.x, y, step * (glint ? 1 : 1 + Math.floor(seeded(k * 7) * 3)), step);
  }

  ctx.fillStyle = dark ? '#23485a' : '#7dd3fc';
  columns.forEach(({ x, water }) => ctx.fillRect(x, water, step + 1, height - water));
  ctx.fillStyle = dark ? 'rgba(17, 35, 46, 0.55)' : 'rgba(71, 108, 128, 0.22)';
  // Translucent, so drawn as one stepped shape: overlapping columns would
  // double the alpha where they meet
  ctx.beginPath();
  columns.forEach(({ x, water }, index) => {
    if (index === 0) ctx.moveTo(x, water);
    ctx.lineTo(x, water);
    ctx.lineTo(x + step, water);
  });
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    const { x, water } = columns[index];
    ctx.lineTo(x + step, water + step * 2);
    ctx.lineTo(x, water + step * 2);
  }
  ctx.closePath();
  ctx.fill();

  // Shallows: the same short dashes as the sand texture, in water tones, in a
  // band just off the shore
  const shallowDashes = Math.floor(width / (block * 2.6));
  for (let k = 0; k < shallowDashes; k += 1) {
    const column = columns[Math.floor(seeded(k * 3 + 101) * (columns.length - 1))];
    const y = snap(column.water + step * 3 + seeded(k * 3 + 102) * block * 2.2);
    const light = seeded(k * 3 + 103) > 0.6;
    ctx.fillStyle = light ? (dark ? '#2f6175' : '#a5e1fb') : (dark ? '#1a3846' : '#5fbfe6');
    ctx.fillRect(column.x, y, step * (1 + Math.floor(seeded(k * 7 + 100) * 3)), step);
  }

  // Two broken foam lines that fade in and out along the shore
  ctx.save();
  ctx.fillStyle = dark ? 'rgb(196, 228, 236)' : 'rgb(255, 255, 255)';
  columns.forEach(({ x, water }, index) => {
    if (seeded(index * 5 + 1) > 0.25) {
      ctx.globalAlpha = sceneAlpha * (0.25 + 0.3 * (1 + Math.sin(time * 0.0016 + x * 0.021)) / 2);
      ctx.fillRect(x, water, step, step);
    }
    if (seeded(index * 5 + 2) > 0.6) {
      ctx.globalAlpha = sceneAlpha * 0.25 * (1 + Math.sin(time * 0.0016 + x * 0.021 - 1.6)) / 2;
      ctx.fillRect(x, water + step * 2, step, step);
    }
  });

  // The same pulsing foam glints scattered across the open river, each with its
  // own phase and speed so they shimmer independently
  const glintTop = Math.max(...columns.map(({ water }) => water)) + step * 4;
  const glintSpan = height - glintTop - step;
  const glints = Math.floor(width / (block * 1.6));
  for (let k = 0; k < glints && glintSpan > 0; k += 1) {
    const x = snap(seeded(k * 4 + 201) * width);
    const y = snap(glintTop + seeded(k * 4 + 202) * glintSpan);
    const pulse = (1 + Math.sin(time * (0.0011 + seeded(k * 4 + 203) * 0.0012) + k * 2.4)) / 2;
    ctx.globalAlpha = sceneAlpha * 0.4 * pulse * pulse;
    ctx.fillRect(x, y, step * (1 + Math.floor(seeded(k * 4 + 204) * 3)), step);
  }
  ctx.restore();
}

// Deterministic 0..1 noise so ripples need no per-frame state
function seeded(n) {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Each ripple is a flat, broken glint: a few horizontal dashes of uneven length
// on one row. It appears at a random spot, drifts downstream while fading in and
// out, then respawns elsewhere, so the surface never shows a repeating pattern.
// Streaks lower in the river (nearer the viewer) are longer and move faster.
function drawRipples(ctx, width, riverTop, riverHeight, block, time) {
  const thickness = Math.max(2, Math.round(block / 3));
  const sceneAlpha = ctx.globalAlpha;
  ctx.save();
  for (let i = 0; i < RIPPLE_COUNT; i += 1) {
    const life = 5000 + seeded(i + 1) * 7000;
    const t = time + seeded(i + 11) * life;
    const cycle = Math.floor(t / life);
    const progress = (t % life) / life;
    const seed = i * 97 + cycle * 13;

    const depth = seeded(seed + 3);
    const rawY = riverTop + block * 1.5 + depth * (riverHeight - block * 3);
    const y = Math.round(rawY / thickness) * thickness;
    const speed = 0.008 + depth * 0.014 + seeded(seed + 5) * 0.006;
    const scale = 0.7 + depth * 0.8;
    let x = seeded(seed + 7) * (width + block * 20) - block * 10 + progress * life * speed;

    ctx.globalAlpha = sceneAlpha * Math.sin(progress * Math.PI);
    const dashes = 2 + Math.floor(seeded(seed + 9) * 3);
    for (let d = 0; d < dashes; d += 1) {
      const length = Math.round(block * scale * (1 + seeded(seed + 20 + d) * 4));
      ctx.fillRect(Math.round(x), y, length, thickness);
      x += length + Math.round(block * scale * (0.6 + seeded(seed + 60 + d) * 1.4));
    }
  }
  ctx.restore();
}

const BUSH_PALETTES = {
  dark: {
    outline: '#0f2a20', shadow: '#1f513e', base: '#2d6a4f', light: '#40916c', highlight: '#6fbf95',
    flower: '#f09db8', ground: 'rgba(40, 24, 18, 0.28)',
  },
  light: {
    outline: '#1b4332', shadow: '#2d6a4f', base: '#40916c', light: '#52b788', highlight: '#95d5b2',
    flower: '#ff8da1', ground: 'rgba(120, 84, 52, 0.22)',
  },
};

// Each bush is a cluster of 3-4 round clumps rasterised onto a pixel grid:
// outlined, shaded from the top-left with a little dithering between tones,
// sitting on a soft ground shadow, with a few blossoms on some of them.
function drawBushes(ctx, width, height, theme) {
  const palette = BUSH_PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const block = Math.max(3, Math.round(width / 170));
  const cell = Math.max(3, Math.round(width / 240));
  const shoreY = height * 0.69;
  const positions = [0.16, 0.29, 0.48, 0.76, 0.88];

  positions.forEach((position, index) => {
    const seed = index * 31 + 7;
    const cols = 10 + Math.floor(seeded(seed) * 4);
    const rows = 6 + Math.floor(seeded(seed + 1) * 2);
    const left = Math.round((position * width) / cell) * cell - Math.round(cols / 2) * cell;
    const bottom = Math.round((shoreY + Math.sin(index * 2.7) * block) / cell) * cell;
    const top = bottom - rows * cell;

    // Clumps in cell units: a wide flat base so the bottom is always solid, two
    // shoulders, and one or two rounded crowns on top
    const clumps = [
      { cx: cols * 0.5, cy: rows - 0.5, r: cols * 0.47, squash: 2.2 },
      { cx: cols * 0.28, cy: rows * 0.68, r: rows * 0.42, squash: 1 },
      { cx: cols * 0.72, cy: rows * 0.7, r: rows * 0.4, squash: 1 },
      { cx: cols * (0.42 + seeded(seed + 2) * 0.16), cy: rows * 0.45, r: rows * 0.45, squash: 1 },
    ];
    if (seeded(seed + 3) > 0.45) {
      clumps.push({ cx: cols * (0.6 + seeded(seed + 4) * 0.12), cy: rows * 0.42, r: rows * 0.34, squash: 1 });
    }

    const nearestClump = (gx, gy) => {
      let best = null;
      clumps.forEach((clump) => {
        const dist = Math.hypot(gx + 0.5 - clump.cx, (gy + 0.5 - clump.cy) * clump.squash) / clump.r;
        if (dist <= 1 && (!best || dist < best.dist)) best = { clump, dist };
      });
      return best?.clump ?? null;
    };

    // Mask, then drop lone bumps (cells with no side neighbours) so tops stay round
    const mask = Array.from({ length: rows }, (_, gy) => (
      Array.from({ length: cols }, (_, gx) => nearestClump(gx, gy))
    ));
    for (let gy = 0; gy < rows - 1; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        if (mask[gy][gx] && !mask[gy][gx - 1] && !mask[gy][gx + 1]) mask[gy][gx] = null;
      }
    }
    const clumpAt = (gx, gy) => (gy >= 0 && gy < rows ? mask[gy][gx] ?? null : null);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(left, bottom, cols * cell, cell);

    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        const clump = clumpAt(gx, gy);
        if (!clump) continue;
        const edge = !clumpAt(gx - 1, gy) || !clumpAt(gx + 1, gy) || !clumpAt(gx, gy - 1)
          || (gy < rows - 1 && !clumpAt(gx, gy + 1));
        let color = palette.outline;
        if (!edge) {
          const nx = (gx + 0.5 - clump.cx) / clump.r;
          const ny = (gy + 0.5 - clump.cy) / clump.r;
          const dither = (gx + gy) % 2 === 0 ? 0.08 : -0.08;
          const lightness = -(nx * 0.55 + ny * 0.85) + dither;
          color = lightness > 0.55 ? palette.highlight
            : lightness > 0.15 ? palette.light
              : lightness > -0.35 ? palette.base
                : palette.shadow;
        }
        ctx.fillStyle = color;
        ctx.fillRect(left + gx * cell, top + gy * cell, cell, cell);
      }
    }

    if (seeded(seed + 5) > 0.35) {
      ctx.fillStyle = palette.flower;
      const flowers = 2 + Math.floor(seeded(seed + 6) * 3);
      for (let f = 0; f < flowers; f += 1) {
        const gx = 1 + Math.floor(seeded(seed + 10 + f) * (cols - 2));
        const gy = 1 + Math.floor(seeded(seed + 20 + f) * (rows - 3));
        if (clumpAt(gx, gy) && clumpAt(gx, gy - 1)) {
          ctx.fillRect(left + gx * cell, top + gy * cell, cell, cell);
        }
      }
    }
  });
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
    let pixelRatio = 1;
    let petals = [];
    let forestCaches = { dark: null, light: null };
    const stars = createStars();
    const clouds = createClouds();
    let lastFrame = 0;
    let celestialTime = CELESTIAL_CYCLE_MS * 0.2;
    let frameId = null;
    let reducedMotion = mediaQuery.matches;
    let targetTheme = root.getAttribute('data-theme') || 'dark';
    let previousTheme = targetTheme;
    let transitionStart = 0;

    const drawScene = (theme, timestamp, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      drawSky(ctx, width, height, theme, timestamp, celestialTime, stars, clouds);
      const forest = forestCaches[theme];
      drawWater(ctx, width, height, theme, timestamp);
      if (forest?.back) ctx.drawImage(forest.back, 0, 0, width, height);
      drawBushes(ctx, width, height, theme);
      if (forest?.front) ctx.drawImage(forest.front, 0, 0, width, height);
      ctx.restore();
    };

    const render = (timestamp = 0) => {
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 40) : 16;
      lastFrame = timestamp;
      if (!reducedMotion) celestialTime += elapsed;
      ctx.clearRect(0, 0, width, height);
      const progress = transitionStart
        ? Math.min((timestamp - transitionStart) / THEME_TRANSITION_MS, 1)
        : 1;
      drawScene(previousTheme, timestamp, progress < 1 ? 1 - progress : 1);
      if (progress < 1) drawScene(targetTheme, timestamp, progress);
      else {
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
      const nextWidth = rect.width || window.innerWidth;
      const nextHeight = rect.height || window.innerHeight;
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return;
      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextPixelRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      petals = Array.from({ length: PETAL_COUNT }, () => createPetal(width, height));
      forestCaches = {
        dark: createForestCache(width, height, 'dark'),
        light: createForestCache(width, height, 'light'),
      };
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
      } else startAnimation();
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
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    mediaQuery.addEventListener('change', updateMotion);
    window.addEventListener('resize', resize);
    resize();
    startAnimation();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
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
