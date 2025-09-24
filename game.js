let board;
let score = 0;
let bestScore = 0;
const boardSize = 4;
const gameContainer = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("best-score");
const newGameButton = document.querySelector(".newGame");
let isGameOver = false;

// New: Create a single, reusable animation element
const scoreAnimDiv = document.createElement('div');
scoreAnimDiv.classList.add('score-animation');
document.body.appendChild(scoreAnimDiv);

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
    loadBestScore();
    setupNewGame();
});

// Restart the game
function restartGame() {
    setupNewGame();
    // Remove game over overlay if it exists
    const overlay = document.querySelector(".game-over-overlay");
    if (overlay) {
        overlay.remove();
    }
}

function loadBestScore() {
    const storedScore = localStorage.getItem("bestScore");
    if (storedScore !== null) {
        bestScore = Number(storedScore);
    }
    bestScoreDisplay.innerHTML = bestScore;
}

function updateBestScore() {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
        bestScoreDisplay.innerHTML = bestScore;
    }
}

function setupNewGame() {
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
    score = 0;
    isGameOver = false;
    scoreDisplay.innerHTML = score;
    renderBoard();
    
    addRandomTile();
    addRandomTile();
}

function addRandomTile() {
    if (isGameOver) return;
    let emptyCells = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }

    if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
        renderBoard();
        checkGameOver();
    }
}

function renderBoard() {
    gameContainer.innerHTML = ''; // Clear the boards
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const tileValue = board[r][c];
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            if (tileValue > 0) {
                cell.classList.add(`tile-${tileValue}`);
                cell.innerHTML = tileValue;
            }
            gameContainer.appendChild(cell);
        }
    }
}

// --- Modified updateScore to reuse the animation element ---
function updateScore(points) {
    // 1. Update the main score instantly
    score += points;
    scoreDisplay.innerHTML = score;
    updateBestScore();

    // 2. Update the animation element and reset its animation
    scoreAnimDiv.innerHTML = `+${points}`;
    const scorePos = scoreDisplay.getBoundingClientRect();
    scoreAnimDiv.style.top = `${scorePos.top}px`;
    scoreAnimDiv.style.left = `${scorePos.left}px`;
    
    // Force a CSS repaint to restart the animation
    scoreAnimDiv.classList.remove('score-animation');
    requestAnimationFrame(() => {
        scoreAnimDiv.classList.add('score-animation');
    });
}

// Unified movement logic
document.addEventListener("keydown", (event) => {
    if (isGameOver) return;
    
    let oldBoard = JSON.stringify(board);
    
    if (event.key === "ArrowUp" || event.key === "w") {
        moveUp();
    } else if (event.key === "ArrowDown" || event.key === "s") {
        moveDown();
    } else if (event.key === "ArrowLeft" || event.key === "a") {
        moveLeft();
    } else if (event.key === "ArrowRight" || event.key === "d") {
        moveRight();
    }

    let newBoard = JSON.stringify(board);
    if (oldBoard !== newBoard) {
        addRandomTile();
    }
});

function combineTiles(row) {
    let combined = false;
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            let points = row[i] * 2;
            row[i] = points;
            row[i + 1] = 0;
            updateScore(points);
            i++;
            combined = true;
        }
    }
    return { row, combined };
}

function filterAndShift(row) {
    let filteredRow = row.filter(val => val !== 0);
    let newRow = filteredRow.concat(Array(boardSize - filteredRow.length).fill(0));
    return newRow;
}

function moveUp() {
    for (let c = 0; c < boardSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = filterAndShift(col);
        let { row: combinedCol } = combineTiles(col);
        combinedCol = filterAndShift(combinedCol);
        
        for (let r = 0; r < boardSize; r++) {
            board[r][c] = combinedCol[r];
        }
    }
    renderBoard();
}

function moveDown() {
    for (let c = 0; c < boardSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col.reverse();
        col = filterAndShift(col);
        let { row: combinedCol } = combineTiles(col);
        combinedCol = filterAndShift(combinedCol);
        combinedCol.reverse();
        
        for (let r = 0; r < boardSize; r++) {
            board[r][c] = combinedCol[r];
        }
    }
    renderBoard();
}

function moveLeft() {
    for (let r = 0; r < boardSize; r++) {
        let row = board[r];
        row = filterAndShift(row);
        let { row: combinedRow } = combineTiles(row);
        board[r] = filterAndShift(combinedRow);
    }
    renderBoard();
}

function moveRight() {
    for (let r = 0; r < boardSize; r++) {
        let row = board[r];
        row.reverse();
        row = filterAndShift(row);
        let { row: combinedRow } = combineTiles(row);
        combinedRow = filterAndShift(combinedRow);
        board[r] = combinedRow.reverse();
    }
    renderBoard();
}

// Game Over logic
function checkGameOver() {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === 0) {
                return false;
            }
        }
    }
    
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize - 1; c++) {
            if (board[r][c] === board[r][c + 1]) {
                return false;
            }
        }
    }

    for (let c = 0; c < boardSize; c++) {
        for (let r = 0; r < boardSize - 1; r++) {
            if (board[r][c] === board[r + 1][c]) {
                return false;
            }
        }
    }

    isGameOver = true;
    displayGameOver();
    return true;
}

function displayGameOver() {
    const overlay = document.createElement('div');
    overlay.classList.add('game-over-overlay');

    const gameOverText = document.createElement('div');
    gameOverText.classList.add('game-over-text');
    gameOverText.innerHTML = 'Game Over';

    const tryAgainButton = document.createElement('div');
    tryAgainButton.classList.add('try-again-button');
    tryAgainButton.innerHTML = 'Try Again';
    tryAgainButton.onclick = restartGame;

    overlay.appendChild(gameOverText);
    overlay.appendChild(tryAgainButton);
    gameContainer.appendChild(overlay);
}