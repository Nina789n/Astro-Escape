/* Astro Escape - with 3 Levels and Game Over overlay */

const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const startScreen = document.getElementById("startScreen");
const countdownText = document.getElementById("countdown");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalScoreEl = document.getElementById("finalScore");
const bestScoreEl = document.getElementById("bestScore");
const restartBtn = document.getElementById("restartBtn");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const levelDisplay = document.getElementById("level");
const difficultyBadge = document.getElementById("difficultyBadge");

let selectedDifficulty = "medium";
let playerX = 180;
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;

let spawnRate = 1600;
let blockSpeedBase = 1.6;
let meteors = [];
let spawnIntervalId = null;
let rafId = null;
let lastTimestamp = 0;
let highScore = parseInt(localStorage.getItem("astroEscapeHighScore")) || 0;

// Difficulty buttons
document.querySelectorAll(".difficulty").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.mode;
    applyDifficulty(selectedDifficulty);
    startScreen.classList.add("hidden");
    startCountdown();
    updateDifficultyBadge();
  });
});

function applyDifficulty(mode) {
  if (mode === "easy") {
    spawnRate = 2300;
    blockSpeedBase = 1.0;
  } else if (mode === "medium") {
    spawnRate = 1600;
    blockSpeedBase = 1.8;
  } else if (mode === "hard") {
    spawnRate = 1000;
    blockSpeedBase = 2.8;
  }
}

// Player movement
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  if (e.key === "ArrowLeft" && playerX > 0) {
    playerX -= 40;
    player.style.left = playerX + "px";
  } else if (e.key === "ArrowRight" && playerX < 360) {
    playerX += 40;
    player.style.left = playerX + "px";
  }
});

// Restart button
restartBtn.addEventListener("click", restartGame);
document.addEventListener("keydown", (e) => {
  if ((e.key === "r" || e.key === "R") && !gameRunning && score > 0) {
    restartGame();
  }
});

// Countdown
function startCountdown() {
  countdownText.classList.remove("hidden");
  let count = 3;
  countdownText.textContent = count;
  const t = setInterval(() => {
    count--;
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(t);
      countdownText.textContent = "GO!";
      setTimeout(() => countdownText.classList.add("hidden"), 500);
      startGame();
    }
  }, 1000);
}

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  playerX = 180;
  player.style.left = playerX + "px";
  updateScore();
  updateLives();
  updateLevel();
  applyDifficulty(selectedDifficulty);

  clearAllMeteors();

  gameRunning = true;
  lastTimestamp = 0;
  createStars();
  resetSpawnInterval();
  rafId = requestAnimationFrame(gameLoop);
}

function resetSpawnInterval() {
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(createMeteor, spawnRate);
}

function createMeteor() {
  if (!gameRunning) return;
  const el = document.createElement("div");
  el.className = "meteor";
  const x = Math.floor(Math.random() * 10) * 40;
  el.style.left = x + "px";
  el.style.top = "0px";
  gameArea.appendChild(el);

  const speed = blockSpeedBase + level * 0.6 + Math.random() * 0.6;
  meteors.push({ el, x, y: 0, speed });
}

function gameLoop(timestamp) {
  if (!gameRunning) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed * (delta / 16);
    m.el.style.top = m.y + "px";

    // Collision
    if (m.y + 40 >= 460 && m.x < playerX + 40 && m.x + 40 > playerX) {
      explodePlayer();
      loseLife();
      m.el.remove();
      meteors.splice(i, 1);
      continue;
    }

    // Safe pass
    if (m.y > 500) {
      m.el.remove();
      meteors.splice(i, 1);
      score++;
      updateScore();
      checkLevelProgression();
    }
  }

  rafId = requestAnimationFrame(gameLoop);
}

// --- Levels ---
function checkLevelProgression() {
  if (score >= 50 && level < 3) {
    level = 3;
    spawnRate = Math.max(500, spawnRate - 400);
    resetSpawnInterval();
    updateLevel();
  } else if (score >= 20 && level < 2) {
    level = 2;
    spawnRate = Math.max(800, spawnRate - 400);
    resetSpawnInterval();
    updateLevel();
  }
}

// --- UI updates ---
function loseLife() {
  lives--;
  updateLives();
  if (lives <= 0) endGame();
}
function updateScore() { scoreDisplay.textContent = "Score: " + score; }
function updateLives() { livesDisplay.textContent = "Lives: " + "❤️".repeat(Math.max(0, lives)); }
function updateLevel() { levelDisplay.textContent = "Level: " + level; }
function updateDifficultyBadge() { difficultyBadge.textContent = "Mode: " + selectedDifficulty.toUpperCase(); }

function explodePlayer() {
  player.style.background =
    "url('https://img.icons8.com/emoji/48/collision-emoji.png') no-repeat center";
  player.style.backgroundSize = "cover";
  setTimeout(() => {
    if (lives > 0) {
      player.style.background =
        "url('https://img.icons8.com/ios-filled/50/00eaff/rocket.png') no-repeat center";
      player.style.backgroundSize = "cover";
    }
  }, 500);
}

function endGame() {
  gameRunning = false;
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  if (rafId) cancelAnimationFrame(rafId);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("astroEscapeHighScore", highScore);
  }

  finalScoreEl.textContent = "Final Score: " + score;
  bestScoreEl.textContent = "Best Score: " + highScore;
  gameOverOverlay.classList.remove("hidden");
}

function restartGame() {
  gameOverOverlay.classList.add("hidden");
  startCountdown();
}

function clearAllMeteors() {
  meteors.forEach((m) => m.el.remove());
  meteors = [];
}

function createStars() {
  const existing = gameArea.querySelectorAll(".star");
  existing.forEach((s) => s.remove());
  for (let i = 0; i < 40; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.top = Math.random() * 500 + "px";
    star.style.left = Math.random() * 400 + "px";
    gameArea.appendChild(star);
  }
}

/* Initialize */
applyDifficulty(selectedDifficulty);
updateDifficultyBadge();
updateScore();
updateLives();
updateLevel();




