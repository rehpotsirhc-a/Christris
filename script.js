const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];
const playfield = [];
let paused = false;
const pauseMenu = document.getElementById('pause-menu');
const toggleHold = document.getElementById('toggle-hold');
const toggleNext = document.getElementById('toggle-next');
const toggleInfo = document.getElementById('toggle-info');
let clearingLines = [];
let clearAnimationFrame = 0;
let isClearing = false;
let hardDropped = false;
let lastCollisionSoundTime = 0;
const collisionSoundCooldown = 800;
let lockDelayFrames = 120;
let lockCounter = 0;
let isTouchingGround = false;
const toggleMusic = document.getElementById('toggle-music');
const toggleShake = document.getElementById('toggle-shake');
let musicEnabled = localStorage.getItem('musicEnabled') === 'true';
toggleMusic.checked = musicEnabled;
let shakeEnabled = toggleShake.checked;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let highCombo = parseInt(localStorage.getItem('highCombo')) || 0;
let highLines = parseInt(localStorage.getItem('highLines')) || 0;
const speedToggle = document.getElementById('speed-mode-toggle');
let speedMode = speedToggle.checked;
const toggleClearAnimation = document.getElementById('toggle-clear-animation');
let clearAnimationEnabled = toggleClearAnimation.checked;


if (localStorage.getItem('clearAnimationEnabled') !== null) {
  clearAnimationEnabled = localStorage.getItem('clearAnimationEnabled') === 'true';
  toggleClearAnimation.checked = clearAnimationEnabled;
}


speedToggle.addEventListener('change', () => {
  speedMode = speedToggle.checked;
});


let lastCollisionTime = 0;
const collisionCooldown = 300;

const sounds = {
  move: new Audio('sounds/move.mp3'),
  rotate: new Audio('sounds/rotate.mp3'),
  harddrop: new Audio('sounds/harddrop.mp3'),
  place: new Audio('sounds/place.mp3'),
  collision: new Audio('sounds/collision.mp3'),
  clear: new Audio('sounds/clear.mp3'),
  pause: new Audio('sounds/pause.mp3'),
  hold: new Audio('sounds/hold.mp3'),
  gameover: new Audio('sounds/gameend.mp3'),
};

const backgroundMusic = new Audio('sounds/Tetris.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;

let musicStarted = false;

function startBackgroundMusic() {
  if (!musicStarted && !gameOver && musicEnabled && globalVolume > 0) {
    backgroundMusic.volume = globalVolume;
    backgroundMusic.play().catch((e) => {
      console.warn('Autoplay blocked until user interacts:', e);
    });
    musicStarted = true;
  }
}


const volumeSlider = document.getElementById('volume-slider');
const volumePercentage = document.getElementById('volume-percentage');
let globalVolume = parseFloat(localStorage.getItem('globalVolume')) || 0.5;

volumeSlider.value = globalVolume;
volumePercentage.textContent = Math.round(globalVolume * 100) + '%';

volumeSlider.addEventListener('input', () => {
  globalVolume = parseFloat(volumeSlider.value);
  localStorage.setItem('globalVolume', globalVolume);
  volumePercentage.textContent = Math.round(globalVolume * 100) + '%';

  backgroundMusic.volume = musicEnabled ? globalVolume : 0;
});


backgroundMusic.volume = musicEnabled ? globalVolume : 0;


document.addEventListener('click', startBackgroundMusic, { once: true });
document.addEventListener('keydown', startBackgroundMusic, { once: true });

function advanceTetromino() {
  tetromino = nextTetromino;
  nextTetrominos.push(getNextTetromino());
  nextTetromino = nextTetrominos.shift();
  updatePreview();
}

function playSound(sound) {
  const s = sounds[sound].cloneNode();
  s.volume = globalVolume;
  s.play().catch(err => {
    console.warn('Sound play failed:', err);
  });
}



toggleHold.addEventListener('change', () => {
  document.getElementById('hold').style.display = toggleHold.checked ? 'flex' : 'none';
});
toggleNext.addEventListener('change', () => {
  document.getElementById('next').style.display = toggleNext.checked ? 'flex' : 'none';
});
toggleInfo.addEventListener('change', () => {
  document.getElementById('info').style.display = toggleInfo.checked ? 'flex' : 'none';
});
toggleHold.checked = true;
toggleNext.checked = true;
toggleInfo.checked = true;

function shakeCanvas(direction) {
  const now = Date.now();
  if (now - lastCollisionTime < collisionCooldown) return;

  lastCollisionTime = now;
  if (direction === 'left' || direction === 'right') {
    playSound('collision');
  }


  if (!shakeEnabled) return;

  const container = document.getElementById('game-container');
  let transform;

  if (direction === 'left') {
    transform = 'translateX(-8px)';
  } else if (direction === 'right') {
    transform = 'translateX(8px)';
  } else if (direction === 'down') {
    transform = 'translateY(8px)';
  } else {
    transform = 'none';
  }

  container.style.transform = transform;

  setTimeout(() => {
    container.style.transform = 'translate(0, 0)';
  }, 50);
}



const defaultColors = {
  'I': 'Cyan',
  'O': 'Gold',
  'T': 'BlueViolet',
  'S': 'LawnGreen',
  'Z': 'Red',
  'J': 'DodgerBlue',
  'L': 'Orange',
  'N': 'Red',
};
let colors = { ...defaultColors };
let isUnifiedWhite = false;

function rgbToHex(colorName) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = colorName;
  return ctx.fillStyle;
}

