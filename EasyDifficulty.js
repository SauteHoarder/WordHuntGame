

const words = ["PROGRAMMER", "VARIABLE", "FUNCTION", "LOOP", "ALGORITHM", "INT", "PROBLEMANALYSIS", "JAVASCRIPTSYNTAX", "BREAKSTATEMENT"];
const rows = 20;
const cols = 20;
let grid = Array.from({ length: rows }, () => Array(cols).fill(""));

const gridContainer = document.getElementById("word-grid");
gridContainer.style.gridTemplateColumns = `repeat(${cols}, 34px)`;

const wordListContainer = document.getElementById("words-to-find");
const foundWordsContainer = document.getElementById("found-words");
const explanationList = document.getElementById("word-explanations");
const selectionDropdown = document.getElementById("selection-mode");
const checkWordButton = document.getElementById("check-word");

let selectionMode = "drag";
let isMouseDown = false;
let selectedCells = [];
let selectedWord = "";
let startRow = null;
let startCol = null;
let directionLocked = null;

const requiredWords = new Set(words);
const foundWordsSet = new Set();

selectionDropdown.addEventListener("change", (e) => {
    selectionMode = e.target.value;
    resetSelection();
    checkWordButton.style.display = selectionMode === "manual" ? "inline-block" : "none";
});

checkWordButton.addEventListener("click", () => {
    finalizeDragSelection();
});

// Render word list
function renderWordList() {
    wordListContainer.innerHTML = "";
    words.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" :
                         word === "JAVASCRIPTSYNTAX" ? "JAVASCRIPT SYNTAX" :
                         word === "BREAKSTATEMENT" ? "BREAK STATEMENT" :
                          word;
        wordListContainer.appendChild(li);
    });
}
renderWordList();

// Word placement
function placeAllWords() {
    const guaranteedHorizontal = words.slice(0, 3);
    const remaining = words.slice(3);
    guaranteedHorizontal.forEach(word => placeWord(word, "horizontal"));
    remaining.forEach(word => placeWord(word));
}

function placeWord(word, forceDirection = null) {
    const directions = ["horizontal", "vertical", "diagonal"];
    let placed = false, attempts = 0;

    while (!placed && attempts < 100) {
        const direction = forceDirection || directions[Math.floor(Math.random() * directions.length)];
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);

        if (direction === "horizontal" && col + word.length <= cols && checkFit(row, col, word.length, 0, 1)) {
            for (let i = 0; i < word.length; i++) grid[row][col + i] = word[i];
            placed = true;
        } else if (direction === "vertical" && row + word.length <= rows && checkFit(row, col, word.length, 1, 0)) {
            for (let i = 0; i < word.length; i++) grid[row + i][col] = word[i];
            placed = true;
        } else if (direction === "diagonal" && row + word.length <= rows && col + word.length <= cols && checkFit(row, col, word.length, 1, 1)) {
            for (let i = 0; i < word.length; i++) grid[row + i][col + i] = word[i];
            placed = true;
        }

        attempts++;
    }
}

function checkFit(row, col, length, rowStep, colStep) {
    for (let i = 0; i < length; i++) {
        if (grid[row + i * rowStep][col + i * colStep] !== "") return false;
    }
    return true;
}

placeAllWords();

for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
}

function renderGrid() {
    gridContainer.innerHTML = "";
    grid.forEach((row, r) => {
        row.forEach((letter, c) => {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.textContent = letter;
            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener("mousedown", () => {
                if (cell.classList.contains("found")) return;
            
                if (selectionMode === "manual") {
                    if (selectedCells.length === 0) {
                        startRow = r;
                        startCol = c;
                        directionLocked = null;
                    }
                    dragSelectCell(cell);
                } else {
                    isMouseDown = true;
                    resetSelection();
                    startRow = r;
                    startCol = c;
                    dragSelectCell(cell);
                }
            });
            

            cell.addEventListener("click", () => {
                if (selectionMode === "manual" && !cell.classList.contains("found")) {
                    dragSelectCell(cell);
                }
            });

            cell.addEventListener("mouseover", () => {
                if (isMouseDown && !cell.classList.contains("found")) dragSelectCell(cell);
            });

            cell.addEventListener("mouseup", () => {
                isMouseDown = false;
                finalizeDragSelection();
            });

            gridContainer.appendChild(cell);
        });
    });
}
renderGrid();

// Touch handling
gridContainer.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !target.classList.contains("cell") || target.classList.contains("found")) return;

    if (selectionMode === "manual") {
        if (selectedCells.length === 0) {
            startRow = parseInt(target.dataset.row);
            startCol = parseInt(target.dataset.col);
            directionLocked = null;
        }
        dragSelectCell(target);
    } else {
        isMouseDown = true;
        resetSelection();
        startRow = parseInt(target.dataset.row);
        startCol = parseInt(target.dataset.col);
        dragSelectCell(target);
    }
    
    e.preventDefault();
}, { passive: false });

gridContainer.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains("cell") && !target.classList.contains("found")) {
        dragSelectCell(target);
    }
    e.preventDefault();
}, { passive: false });

