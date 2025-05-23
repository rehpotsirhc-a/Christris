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

toggleHold.addEventListener('change', () => {
  document.getElementById('hold').style.display = toggleHold.checked ? 'flex' : 'none';
});
toggleNext.addEventListener('change', () => {
  document.getElementById('next').style.display = toggleNext.checked ? 'flex' : 'none';
});
toggleInfo.addEventListener('change', () => {
  document.getElementById('info').style.display = toggleInfo.checked ? 'flex' : 'none';
});

// Store default and working color sets
const defaultColors = {
  'I': 'Cyan',
  'O': 'Gold',
  'T': 'BlueViolet',
  'S': 'LawnGreen',
  'Z': 'Red',
  'J': 'DodgerBlue',
  'L': 'Orange',
};
let colors = { ...defaultColors };
let isUnifiedWhite = false;

// Utility: Convert color names to hex
function rgbToHex(colorName) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = colorName;
  return ctx.fillStyle;
}

// Color Picker Generator
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

// Unify Colors Button Logic
const unifyButton = document.getElementById('unify-colors');
if (unifyButton) {
  unifyButton.addEventListener('click', () => {
    if (!isUnifiedWhite) {
      // Set all to white
      for (const key in colors) colors[key] = '#FFFFFF';
      unifyButton.textContent = 'Set All Colors to Default';
    } else {
      // Restore original
      for (const key in colors) colors[key] = defaultColors[key];
      unifyButton.textContent = 'Set All Colors to White';
    }

    // Update color pickers
    const inputs = document.querySelectorAll('#color-pickers input[type="color"]');
    inputs.forEach(input => {
      const name = input.getAttribute('data-name');
      input.value = rgbToHex(colors[name]);
    });

    isUnifiedWhite = !isUnifiedWhite;
  });
  
}

for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) playfield[row][col] = 0;
}

const tetrominos = {
  'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  'J': [[1,0,0],[1,1,1],[0,0,0]],
  'L': [[0,0,1],[1,1,1],[0,0,0]],
  'O': [[1,1],[1,1]],
  'S': [[0,1,1],[1,1,0],[0,0,0]],
  'Z': [[1,1,0],[0,1,1],[0,0,0]],
  'T': [[0,1,0],[1,1,1],[0,0,0]]
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSequence() {
  const sequence = ['I','J','L','O','S','T','Z'];
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

  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0;) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      for (let r = row; r > 0; r--) {
  for (let c = 0; c < playfield[r].length; c++) {
    playfield[r][c] = playfield[r - 1][c];
  }
}
// Clear top row explicitly:
playfield[0].fill(0);
    } else row--;
  }

  if (linesCleared > 0) {
    lineCount += linesCleared;
    combo++;
    score += linesCleared * 100 + combo * 50;
  } else {
    combo = 0;
  }

  updateInfo();
tetromino = nextTetromino;
nextTetromino = getNextTetromino();
  heldThisTurn = false;
  updatePreview();
}

function updateInfo() {
  document.querySelector('#info').innerHTML = `

  `;
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);

  // Create restart button
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.id = 'restart-button';
  restartBtn.style.position = 'absolute';
  restartBtn.style.left = `${canvas.offsetLeft + canvas.width / 2 - 60}px`;
  restartBtn.style.top = `${canvas.offsetTop + canvas.height / 2 + 40}px`;


  document.body.appendChild(restartBtn);

  restartBtn.addEventListener('click', () => {
    document.body.removeChild(restartBtn);
    resetGame();
  });
}

function resetGame() {
  // Clear playfield
  for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }

  // Reset game state
  tetrominoSequence.length = 0;
  tetromino = getNextTetromino();
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
  rAF = requestAnimationFrame(loop);
}

function updatePreview() {
  const canvasNext = document.createElement('canvas');
  canvasNext.width = 150;
  canvasNext.height = 150;
  const ctxNext = canvasNext.getContext('2d');
  const preview = document.getElementById('next');
  preview.innerHTML = '';
  preview.appendChild(canvasNext);

  const matrix = nextTetromino.matrix;
  const color = colors[nextTetromino.name];
  const blockSize = 30;
  ctxNext.fillStyle = color;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctxNext.fillRect(c * blockSize, r * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }
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
let nextTetromino = getNextTetromino();
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

  // Draw placed blocks
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
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

let fallDelay = 50;
if (speedMode) {
  fallDelay = Math.max(5, 90 - Math.floor(score / 100));
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

document.addEventListener('keydown', function(e) {
  

  if (gameOver || paused) return;

  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
  }

  if (e.which === 38) {
    const rotated = rotate(tetromino.matrix);
    if (isValidMove(rotated, tetromino.row, tetromino.col)) tetromino.matrix = rotated;
  }

  if (e.which === 40) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
    } else tetromino.row = row;
  }

  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !heldThisTurn) {
    if (!hold) {
      hold = tetromino;
      tetromino = nextTetromino;
      nextTetromino = getNextTetromino();
    } else {
      [tetromino, hold] = [hold, tetromino];
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
      score += 2;
    }
    placeTetromino();
    updateInfo();
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


let speedMode = false;
const speedToggle = document.getElementById('speed-mode-toggle');

window.addEventListener('load', () => {
  // ...existing code
  const savedSpeedMode = localStorage.getItem('speedMode') === 'true';
  speedToggle.checked = savedSpeedMode;
  speedMode = savedSpeedMode;
});

speedToggle.addEventListener('change', () => {
  speedMode = speedToggle.checked;
  localStorage.setItem('speedMode', speedMode);
});
