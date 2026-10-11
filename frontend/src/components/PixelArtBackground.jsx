import { useEffect, useRef } from 'react';

const PETAL_COUNT = 48;
const STAR_COUNT = 96;
const CLOUD_COUNT = 6;
const THEME_TRANSITION_MS = 900;
const CELESTIAL_CYCLE_MS = 180_000;
const PIXEL = 3;
const LIGHT_BLOSSOMS = ['#b52f64', '#ec5f87', '#ff8da1', '#ffb7c5'];
const DARK_BLOSSOMS = ['#702d5d', '#a93f78', '#d85f93', '#f09db8'];
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
  ctx.lineCap = 'square';
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

function drawCanopy(ctx, centerX, centerY, unit, colors, seed) {
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
  const outline = dark ? '#171522' : '#38252b';
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
    { direction: -1, reach: 26, lift: 13, bend: -2 },
    { direction: 1, reach: 25, lift: 15, bend: 2 },
    { direction: -1, reach: 19, lift: 21, bend: 3 },
    { direction: 1, reach: 20, lift: 20, bend: -3 },
  ];
  const skeleton = [];
  const canopyAnchors = [];

  primaryBranches.forEach((branch, branchIndex) => {
    const start = [
      trunkTop[0] + branch.direction * unit * (branchIndex % 2 ? 1 : -1),
      trunkTop[1] - unit * (branchIndex + 1) * 0.8,
    ];
    const points = [
      start,
      [start[0] + branch.direction * unit * 5, start[1] - unit * 2],
      [start[0] + branch.direction * unit * (branch.reach * 0.55), start[1] - unit * (branch.lift * 0.48)],
      [start[0] + branch.direction * unit * (branch.reach + branch.bend), start[1] - unit * branch.lift],
    ];
    skeleton.push({ points, width: unit * (branchIndex < 2 ? 3.1 : 2.5) });
    canopyAnchors.push(...points);

    for (let twigIndex = 1; twigIndex < points.length; twigIndex += 1) {
      const [x, y] = points[twigIndex];
      [-1, 1].forEach((side) => {
        const direction = branch.direction * side;
        const twig = [
          [x, y],
          [x + direction * unit * 3, y - unit * (2.2 + twigIndex * 0.35)],
          [x + direction * unit * 5.5, y - unit * (4.6 + twigIndex * 0.45)],
          [x + direction * unit * (7 + twigIndex), y - unit * (6 + twigIndex * 0.55)],
        ];
        skeleton.push({ points: twig, width: unit * 1.05 });
        canopyAnchors.push(...twig.slice(1));
      });
    }
  });

  // Fill the fork and branch corridors first so no gaps remain around the trunk.
  for (let row = -7; row <= 11; row += 2) {
    for (let column = -18; column <= 18; column += 3) {
      const x = trunkTop[0] + column * unit;
      const y = topY + unit * (row + 10);
      drawCanopy(ctx, x, y, unit * 0.9, colors, index * 41 + row * 7 + column);
    }
  }

  // Four times the former branch-tip coverage: every primary and secondary fork
  // receives overlapping shadow, core, and highlight cloud layers.
  canopyAnchors.forEach(([x, y], anchorIndex) => {
    const seed = index * 97 + anchorIndex * 13 + Math.floor(time / 5000);
    drawCanopy(ctx, x, y + unit * 0.5, unit * 1.45, colors, seed);
    drawCanopy(ctx, x + unit * 1.2, y - unit * 1.2, unit * 1.2, colors, seed + 1);
    drawCanopy(ctx, x - unit * 1.1, y + unit * 1.1, unit * 1.15, colors, seed + 2);
    drawCanopy(ctx, x + unit * 0.3, y - unit * 2.4, unit * 0.9, colors, seed + 3);
  });

  skeleton.forEach(({ points, width: branchWidth }) => {
    drawOrganicStroke(ctx, points, outline, branchWidth + unit * 1.4);
    drawOrganicStroke(ctx, points, trunk, branchWidth);
    drawOrganicStroke(ctx, points, woodLight, Math.max(1, unit * 0.42));
  });

  const roots = [
    [[centerX, bankY], [centerX - unit * 7, bankY + unit], [centerX - unit * 14, bankY + unit * 2]],
    [[centerX, bankY], [centerX + unit * 6, bankY + unit], [centerX + unit * 13, bankY + unit * 2]],
  ];
  roots.forEach((root) => {
    drawOrganicStroke(ctx, root, outline, unit * 2.4);
    drawOrganicStroke(ctx, root, trunk, unit * 1.5);
  });
  ctx.restore();
}

