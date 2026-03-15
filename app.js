let selectedImgUrl = '';
let tiles = [null, 0, 1, 2, 3, 4, 5, 6, 7]; 
let emptyIndex = 0; 
let isShuffling = false;
let gameStarted = false;
let moveHistory = [];

window.showScreen = function(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove("active");
        s.style.display = "none";
    });

    const target = document.getElementById(id);
    if (target) {
        target.style.display = "flex";
        setTimeout(() => target.classList.add("active"), 50);
    }

    if (id === 'screen-game') renderBoard();
};

window.selectImg = function(el) {
    document.querySelectorAll('.image-grid img').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    selectedImgUrl = el.src;
    localStorage.setItem("selectedImage", el.src);
    document.getElementById('continue-btn').classList.remove('hidden');
};

function renderBoard() {
    const board = document.getElementById('board');
    if (!board) return;

    if (!isShuffling) {
        board.style.setProperty('--move-speed', '500ms');
    }

    const isMobile = window.innerWidth <= 768;
    const tileSize = isMobile ? 100 : 150; 
    const padding = 3;
    const gap = 1;

    if (board.children.length === 0) {
        const creationOrder = [null, 0, 1, 2, 3, 4, 5, 6, 7];
        creationOrder.forEach(val => {
            const div = document.createElement('div');
            div.className = 'tile';
            div.dataset.tileId = val === null ? "empty" : val;
            board.appendChild(div);
        });
    }

    tiles.forEach((tileValue, currentIdx) => {
        const idSearch = tileValue === null ? "empty" : tileValue;
        const div = board.querySelector(`[data-tile-id="${idSearch}"]`);
        
        if (div) {
            const row = Math.floor(currentIdx / 3);
            const col = currentIdx % 3;

            const x = col * (tileSize + gap) + padding;
            const y = row * (tileSize + gap) + padding;
            div.style.transform = `translate(${x}px, ${y}px)`;

            div.classList.remove('correct', 'wrong', 'movable', 'empty');

            if (tileValue === null) {
                div.classList.add('empty');
                div.style.backgroundImage = 'none';
            } else {
                div.style.backgroundImage = `url('${selectedImgUrl}')`;
                
                const actualPart = tileValue + 1; 
                const origRow = Math.floor(actualPart / 3);
                const origCol = actualPart % 3;
                div.style.backgroundPosition = `-${origCol * tileSize}px -${origRow * tileSize}px`;

                if (tileValue === currentIdx - 1) {
                    div.classList.add('correct');
                } else {
                    div.classList.add('wrong'); 
                }

                if (isAdjacent(currentIdx, emptyIndex)) {
                    div.classList.add('movable');
                }

                div.onclick = () => { if(!isShuffling && gameStarted) moveTile(currentIdx); };
            }
        }
    });
}

