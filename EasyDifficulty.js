const words = ["PROGRAMMER", "VARIABLE", "FUNCTION", "LOOP", "ALGORITHM", "INT", "PROBLEMANALYSIS"];
const rows = 15; // Grid height
const cols = 15; // Grid width
let grid = Array.from({ length: rows }, () => Array(cols).fill(""));

const gridContainer = document.getElementById("word-grid");
gridContainer.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

const wordListContainer = document.getElementById("words-to-find");
const foundWordsContainer = document.getElementById("found-words");

const requiredWords = new Set(words); // Set of required words to find
const foundWordsSet = new Set(); // Set to store found words

// Display words to find
words.forEach(word => {
    const li = document.createElement("li");
    li.textContent = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" : word;
    wordListContainer.appendChild(li);
});

// Place words randomly without overlap
function placeWord(word) {
    const directions = ["horizontal", "vertical", "diagonal"];
    let placed = false;

    while (!placed) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);

        if (direction === "horizontal" && col + word.length <= cols && checkFit(row, col, word.length, 0, 1)) {
            for (let i = 0; i < word.length; i++) grid[row][col + i] = word[i];
            placed = true;
        } 
        else if (direction === "vertical" && row + word.length <= rows && checkFit(row, col, word.length, 1, 0)) {
            for (let i = 0; i < word.length; i++) grid[row + i][col] = word[i];
            placed = true;
        } 
        else if (direction === "diagonal" && row + word.length <= rows && col + word.length <= cols && checkFit(row, col, word.length, 1, 1)) {
            for (let i = 0; i < word.length; i++) grid[row + i][col + i] = word[i];
            placed = true;
        }
    }
}

// Check if space is free before placing a word
function checkFit(row, col, length, rowStep, colStep) {
    for (let i = 0; i < length; i++) {
        if (grid[row + i * rowStep][col + i * colStep] !== "") return false;
    }
    return true;
}

// Place all words
words.forEach(placeWord);

// Fill empty spaces with random letters
for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
}

let isMouseDown = false;
let selectedCells = [];
let selectedWord = "";
// Render grid
gridContainer.innerHTML = ""; // Clear old grid if any
grid.forEach((row, r) => {
    row.forEach((letter, c) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = letter;
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Drag-based event handlers
        cell.addEventListener("mousedown", () => {
            if (cell.classList.contains("found")) return;
            isMouseDown = true;
            resetSelection();
            startRow = null;
            startCol = null;
               directionLocked = null;
            dragSelectCell(cell);
        });

        cell.addEventListener("mouseover", () => {
            if (isMouseDown && !cell.classList.contains("found")) {
                dragSelectCell(cell);
            }
        });

        cell.addEventListener("mouseup", () => {
            isMouseDown = false;
            finalizeDragSelection();
        });

        gridContainer.appendChild(cell);
    });
});

document.addEventListener("mouseup", () => {
    isMouseDown = false;
    finalizeDragSelection();
});

let startRow = null;
let startCol = null;
let directionLocked = null;

function dragSelectCell(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // First cell selected — start drag
    if (selectedCells.length === 0) {
        startRow = row;
        startCol = col;
        directionLocked = null;
        addCellToSelection(cell);
        return;
    }

    // Determine the direction if not already locked
    const dRow = row - startRow;
    const dCol = col - startCol;

    if (!directionLocked) {
        if (dRow === 0) directionLocked = "horizontal";
        else if (dCol === 0) directionLocked = "vertical";
        else if (Math.abs(dRow) === Math.abs(dCol)) directionLocked = "diagonal";
        else return; // Not a valid direction
    }

    // Enforce direction lock
    if (directionLocked === "horizontal" && row === startRow) {
        addCellToSelection(cell);
    } else if (directionLocked === "vertical" && col === startCol) {
        addCellToSelection(cell);
    } else if (directionLocked === "diagonal" && Math.abs(row - startRow) === Math.abs(col - startCol)) {
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
    if (selectedCells.length > 1 && isAligned() && words.includes(selectedWord)) {
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


// Check if selected letters are in a straight line
function isAligned() {
    if (selectedCells.length < 2) return false;

    let rowPositions = selectedCells.map(cell => parseInt(cell.dataset.row));
    let colPositions = selectedCells.map(cell => parseInt(cell.dataset.col));

    let sameRow = rowPositions.every((r, _, arr) => r === arr[0]);
    let sameCol = colPositions.every((c, _, arr) => c === arr[0]);

    let diagonal = rowPositions.every((r, i) => r - rowPositions[0] === colPositions[i] - colPositions[0]);

    return sameRow || sameCol || diagonal;
}

// Move to found words function
function moveToFoundWords(word) {
    if (!requiredWords.has(word) || foundWordsSet.has(word)) return; // Ignore if not required or already found
    foundWordsSet.add(word); // Add to found words
    updateWordList();

    // Add to "Found Words" list
    const li = document.createElement("li");
    li.textContent = word;
    foundWordsContainer.appendChild(li);

    // Add explanation in the separate container
    if (wordExplanations[word]) {
        const displayWord = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" : word;
        const explanationItem = document.createElement("li");
        explanationItem.innerHTML = `<strong>${displayWord}:</strong> ${wordExplanations[word]}`;
        explanationList.appendChild(explanationItem);
    }    
}

// Update word list function
function updateWordList() {
    while (wordListContainer.firstChild) {
        wordListContainer.removeChild(wordListContainer.firstChild);
    }

    words.forEach(word => {
        if (!foundWordsSet.has(word)) {
            const li = document.createElement("li");
            li.textContent = word;
            wordListContainer.appendChild(li);
        }
    });

    if (foundWordsSet.size === requiredWords.size) {
        wordListContainer.style.display = ""; // Hide the word list if all words are found
    }
}

// Dictionary of word explanations
const wordExplanations = {
    "PROGRAMMER": "Is a person who writes the instruction for a computer.",
    "VARIABLE": "A container that holds a value in JavaScript.",
    "FUNCTION": "Is a block of code that performs a task when called.",
    "LOOP": "Is a structure used to repeat a block of code multiple times.",
    "ALGORITHM": "Is set of steps to solve a problem",
    "INT": "Is a primitive data type used to store whole numbers without decimal points.",
    "PROBLEMANALYSIS": "Is the first step in writing a JavaScript program, where you figure out what the program needs to do."
};

// Select explanation container
const explanationList = document.getElementById("word-explanations");


// Modify function to append explanations separately
function moveToFoundWords(word) {
    words.splice(words.indexOf(word), 1); // Remove from words list

    // Update "Find These Words" list
    updateWordList();

    // Add to "Found Words" list
    const li = document.createElement("li");
    li.textContent = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" : word;
    foundWordsContainer.appendChild(li);

    // Add explanation in the separate container
    if (wordExplanations[word]) {
        const displayWord = word === "PROBLEMANALYSIS" ? "PROBLEM ANALYSIS" : word;
        const explanationItem = document.createElement("li");
        explanationItem.innerHTML = `<strong>${displayWord}:</strong> ${wordExplanations[word]}`;
        explanationList.appendChild(explanationItem);
    }
}