function createColorPickers() {
  const container = document.getElementById('color-pickers');
  if (!container) return;
  container.innerHTML = '';

  for (const name in colors) {
    const label = document.createElement('label');
    label.textContent = `${name}: `;
    label.style.marginRight = '10px';

    const input = document.createElement('input');
    input.type = 'color';
    input.setAttribute('data-name', name);
    input.value = rgbToHex(colors[name]);

    localStorage.setItem('customColors', JSON.stringify(colors));

    input.addEventListener('input', () => {
      colors[name] = input.value;
      isUnifiedWhite = false;
      unifyButton.textContent = 'Set All Colors to White';
    });

    label.appendChild(input);
    container.appendChild(label);
  }

  const savedColors = localStorage.getItem('customColors');
  if (savedColors) {
    colors = JSON.parse(savedColors);
    isUnifiedWhite = Object.values(colors).every(c => c.toLowerCase() === '#ffffff');
  }

}

const unifyButton = document.getElementById('unify-colors');
if (unifyButton) {
  unifyButton.addEventListener('click', () => {
    if (!isUnifiedWhite) {
      for (const key in colors) colors[key] = '#FFFFFF';
      unifyButton.textContent = 'Set All Colors to Default';
    } else {
      for (const key in colors) colors[key] = defaultColors[key];
      unifyButton.textContent = 'Set All Colors to White';
    }

    const inputs = document.querySelectorAll('#color-pickers input[type="color"]');
    inputs.forEach(input => {
      const name = input.getAttribute('data-name');
      input.value = rgbToHex(colors[name]);
    });

    isUnifiedWhite = !isUnifiedWhite;
    localStorage.setItem('isUnifiedWhite', JSON.stringify(isUnifiedWhite));
  });

}

for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) playfield[row][col] = 0;
}

const tetrominos = {
  'I': [[0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]],

  'J': [[1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]],

  'L': [[0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]],

  'O': [[1, 1],
        [1, 1]],

  'S': [[0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]],

  'Z': [[1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]],

  'T': [[0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]],

};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z',];
  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
  if (tetrominoSequence.length === 0) generateSequence();
  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;
  return { name, matrix, row, col };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  return matrix.map((row, i) =>
    row.map((_, j) => matrix[N - j][i])
  );
}

function rotateCounterClockwise(matrix) {
  const N = matrix.length - 1;
  return matrix.map((row, i) =>
    row.map((_, j) => matrix[j][N - i])
  );
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        (cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          playfield[cellRow + row][cellCol + col])
      ) return false;
    }
  }
  return true;
}