function isAdjacent(idx1, idx2) {
    const r1 = Math.floor(idx1 / 3), c1 = idx1 % 3;
    const r2 = Math.floor(idx2 / 3), c2 = idx2 % 3;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function moveTile(idx) {
    if (isAdjacent(idx, emptyIndex)) {
        moveHistory.push(emptyIndex); 

        [tiles[idx], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[idx]];
        emptyIndex = idx;
        renderBoard();
        if(!isShuffling) checkWin();
    }
}

window.startShuffle = async function() {
    const val = document.getElementById('shuffle-amount').value;
    if(!val) return;

    const shuffleSteps = parseInt(val);
    isShuffling = true;
    gameStarted = false;
    const statusDiv = document.getElementById('game-status');
    statusDiv.classList.remove('show');
    statusDiv.style.display = 'block'; 
    statusDiv.classList.remove('hidden');

    document.getElementById('game-controls').classList.add('hidden');
    const board = document.getElementById('board');
    board.classList.add('shuffling'); 

    let speed = Math.max(200, 800 - (shuffleSteps * 15)); 
    board.style.setProperty('--shuffle-speed', `${speed}ms`);

    let prevEmptyIndex = -1;

    for (let i = 0; i < shuffleSteps; i++) {
        let neighbors = tiles.map((_, b) => b).filter(b => 
            isAdjacent(b, emptyIndex) && b !== prevEmptyIndex
        );

        let randIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        let oldEmpty = emptyIndex;
        [tiles[emptyIndex], tiles[randIdx]] = [tiles[randIdx], tiles[emptyIndex]];
        emptyIndex = randIdx;
        prevEmptyIndex = oldEmpty;

        renderBoard();
        await new Promise(r => setTimeout(r, speed)); 
    }

    gameStarted = true;
    isShuffling = false;
    board.classList.remove('shuffling');
    board.classList.add("game-started");

    setTimeout(() => {
        statusDiv.classList.add('show');
    }, 100);
};

function toggleDropdown() {
    document.getElementById('custom-options').classList.toggle('active');
}

function selectOption(val, text) {
    document.getElementById('selected-text').innerText = text;
    
    const hiddenInput = document.getElementById('shuffle-amount');
    hiddenInput.value = val;

    toggleDropdown();

    document.getElementById('start-btn').classList.remove('hidden');
}

window.onclick = function(event) {
    if (!event.target.closest('.custom-select-wrapper')) {
        document.getElementById('custom-options').classList.remove('active');
    }
}

function checkWin() {
    const isWin = tiles.every((t, i) => i === 0 ? t === null : t === i - 1);
    
    if (isWin && gameStarted && !isShuffling) {
        document.getElementById('game-controls').classList.add('hidden');
        document.getElementById('game-status').classList.remove('show');

        const overlay = document.getElementById('win-overlay');
        overlay.classList.remove('hidden');

        setTimeout(() => {
            overlay.classList.add('active');
        }, 50);

        gameStarted = false;
    }
}

function solvePuzzle(startTiles) {
    const goal = [null, 0, 1, 2, 3, 4, 5, 6, 7];

    function getHeuristic(state) {
        let distance = 0;
        for (let i = 0; i < state.length; i++) {
            if (state[i] !== null) {
                const targetIdx = goal.indexOf(state[i]);
                const curR = Math.floor(i / 3), curC = i % 3;
                const tarR = Math.floor(targetIdx / 3), tarC = targetIdx % 3;
                distance += Math.abs(curR - tarR) + Math.abs(curC - tarC);
            }
        }
        return distance;
    }

    let pq = [{ state: [...startTiles], path: [], g: 0, h: getHeuristic(startTiles) }];
    let visited = new Set([JSON.stringify(startTiles)]);

    const startTime = Date.now();

    while (pq.length > 0) {
        if (Date.now() - startTime > 3000) break;

        pq.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const { state, path, g } = pq.shift();

        if (JSON.stringify(state) === JSON.stringify(goal)) return path;

        const emptyIdx = state.indexOf(null);
        const row = Math.floor(emptyIdx / 3), col = emptyIdx % 3;
        const moves = [];
        if (row > 0) moves.push(emptyIdx - 3);
        if (row < 2) moves.push(emptyIdx + 3);
        if (col > 0) moves.push(emptyIdx - 1);
        if (col < 2) moves.push(emptyIdx + 1);

        for (let moveIdx of moves) {
            const newState = [...state];
            [newState[emptyIdx], newState[moveIdx]] = [newState[moveIdx], newState[emptyIdx]];
            const sStr = JSON.stringify(newState);
            if (!visited.has(sStr)) {
                visited.add(sStr);
                pq.push({ 
                    state: newState, 
                    path: [...path, moveIdx], 
                    g: g + 1, 
                    h: getHeuristic(newState) 
                });
            }
        }
    }
    return null;
}

window.addEventListener('keydown', async (e) => { 
   if (e.key === "F5") {
    e.preventDefault();

    const statusDiv = document.getElementById('game-status');
    const overlay = document.getElementById('win-overlay');
    
    statusDiv.classList.remove('show');
    overlay.classList.remove('active');

    setTimeout(() => {
        statusDiv.style.display = 'none';
        statusDiv.classList.add('hidden');
        overlay.classList.add('hidden');
    }, 50);

    tiles = [null, 0, 1, 2, 3, 4, 5, 6, 7];
    emptyIndex = 0;
    gameStarted = false;
    isShuffling = false;

    const board = document.getElementById("board");
    board.classList.remove("game-started", "shuffling", "solving");
    board.innerHTML = '';

    const controls = document.getElementById('game-controls');
    const shuffleSelect = document.getElementById('shuffle-amount');
    const startBtn = document.getElementById('start-btn');

    controls.classList.remove('hidden');
    
    if (shuffleSelect.value !== "") {
        startBtn.classList.remove("hidden");
    } else {
        startBtn.classList.add("hidden");
    }

    showScreen("screen-game");
    renderBoard();
}

 if (e.key === "Escape") {
        e.preventDefault();
        if (isShuffling || !gameStarted) return;

        const solutionPath = solvePuzzle(tiles);

        if (solutionPath && solutionPath.length > 0) {
            isShuffling = true;
            const board = document.getElementById('board');
            board.classList.add('solving');

            let solveSpeed = Math.max(150, 700 - (solutionPath.length * 20));
            board.style.setProperty('--solve-speed', `${solveSpeed}ms`);

            for (let nextIdx of solutionPath) {
                [tiles[emptyIndex], tiles[nextIdx]] = [tiles[nextIdx], tiles[emptyIndex]];
                emptyIndex = nextIdx;
                renderBoard();
                await new Promise(r => setTimeout(r, solveSpeed));
            }

            board.classList.remove('solving');
            isShuffling = false;
            const statusDiv = document.getElementById('game-status');
            statusDiv.classList.remove('show');
            document.getElementById('game-status').classList.remove('show');
            e.preventDefault(); 
        tiles = [null, 0, 1, 2, 3, 4, 5, 6, 7];
        emptyIndex = 0;
        gameStarted = false;
        isShuffling = false;
        board.classList.remove("game-started"); 
        board.innerHTML = ''; 
        document.getElementById('game-controls').classList.remove('hidden'); 
        document.getElementById('game-status').classList.add('hidden'); 
        document.getElementById('win-overlay').classList.add('hidden'); 
        const shuffleSelect = document.getElementById('shuffle-amount');
        const startBtn = document.getElementById('start-btn');
        if (shuffleSelect.value !== "") startBtn.classList.remove("hidden");
        showScreen("screen-game");
        renderBoard();
        }
    }
});
document.getElementById('solve-hint').addEventListener('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
    }));
});

document.getElementById('solve-subtitle').addEventListener('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true
    }));
});

document.getElementById("shuffle-amount").addEventListener("change", () => { 
    document.getElementById("start-btn").classList.remove("hidden"); 
});

window.addEventListener("load", () => { 
    const savedImg = localStorage.getItem("selectedImage");
    if(savedImg) selectedImgUrl = savedImg; 
    showScreen("screen-home");
});

window.addEventListener('resize', () => {
    renderBoard();
});