function drawLegacyTree(ctx, width, height, tree, theme, time, index) {
  const dark = theme === 'dark';
  const unit = Math.max(2, PIXEL * tree.scale);
  const centerX = tree.x * width;
  const bankY = height * 0.68;
  const topY = bankY - height * 0.48 * tree.scale;
  const trunk = dark ? '#302638' : '#56353c';
  const outline = dark ? '#171522' : '#38252b';
  const woodLight = dark ? '#705362' : '#a36a68';
  const branchPaths = [
    [[0, 12], [-1, 10], [-3, 8], [-4, 6], [-7, 4], [-9, 3]],
    [[0, 11], [2, 9], [3, 7], [6, 5], [8, 3], [10, 2]],
    [[-1, 8], [-2, 6], [-2, 4], [-4, 2], [-5, 0]],
    [[1, 9], [1, 7], [3, 5], [3, 3], [5, 1]],
    [[0, 12], [-2, 11], [-4, 10], [-6, 8], [-8, 7], [-11, 6]],
    [[0, 11], [2, 11], [4, 10], [6, 8], [9, 7], [12, 5]],
    [[-1, 9], [-3, 7], [-5, 6], [-7, 5], [-10, 4]],
    [[1, 10], [3, 8], [5, 7], [7, 6], [10, 5], [12, 3]],
  ];
  const canopyAnchors = [
    [-9, 3], [-7, 4], [-5, 0], [-4, 2], [-2, 4], [3, 3], [5, 1], [6, 5], [8, 3], [10, 2],
    [-12, 5], [-11, 1], [-9, -2], [-7, 6], [-6, -4], [-3, -2], [-1, 6], [1, -4],
    [2, 5], [4, -3], [7, -1], [9, 5], [11, 1], [12, 4], [0, -7],
  ];
  const trunkPath = [
    [centerX, bankY],
    [centerX + tree.bend * unit * 2, bankY - height * 0.15 * tree.scale],
    [centerX - tree.bend * unit, bankY - height * 0.32 * tree.scale],
    [centerX, topY + unit * 8],
  ];

  ctx.save();
  ctx.globalAlpha *= tree.depth === 'back' ? 0.62 : 1;
  const baseWidth = unit * (tree.depth === 'back' ? 7 : 10);
  drawOrganicStroke(ctx, trunkPath, outline, baseWidth + unit * 2);
  drawOrganicStroke(ctx, trunkPath, trunk, baseWidth);
  drawOrganicStroke(ctx, trunkPath, woodLight, Math.max(2, unit));
  ctx.fillStyle = outline;
  ctx.fillRect(centerX - baseWidth * 0.8, bankY - unit * 2, baseWidth * 1.6, unit * 3);

  const trunkGrain = [
    [[-1, 0], [-2, -3], [-1, -6]],
    [[2, -1], [3, -4], [1, -7]],
    [[-3, -1], [-4, -3]],
  ];
  trunkGrain.forEach((path) => {
    drawOrganicStroke(
      ctx,
      path.map(([dx, dy]) => [centerX + dx * unit, bankY + dy * unit * 3]),
      outline,
      Math.max(2, unit * 0.7),
    );
  });

  const colors = dark ? DARK_BLOSSOMS : LIGHT_BLOSSOMS;
  const midBranchLevels = [0.34, 0.5, 0.66];
  midBranchLevels.forEach((level, levelIndex) => {
    const y = bankY - (bankY - topY) * level;
    const trunkOffset = tree.bend * unit * (1.2 - level);
    const anchorX = centerX + trunkOffset;
    [-1, 1].forEach((direction) => {
      const reach = unit * (16 + levelIndex * 2.5);
      const branchPoints = [
        [anchorX, y],
        [anchorX + direction * unit * 4, y - unit * 0.8],
        [anchorX + direction * unit * 9, y - unit * 3.8],
        [anchorX + direction * reach * 0.78, y - unit * 8],
        [anchorX + direction * reach, y - unit * 12],
      ];
      const branchWidth = unit * (2.1 - levelIndex * 0.15);
      const branchBase = branchPoints.slice(0, 3);
      const twigDirection = direction;
      const twigPoints = [
        branchPoints[3],
        [branchPoints[3][0] + twigDirection * unit * 3, branchPoints[3][1] - unit * 2.8],
        [branchPoints[3][0] + twigDirection * unit * 5.2, branchPoints[3][1] - unit * 6],
      ];

      const clusterSize = unit * (levelIndex === 1 ? 1.7 : 1.45);
      const clusterSeeds = levelIndex * 20 + (direction > 0 ? 7 : 0) + index * 31;
      [
        [branchPoints[3][0] + direction * unit * 2, branchPoints[3][1] - unit * 2, clusterSize * 0.85],
        [branchPoints[4][0] + direction * unit * 2, branchPoints[4][1] - unit * 2, clusterSize],
      ].forEach(([clusterX, clusterY, size], clusterIndex) => {
        const seed = clusterSeeds + clusterIndex * 3;
        drawCanopy(ctx, clusterX + unit, clusterY + unit, size, [colors[0], colors[0], colors[1]], seed);
        drawCanopy(ctx, clusterX, clusterY, size * 0.72, [colors[1], colors[2], colors[1]], seed + 2);
        drawCanopy(ctx, clusterX - unit, clusterY - unit, size * 0.42, [colors[2], colors[3], colors[2]], seed + 4);
      });

      drawOrganicStroke(ctx, branchBase, outline, branchWidth + unit * 2.2);
      drawOrganicStroke(ctx, branchBase, trunk, branchWidth + unit * 1.2);
      drawOrganicStroke(ctx, branchPoints, outline, branchWidth + unit);
      drawOrganicStroke(ctx, branchPoints, trunk, branchWidth);
      drawOrganicStroke(ctx, branchPoints, woodLight, Math.max(2, unit * 0.65));
      drawOrganicStroke(ctx, twigPoints, outline, unit * 1.15 + 1);
      drawOrganicStroke(ctx, twigPoints, trunk, unit * 1.15);
      drawOrganicStroke(ctx, twigPoints, woodLight, Math.max(1, unit * 0.35));
    });
  });

  branchPaths.forEach((branchPath, branchIndex) => {
    const points = branchPath.map(([column, row]) => [
      centerX + column * unit * 2.15,
      topY + row * unit * 2.3,
    ]);
    const primaryWidth = unit * (branchIndex < 2 ? 3.2 : 2.4);
    drawOrganicStroke(ctx, points, outline, primaryWidth + unit);
    drawOrganicStroke(ctx, points, trunk, primaryWidth);
    drawOrganicStroke(ctx, points, woodLight, Math.max(2, unit * 0.8));

    for (let segment = 1; segment < points.length; segment += 1) {
      const [x, y] = points[segment];
      const branchDirection = branchPath[branchPath.length - 1][0] >= branchPath[0][0] ? 1 : -1;
      [-1, 1].forEach((side, forkIndex) => {
        const direction = branchDirection * (forkIndex === 0 ? 1 : -0.55);
        const twigs = [
          [x, y],
          [x + direction * unit * 1.8, y - unit * (side > 0 ? 1.8 : 0.9)],
          [x + direction * unit * 3.2, y - unit * (side > 0 ? 3.3 : 2.4)],
          [x + direction * unit * 4.4, y - unit * (side > 0 ? 4.4 : 3.7)],
        ];
        drawOrganicStroke(ctx, twigs, outline, unit * 1.1 + 1);
        drawOrganicStroke(ctx, twigs, trunk, unit * 1.1);
        if (segment % 2 === 0) {
          const microTwig = [
            twigs[1],
            [twigs[1][0] + direction * unit, twigs[1][1] - unit * 1.2],
            [twigs[1][0] + direction * unit * 1.8, twigs[1][1] - unit * 2],
          ];
          drawOrganicStroke(ctx, microTwig, outline, Math.max(2, unit * 0.65));
          drawOrganicStroke(ctx, microTwig, trunk, Math.max(1, unit * 0.4));
        }
      });
    }
  });

  canopyAnchors.forEach(([column, row], anchorIndex) => {
    const x = centerX + column * unit * 2.15;
    const y = topY + row * unit * 2.3;
    const size = unit * (anchorIndex % 3 === 0 ? 1.1 : 0.86);
    const seed = anchorIndex + index * 3 + Math.floor(time / 5000);
    drawCanopy(ctx, x + unit, y + unit, size, [colors[0], colors[0], colors[1]], seed);
    drawCanopy(ctx, x, y, size * 0.72, [colors[1], colors[2], colors[1]], seed + 2);
    drawCanopy(ctx, x - unit, y - unit, size * 0.42, [colors[2], colors[3], colors[2]], seed + 4);
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
  ctx.fillStyle = dark ? '#b58a68' : '#e2c9a1';
  ctx.beginPath();
  ctx.moveTo(0, shoreTop);
  for (let x = 0; x <= width; x += block * 2) {
    const y = shoreTop + Math.sin(x * 0.014) * block * 0.7;
    ctx.lineTo(x, y);
  }
  for (let x = width; x >= 0; x -= block * 2) {
    const y = riverTop + Math.sin(x * 0.011 + 1.8) * block * 0.7;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = dark ? '#80604f' : '#b5936b';
  for (let x = block; x < width; x += block * 7) {
    const y = shoreTop + block * (2 + ((x / block) % 4));
    ctx.fillRect(x, y, block * 2, Math.max(2, block / 2));
    ctx.fillRect(x + block * 3, y + block * 2, block, Math.max(2, block / 3));
  }

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
  ctx.fillStyle = dark ? 'rgba(17, 35, 46, 0.65)' : 'rgba(71, 108, 128, 0.28)';
  ctx.fillRect(0, riverTop - block, width, block * 2);
}

function drawBushes(ctx, width, height, theme) {
  const dark = theme === 'dark';
  const block = Math.max(3, Math.round(width / 170));
  const shoreY = height * 0.69;
  const positions = [0.16, 0.29, 0.48, 0.76, 0.88];
  const palettes = dark
    ? ['#1f513e', '#2d6a4f', '#40916c']
    : ['#24553e', '#2d6a4f', '#52b788'];

  positions.forEach((position, index) => {
    const x = position * width;
    const y = shoreY + Math.sin(index * 2.7) * block;
    const size = block * (index % 2 === 0 ? 2.8 : 2.3);
    ctx.fillStyle = palettes[0];
    ctx.fillRect(x - size * 1.35, y, size * 2.7, size * 0.9);
    ctx.fillRect(x - size, y - size * 0.65, size * 2, size * 0.8);
    ctx.fillRect(x - size * 0.4, y - size * 1.15, size * 0.9, size * 0.7);
    ctx.fillStyle = palettes[1];
    ctx.fillRect(x - size * 0.9, y - size * 0.5, size * 0.9, size * 0.65);
    ctx.fillRect(x + size * 0.1, y - size * 0.9, size, size * 0.75);
    ctx.fillStyle = palettes[2];
    ctx.fillRect(x - size * 0.45, y - size * 0.85, size * 0.55, size * 0.45);
    ctx.fillRect(x + size * 0.55, y - size * 0.35, size * 0.45, size * 0.45);
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