function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) return showGameOver();
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  if (!hardDropped) {
    playSound('place');
  }

  function proceedAfterClear() {
    advanceTetromino();
    heldThisTurn = false;


  }

  clearingLines = [];
  for (let row = playfield.length - 1; row >= 0; row--) {
    if (playfield[row].every(cell => !!cell)) {
      clearingLines.push(row);
    }

  }

  if (clearingLines.length > 0) {
    isClearing = true;
    clearAnimationFrame = 0;
    playSound('clear');
  } else {
    combo = 0;
    proceedAfterClear();
  }
  updateInfo();
  updatePreview();
  heldThisTurn = false;
  updatePreview();
  hardDropped = false;
}

function updateInfo() {
  document.querySelector('#info').innerHTML = `
    <p>Score: ${score}</p>
    <p>Combo: ${combo}</p>
    <p>Lines: ${lineCount}</p>
  `;
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;

  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;

  playSound('place');
  playSound('gameover');

  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;

  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.id = 'restart-button';

  document.body.appendChild(restartBtn);

  restartBtn.addEventListener('click', () => {
    document.body.removeChild(restartBtn);
    resetGame();
  });
}

function resetGame() {
  for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }

  tetrominoSequence.length = 0;
  generateSequence();
  tetromino = getNextTetromino();
  nextTetrominos = [getNextTetromino(), getNextTetromino()];
  nextTetromino = getNextTetromino();

  hold = null;
  heldThisTurn = false;
  score = 0;
  combo = 0;
  lineCount = 0;
  gameOver = false;
  updateInfo();
  updatePreview();
  updateHoldDisplay();

  if (musicEnabled) {
    backgroundMusic.play().catch(e => {
      console.warn('Could not autoplay background music:', e);
    });
    musicStarted = true;
  }

  rAF = requestAnimationFrame(loop);
}

function updatePreview() {
  const preview = document.getElementById('next');
  preview.innerHTML = '';

  const previewQueue = [nextTetromino, ...nextTetrominos];

  previewQueue.forEach(tet => {
    const canvasNext = document.createElement('canvas');
    canvasNext.width = 120;
    canvasNext.height = 120;

    const ctxNext = canvasNext.getContext('2d');
    const matrix = tet.matrix;
    const color = colors[tet.name];
    const blockSize = 30;

    ctxNext.fillStyle = color;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          ctxNext.fillRect(c * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
        }
      }
    }

    preview.appendChild(canvasNext);
  });
}



function updateHoldDisplay() {
  const holdDiv = document.getElementById('hold');
  holdDiv.innerHTML = '';
  if (!hold) return;

  const canvasHold = document.createElement('canvas');
  canvasHold.width = 150;
  canvasHold.height = 150;
  const ctxHold = canvasHold.getContext('2d');

  const matrix = hold.matrix;
  const color = colors[hold.name];
  const blockSize = 30;

  ctxHold.fillStyle = color;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctxHold.fillRect(c * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }
  holdDiv.appendChild(canvasHold);
}

let count = 0;
let tetromino = getNextTetromino();
nextTetrominos = [getNextTetromino(), getNextTetromino(), getNextTetromino(), getNextTetromino()];
nextTetromino = nextTetrominos.shift();


let hold = null;
let heldThisTurn = false;
let rAF = null;
let gameOver = false;
let score = 0;
let combo = 0;
let lineCount = 0;

updateInfo();
updatePreview();

