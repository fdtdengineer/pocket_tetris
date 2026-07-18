'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const COLORS = {
  I: '#27d4ff',
  J: '#4974ff',
  L: '#ff9b3d',
  O: '#ffd84d',
  S: '#55e080',
  T: '#b16cff',
  Z: '#ff5f78',
};

const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};

const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

let board = createBoard();
let current = null;
let bag = [];
let nextQueue = [];
let heldType = null;
let canHold = true;
let score = 0;
let lines = 0;
let level = 1;
let dropInterval = 850;
let dropAccumulator = 0;
let lastTime = 0;
let running = false;
let paused = false;
let gameOver = false;
let animationFrame = 0;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function refillBag() {
  bag.push(...shuffle(Object.keys(SHAPES)));
}

function pullType() {
  if (bag.length === 0) refillBag();
  return bag.shift();
}

function ensureQueue() {
  while (nextQueue.length < 3) nextQueue.push(pullType());
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function spawnPiece(type = null) {
  ensureQueue();
  const pieceType = type || nextQueue.shift();
  ensureQueue();
  const matrix = cloneMatrix(SHAPES[pieceType]);
  current = {
    type: pieceType,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: -getTopPadding(matrix),
  };
  canHold = true;

  if (collides(current.matrix, current.x, current.y)) {
    endGame();
  }
  drawSidePanels();
}

function getTopPadding(matrix) {
  let padding = 0;
  for (const row of matrix) {
    if (row.some(Boolean)) break;
    padding += 1;
  }
  return padding;
}

function collides(matrix, offsetX, offsetY) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;
      const boardX = offsetX + x;
      const boardY = offsetY + y;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }
  return false;
}

function mergePiece() {
  current.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const boardY = current.y + y;
      const boardX = current.x + x;
      if (boardY >= 0) board[boardY][boardX] = current.type;
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(90, 850 - (level - 1) * 65);
    updateHud();
  }
}

function stepDown(manual = false) {
  if (!running || paused || gameOver) return;
  current.y += 1;
  if (collides(current.matrix, current.x, current.y)) {
    current.y -= 1;
    lockPiece();
  } else if (manual) {
    score += 1;
    updateHud();
  }
}

function lockPiece() {
  mergePiece();
  clearLines();
  spawnPiece();
}

function move(direction) {
  if (!running || paused || gameOver) return;
  current.x += direction;
  if (collides(current.matrix, current.x, current.y)) current.x -= direction;
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function rotate() {
  if (!running || paused || gameOver) return;
  const rotated = rotateMatrix(current.matrix);
  const originalX = current.x;
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    current.x = originalX + kick;
    if (!collides(rotated, current.x, current.y)) {
      current.matrix = rotated;
      return;
    }
  }
  current.x = originalX;
}

function hardDrop() {
  if (!running || paused || gameOver) return;
  let distance = 0;
  while (!collides(current.matrix, current.x, current.y + 1)) {
    current.y += 1;
    distance += 1;
  }
  score += distance * 2;
  updateHud();
  lockPiece();
}

function hold() {
  if (!running || paused || gameOver || !canHold) return;
  const outgoing = current.type;
  if (heldType) {
    const incoming = heldType;
    heldType = outgoing;
    spawnPiece(incoming);
  } else {
    heldType = outgoing;
    spawnPiece();
  }
  canHold = false;
  drawSidePanels();
}

function ghostY() {
  let y = current.y;
  while (!collides(current.matrix, current.x, y + 1)) y += 1;
  return y;
}

function drawCell(targetCtx, x, y, size, color, alpha = 1) {
  targetCtx.save();
  targetCtx.globalAlpha = alpha;
  targetCtx.fillStyle = color;
  targetCtx.fillRect(x + 1, y + 1, size - 2, size - 2);
  targetCtx.fillStyle = 'rgba(255,255,255,0.22)';
  targetCtx.fillRect(x + 3, y + 3, size - 6, Math.max(2, size * 0.12));
  targetCtx.strokeStyle = 'rgba(255,255,255,0.14)';
  targetCtx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
  targetCtx.restore();
}

function drawBoard() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.fillStyle = '#0d1326';
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(COLS * BLOCK, y * BLOCK);
    ctx.stroke();
  }

  board.forEach((row, y) => {
    row.forEach((type, x) => {
      if (type) drawCell(ctx, x * BLOCK, y * BLOCK, BLOCK, COLORS[type]);
    });
  });

  if (!current) return;

  const projectionY = ghostY();
  current.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value || projectionY + y < 0) return;
      drawCell(ctx, (current.x + x) * BLOCK, (projectionY + y) * BLOCK, BLOCK, COLORS[current.type], 0.18);
    });
  });

  current.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value || current.y + y < 0) return;
      drawCell(ctx, (current.x + x) * BLOCK, (current.y + y) * BLOCK, BLOCK, COLORS[current.type]);
    });
  });
}