gridContainer.addEventListener("touchend", () => {
    isMouseDown = false;
    finalizeDragSelection();
});

document.addEventListener("mouseup", () => {
    isMouseDown = false;
    finalizeDragSelection();
});

// Word selection
function dragSelectCell(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (selectedCells.length === 0) {
        startRow = row;
        startCol = col;
        directionLocked = null;
        addCellToSelection(cell);
        return;
    }

    const dRow = row - startRow;
    const dCol = col - startCol;

    if (!directionLocked) {
        if (dRow === 0) directionLocked = "horizontal";
        else if (dCol === 0) directionLocked = "vertical";
        else if (Math.abs(dRow) === Math.abs(dCol)) directionLocked = "diagonal";
        else return;
    }

    const lastCell = selectedCells[selectedCells.length - 1];
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);

    let stepRow = row > lastRow ? 1 : (row < lastRow ? -1 : 0);
    let stepCol = col > lastCol ? 1 : (col < lastCol ? -1 : 0);
    let r = lastRow + stepRow;
    let c = lastCol + stepCol;

    while (r !== row + stepRow || c !== col + stepCol) {
        const nextCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (!nextCell || nextCell.classList.contains("found")) break;

        if (
            (directionLocked === "horizontal" && r === startRow) ||
            (directionLocked === "vertical" && c === startCol) ||
            (directionLocked === "diagonal" && Math.abs(r - startRow) === Math.abs(c - startCol))
        ) {
            addCellToSelection(nextCell);
        }

        r += stepRow;
        c += stepCol;
    }

    if (
        (directionLocked === "horizontal" && row === startRow) ||
        (directionLocked === "vertical" && col === startCol) ||
        (directionLocked === "diagonal" && Math.abs(row - startRow) === Math.abs(col - startCol))
    ) {
        addCellToSelection(cell);
    }
}

function addCellToSelection(cell) {
    if (!cell.classList.contains("selected")) {
        cell.classList.add("selected");
        selectedCells.push(cell);
        selectedWord += cell.textContent;
    }
}

function finalizeDragSelection() {
    if (selectedCells.length > 1 && isAligned() && requiredWords.has(selectedWord) && !foundWordsSet.has(selectedWord)) {
        selectedCells.forEach(cell => {
            cell.style.backgroundColor = "lightgreen";
            cell.classList.add("found");
            cell.classList.remove("selected");
        });
        moveToFoundWords(selectedWord);
    }
    resetSelection();
}

function resetSelection() {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
    selectedCells = [];
    selectedWord = "";
    startRow = null;
    startCol = null;
    directionLocked = null;
}

function isAligned() {
    const rows = selectedCells.map(c => parseInt(c.dataset.row));
    const cols = selectedCells.map(c => parseInt(c.dataset.col));
    const sameRow = rows.every(r => r === rows[0]);
    const sameCol = cols.every(c => c === cols[0]);
    const diagonal = rows.every((r, i) => r - rows[0] === cols[i] - cols[0]);
    return sameRow || sameCol || diagonal;
}

const wordExplanations = {
    "PROGRAMMER": "Is a person who writes the instruction for a computer.",
    "VARIABLE": "A container that holds a value in JavaScript.",
    "FUNCTION": "Is a block of code that performs a task when called.",
    "LOOP": "Is a structure used to repeat a block of code multiple times.",
    "ALGORITHM": "Is set of steps to solve a problem",
    "INT": "Is a primitive data type used to store whole numbers without decimal points.",
    "PROBLEMANALYSIS": "Is the first step in writing a JavaScript program, where you figure out what the program needs to do.",
    "JAVASCRIPTSYNTAX": "Is a set of rules that lets you tell a computer what to do in JavaScript.",
    "BREAKSTATEMENT": "Does not skip a loop of iteration, rather it exits the loop entirely."
};

function moveToFoundWords(word) {
    if (!requiredWords.has(word) || foundWordsSet.has(word)) return;
    foundWordsSet.add(word);

    const li = document.createElement("li");
    li.textContent = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" :
                     word === "JAVASCRIPTSYNTAX" ? "JAVASCRIPT SYNTAX" :
                     word === "BREAKSTATEMENT" ? "BREAK STATEMENT" :
                    word;
    foundWordsContainer.appendChild(li);

    if (wordExplanations[word]) {
        const explanationItem = document.createElement("li");
        explanationItem.innerHTML = `<strong>${li.textContent}:</strong> ${wordExplanations[word]}`;
        explanationList.appendChild(explanationItem);
    }

    updateWordList();
}

function updateWordList() {
    wordListContainer.innerHTML = "";
    words.forEach(word => {
        if (!foundWordsSet.has(word)) {
            const li = document.createElement("li");
            li.textContent = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" :
                             word === "JAVASCRIPTSYNTAX" ? "JAVASCRIPT SYNTAX" : 
                             word === "BREAKSTATEMENT" ? "BREAK STATEMENT" :
                             word;
            wordListContainer.appendChild(li);
        }
    });
}