function loop() {
  rAF = requestAnimationFrame(loop);
  if (paused || gameOver) return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }
  if (isClearing) {
    if (clearAnimationEnabled) {
      clearAnimationFrame++;

      for (const row of clearingLines) {
        context.fillStyle = clearAnimationFrame % 10 < 5 ? 'white' : 'black';
        context.fillRect(0, row * grid, 10 * grid, grid - 1);
      }

      if (clearAnimationFrame > 40) {
        finalizeLineClear();
      }
    } else {
      finalizeLineClear();
    }

    if (clearAnimationFrame > 22) {
      clearingLines.sort((a, b) => a - b);

      for (let i = 0; i < clearingLines.length; i++) {
        const row = clearingLines[i];

        for (let r = row; r > 0; r--) {
          playfield[r] = [...playfield[r - 1]];
        }
        playfield[0] = new Array(10).fill(0);
      }

      const linesCleared = clearingLines.length;
      lineCount += linesCleared;
      combo++;
      score += linesCleared * 100 + combo * 50;

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }
      if (combo > highCombo) {
        highCombo = combo;
        localStorage.setItem('highCombo', highCombo);
      }
      if (lineCount > highLines) {
        highLines = lineCount;
        localStorage.setItem('highLines', highLines);
      }

      updateInfo();
      advanceTetromino();

      heldThisTurn = false;
      updatePreview();

      clearingLines = [];
      clearAnimationFrame = 0;
      isClearing = false;
    }

    return;
  }

  if (tetromino) {
    let ghostRow = tetromino.row;
    while (isValidMove(tetromino.matrix, ghostRow + 1, tetromino.col)) ghostRow++;

    context.globalAlpha = 0.3;
    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect((tetromino.col + col) * grid, (ghostRow + row) * grid, grid - 1, grid - 1);
        }
      }
    }
    context.globalAlpha = 1.0;

    let baseSpeed = 55;
    let minSpeed = 5;
    let fallDelay;

    if (speedMode) {
      let level = Math.floor(score / 500);
      fallDelay = Math.max(minSpeed, baseSpeed * Math.pow(0.9, level));
    } else {
      fallDelay = baseSpeed;
    }


    if (++count > fallDelay) {
      tetromino.row++;
      count = 0;

      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
        }
      }
    }
  }
}

function finalizeLineClear() {
  clearingLines.sort((a, b) => a - b);

  for (let i = 0; i < clearingLines.length; i++) {
    const row = clearingLines[i];
    for (let r = row; r > 0; r--) {
      playfield[r] = [...playfield[r - 1]];
    }
    playfield[0] = new Array(10).fill(0);
  }

  const linesCleared = clearingLines.length;
  lineCount += linesCleared;
  score += (linesCleared ** 2) * 100;
  combo += 1;
  updateInfo();
  isClearing = false;
  clearingLines = [];
  advanceTetromino();
}


function updatePauseMenuStats() {
  document.getElementById('pause-highs').innerHTML = `
    <p>High Score:${highScore}</p>
    <p>High Combo: ${highCombo}</p>
    <p>High Lines: ${highLines}</p>
  `;
}


document.addEventListener('keydown', function (e) {
  if (e.code === 'Escape') {
    paused = !paused;
    playSound('pause');
    pauseMenu.classList.toggle('hidden', !paused);

    if (paused) {
      if (musicEnabled) backgroundMusic.pause();
      createColorPickers();
      updatePauseMenuStats();
    } else {
      if (musicEnabled) backgroundMusic.play();
    }
  }

  function updatePauseMenuStats() {
    document.getElementById('pause-highs').innerHTML = `
    <p>High Score: ${highScore}</p>
    <p>Top Combo: ${highCombo}</p>
    <p>Most Lines: ${highLines}</p>
  `;
  }

  document.addEventListener('keydown', (e) => {
    if (paused || gameOver || [e.code]) return;

    keysHeld[e.code] = true;

    handleKeyPress(e.code);
    keyRepeatTimers[e.code] = {
      delayTimer: setTimeout(() => {
        keyRepeatTimers[e.code].repeatInterval = setInterval(() => {
          handleKeyPress(e.code);
        }, repeatRate);
      }, repeatDelay)
    };
  });

  if (gameOver || paused || isClearing) return;

  if (e.which === 37 || e.which === 39) {
    const newCol = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;

    if (isValidMove(tetromino.matrix, tetromino.row, newCol)) {
      tetromino.col = newCol;
      playSound('move');
    } else {
      shakeCanvas(e.which === 37 ? 'left' : 'right');
    }
  }

  if (e.which === 38 || e.code === 'KeyD') {
    const rotated = rotate(tetromino.matrix);
    if (isValidMove(rotated, tetromino.row, tetromino.col)) {
      tetromino.matrix = rotated;
      lockStartTime = null;
      isTouchingGround = false;
      playSound('rotate');
    } else {
      const kicks = [-1, 1, -2, 2];
      for (let i = 0; i < kicks.length; i++) {
        const newCol = tetromino.col + kicks[i];
        if (isValidMove(rotated, tetromino.row, newCol)) {
          tetromino.col = newCol;
          tetromino.matrix = rotated;
          lockStartTime = null;
          isTouchingGround = false;
          playSound('rotate');
          break;
        }
      }
    }
  }


  if (e.which === 40 || e.code === 'Numpad5') {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
    } else {
      tetromino.row = row;
    }
  }

  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !heldThisTurn) {
    if (!hold) {
      playSound('hold')
      hold = tetromino;
      tetromino = nextTetromino;
      nextTetrominos.push(getNextTetromino());
      nextTetromino = nextTetrominos.shift();

    } else {
      [tetromino, hold] = [hold, tetromino]; playSound('hold');
    }

    tetromino.row = tetromino.name === 'I' ? -1 : -2;
    tetromino.col = Math.floor(playfield[0].length / 2 - Math.ceil(tetromino.matrix[0].length / 2));

    heldThisTurn = true;
    updateHoldDisplay();
    updatePreview();
  }

  if (e.which === 32) {
    while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
      tetromino.row++;
    }
    playSound('harddrop');
    shakeCanvas('down');
    placeTetromino();
  }
});