function drawPreview(targetCtx, canvas, type, slot = 0, slotHeight = canvas.height) {
  if (!type) return;
  const matrix = SHAPES[type];
  const cell = Math.min(24, Math.floor(Math.min(canvas.width / 5, slotHeight / 5)));
  const width = matrix[0].length * cell;
  const height = matrix.length * cell;
  const originX = (canvas.width - width) / 2;
  const originY = slot * slotHeight + (slotHeight - height) / 2;

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawCell(targetCtx, originX + x * cell, originY + y * cell, cell, COLORS[type]);
    });
  });
}

function drawSidePanels() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

  const slotHeight = nextCanvas.height / 3;
  nextQueue.slice(0, 3).forEach((type, index) => drawPreview(nextCtx, nextCanvas, type, index, slotHeight));
  if (heldType) drawPreview(holdCtx, holdCanvas, heldType, 0, holdCanvas.height);
}

function updateHud() {
  scoreEl.textContent = score.toLocaleString('ja-JP');
  linesEl.textContent = lines.toString();
  levelEl.textContent = level.toString();
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.add('is-visible');
}

function hideOverlay() {
  overlay.classList.remove('is-visible');
}

function startGame() {
  board = createBoard();
  bag = [];
  nextQueue = [];
  heldType = null;
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 850;
  dropAccumulator = 0;
  lastTime = performance.now();
  running = true;
  paused = false;
  gameOver = false;
  pauseButton.textContent = 'II';
  updateHud();
  ensureQueue();
  spawnPiece();
  hideOverlay();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  gameOver = true;
  showOverlay('Game Over', `スコア ${score.toLocaleString('ja-JP')}。もう一度挑戦しますか？`, 'Play Again');
}

function togglePause() {
  if (!running || gameOver) return;
  paused = !paused;
  pauseButton.textContent = paused ? '▶' : 'II';
  if (paused) {
    showOverlay('Paused', 'ゲームを一時停止しています。', 'Resume');
  } else {
    hideOverlay();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(loop);
  }
}

function loop(time = 0) {
  if (!running || paused || gameOver) {
    drawBoard();
    return;
  }
  const delta = time - lastTime;
  lastTime = time;
  dropAccumulator += delta;
  if (dropAccumulator >= dropInterval) {
    stepDown(false);
    dropAccumulator = 0;
  }
  drawBoard();
  animationFrame = requestAnimationFrame(loop);
}

function performAction(action) {
  const actions = {
    left: () => move(-1),
    right: () => move(1),
    down: () => stepDown(true),
    rotate,
    hardDrop,
    hold,
  };
  actions[action]?.();
  drawBoard();
}

const repeatTimers = new Map();
function beginRepeatingAction(button) {
  const action = button.dataset.action;
  performAction(action);
  if (!['left', 'right', 'down'].includes(action)) return;

  const timeout = window.setTimeout(() => {
    const interval = window.setInterval(() => performAction(action), action === 'down' ? 55 : 85);
    repeatTimers.set(button, interval);
  }, 180);
  repeatTimers.set(button, timeout);
}

function stopRepeatingAction(button) {
  const timer = repeatTimers.get(button);
  if (timer) {
    clearTimeout(timer);
    clearInterval(timer);
  }
  repeatTimers.delete(button);
}

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    beginRepeatingAction(button);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => {
    button.addEventListener(name, () => stopRepeatingAction(button));
  });
});

document.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowDown: 'down',
    ArrowUp: 'rotate',
    ' ': 'hardDrop',
    c: 'hold',
    C: 'hold',
  };
  if (keyMap[event.key]) {
    event.preventDefault();
    performAction(keyMap[event.key]);
  }
  if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
    event.preventDefault();
    togglePause();
  }
});

startButton.addEventListener('click', () => {
  if (paused && running) togglePause();
  else startGame();
});

pauseButton.addEventListener('click', togglePause);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && running && !paused) togglePause();
});

window.addEventListener('contextmenu', (event) => {
  if (event.target.closest('.control-button')) event.preventDefault();
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

updateHud();
ensureQueue();
drawSidePanels();
drawBoard();