document.addEventListener('keydown', (e) => {
  if (paused || gameOver || isClearing) return;

  switch (e.key) {
    case 's':
      const ccwMatrix = rotateCounterClockwise(tetromino.matrix);
      if (isValidMove(ccwMatrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = ccwMatrix;
        playSound('rotate');
      }
      break;
  }
});

toggleHold.addEventListener('change', () => {
  const value = toggleHold.checked;
  document.getElementById('hold').style.display = value ? 'flex' : 'none';
  localStorage.setItem('showHold', value);
});

toggleNext.addEventListener('change', () => {
  const value = toggleNext.checked;
  document.getElementById('next').style.display = value ? 'flex' : 'none';
  localStorage.setItem('showNext', value);
});

toggleInfo.addEventListener('change', () => {
  const value = toggleInfo.checked;
  document.getElementById('info').style.display = value ? 'flex' : 'none';
  localStorage.setItem('showInfo', value);
});

window.addEventListener('load', () => {
  const holdVisible = localStorage.getItem('showHold') === 'true';
  const nextVisible = localStorage.getItem('showNext') === 'true';
  const infoVisible = localStorage.getItem('showInfo') === 'true';

  toggleHold.checked = holdVisible;
  toggleNext.checked = nextVisible;
  toggleInfo.checked = infoVisible;

  document.getElementById('hold').style.display = holdVisible ? 'flex' : 'none';
  document.getElementById('next').style.display = nextVisible ? 'flex' : 'none';
  document.getElementById('info').style.display = infoVisible ? 'flex' : 'none';


});

rAF = requestAnimationFrame(loop);

window.addEventListener('load', () => {
  const savedSpeedMode = localStorage.getItem('speedMode') === 'true';
  speedToggle.checked = savedSpeedMode;
  speedMode = savedSpeedMode;
});

speedToggle.addEventListener('change', () => {
  speedMode = speedToggle.checked;
  localStorage.setItem('speedMode', speedMode);
});

function isCollidingWithBlock(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const x = cellCol + col;
        const y = cellRow + row;

        if (x < 0 || x >= playfield[0].length || y >= playfield.length) continue;

        if (y >= 0 && playfield[y][x]) {
          return true;
        }
      }
    }
  }
  return false;
}

function isCollidingWithWall(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const x = cellCol + col;
        const y = cellRow + row;

        if (x < 0 || x >= playfield[0].length || y >= playfield.length || y < 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function resetHighStats() {
  highScore = 0;
  highCombo = 0;
  highLines = 0;
  localStorage.removeItem('highScore');
  localStorage.removeItem('highCombo');
  localStorage.removeItem('highLines');
  updatePauseMenuStats();
}

toggleMusic.addEventListener('change', () => {
  musicEnabled = toggleMusic.checked;
  if (musicEnabled && !paused) {
    backgroundMusic.play();
  } else {
    backgroundMusic.pause();
  }
});

if (musicEnabled && !gameOver) {
  backgroundMusic.play().catch(e => {
    console.warn('Could not autoplay background music:', e);
  });
  musicStarted = true;
}

toggleShake.addEventListener('change', () => {
  shakeEnabled = toggleShake.checked;
});

toggleMusic.addEventListener('change', () => {
  musicEnabled = toggleMusic.checked;
  localStorage.setItem('musicEnabled', musicEnabled);

  if (musicEnabled && !paused && !gameOver) {
    backgroundMusic.play().catch(e => console.warn('Could not play music:', e));
  } else {
    backgroundMusic.pause();
  }
});

volumeSlider.addEventListener('input', () => {
  globalVolume = parseFloat(volumeSlider.value);
  localStorage.setItem('globalVolume', globalVolume);
  backgroundMusic.volume = musicEnabled ? globalVolume : 0;
});

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 30;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (gameOver || paused || isClearing) return;

  touchEndX = e.changedTouches[0].clientX;
  touchEndY = e.changedTouches[0].clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < swipeThreshold && absY < swipeThreshold) {
    const rotated = rotate(tetromino.matrix);
    if (isValidMove(rotated, tetromino.row, tetromino.col)) {
      tetromino.matrix = rotated;
      lockStartTime = null;
      isTouchingGround = false;
      playSound('rotate');
    } else {
      const kicks = [-1, 1, -2, 2];
      for (let i = 0; i < kicks.length; i++) {
        const newCol = tetromino.col + kicks[i];
        if (isValidMove(rotated, tetromino.row, newCol)) {
          tetromino.col = newCol;
          tetromino.matrix = rotated;
          lockStartTime = null;
          isTouchingGround = false;
          playSound('rotate');
          break;
        }
      }
    }
    return;
  }

  if (absX > absY) {
    const newCol = deltaX > 0 ? tetromino.col + 1 : tetromino.col - 1;
    if (isValidMove(tetromino.matrix, tetromino.row, newCol)) {
      tetromino.col = newCol;
      playSound('move');
    } else {
      shakeCanvas(deltaX > 0 ? 'right' : 'left');
    }
  } else {
    if (deltaY > 0) {
      while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
        tetromino.row++;
      }
      playSound('harddrop');
      shakeCanvas('down');
      placeTetromino();
    } else {
      if (!heldThisTurn) {
        if (!hold) {
          playSound('hold');
          hold = tetromino;
          tetromino = nextTetromino;
          nextTetrominos.push(getNextTetromino());
          nextTetromino = nextTetrominos.shift();
        } else {
          [tetromino, hold] = [hold, tetromino];
          playSound('hold');
        }

        tetromino.row = tetromino.name === 'I' ? -1 : -2;
        tetromino.col = Math.floor(playfield[0].length / 2 - Math.ceil(tetromino.matrix[0].length / 2));
        heldThisTurn = true;
        updateHoldDisplay();
        updatePreview();
      }
    }
  }
}, { passive: true });

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    canvas.dataset.twoFingerTapStart = Date.now();
  }
}, { passive: true });

pauseMenu.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    pauseMenu.dataset.twoFingerTapStart = Date.now();
  }
}, { passive: true });

pauseMenu.addEventListener('touchend', (e) => {
  if (e.touches.length === 0 && e.changedTouches.length === 2) {
    const tapDuration = Date.now() - (pauseMenu.dataset.twoFingerTapStart || 0);
    if (tapDuration < 300) {
      paused = false;
      playSound('pause');
      pauseMenu.classList.add('hidden');
      if (musicEnabled) backgroundMusic.play();
    }
  }
}, { passive: true });


canvas.addEventListener('touchend', (e) => {
  if (e.touches.length === 0 && e.changedTouches.length === 2) {
    const tapDuration = Date.now() - (canvas.dataset.twoFingerTapStart || 0);
    if (tapDuration < 300) {
      paused = !paused;
      playSound('pause');
      pauseMenu.classList.toggle('hidden', !paused);

      if (paused) {
        if (musicEnabled) backgroundMusic.pause();
        createColorPickers();
        updatePauseMenuStats();
      } else {
        if (musicEnabled) backgroundMusic.play();
      }
    }
  }
}, { passive: true });

toggleClearAnimation.addEventListener('change', () => {
  clearAnimationEnabled = toggleClearAnimation.checked;
  localStorage.setItem('clearAnimationEnabled', clearAnimationEnabled);
});

