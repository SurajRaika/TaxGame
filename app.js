// Add direction to class mapping
const dirToClassMap = {
  'up': 'head-up',
  'down': 'head-down',
  'left': 'head-left',
  'right': 'head-right'
};

const config = {
  cols: Math.floor((window.innerWidth - 32) / 32),
  rows: Math.floor((window.innerHeight - 32) / 32),
  snakeLen: 5,
  points: 0,
  lives: 0,
  speed: 10, // Change initial speed to 4 (slowest) -> Let's keep original speed logic for now
  snakeBoard: "snk-brd",
  snakeCls: "snk",
  snakeFd: "snk-fd",
  snakePartCls: "snk-prt",
  snakeHeadCls: "snk-hd",
  ptsCount: "pts-count",
  spdCount: "spd-count",
  deadCount: "dead-count",
  startGame: "start-game",
  starFood: 'star-food',
  pauseGame: "pause-game",
  dialog: "dialog",
  keyboardProceed: "keyboard-proceed",
  hide: "hide",
  snake: null,
  snakeFood: null,
  pointsCount: null,
  snakeFoodPos: [],
  headPos: { col: 0, row: 0, dir: "up" }, // Start facing up
  currentPosSet: new Set(),
  sameDirMap: {
    up: "-1,0",
    down: "1,0",
    left: "0,-1",
    right: "0,1",
  },
  // Keep cancelDirMap based on *intended* direction, useful for logic check
  cancelDirMap: {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  },
  keyCodeToDirMap: {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowRight: "right",
    ArrowLeft: "left",
  },
  posMap: {
    up: {
      "-1,0": "up",
      "0,-1": "left",
      "0,1": "right",
    },
    down: {
      "1,0": "down",
      "0,1": "right",
      "0,-1": "left",
    },
    left: {
      "0,-1": "left",
      "-1,0": "up",
      "1,0": "down",
    },
    right: {
      "0,1": "right",
      "-1,0": "up",
      "1,0": "down",
    },
  },
  // Removed speed interval logic as per original code comment state
  // speedIntervals: [1,2,3,4],
  starFoodOffset: 5,
};

let counter = -1;
let raf = null; // Represents the requestAnimationFrame ID, null if paused/stopped

const startGameBtn = document.querySelector(`.${config.startGame}`);
const pauseGameBtn = document.querySelector(`.${config.pauseGame}`);
const snakeBrd = document.querySelector(`.${config.snakeBoard}`);
const pointsCount = document.querySelector(`.${config.ptsCount}`);
const speedCount = document.querySelector(`.${config.spdCount}`);
const deadCount = document.querySelector(`.${config.deadCount}`);
const dialog = document.querySelector(`.${config.dialog}`);

// --- Event Listeners ---
startGameBtn.addEventListener("click", toggleStartGame);
pauseGameBtn.addEventListener("click", toggleStartGame);
document.body.addEventListener("keydown", handleKeyPress);
// Hammer.js listeners will be added later in initGame.then()

// --- Initial Setup ---
pointsCount.textContent = config.points;
speedCount.textContent = config.speed; // Display initial speed setting
deadCount.textContent = config.lives;

// --- Game Functions ---

function placeSnakeFood() {
  const { cols, rows, snakeFood, points } = config;
  let row, col;
  // Ensure food doesn't spawn on the snake
  do {
    row = Math.floor(Math.random() * (rows - 4) + 2);
    col = Math.floor(Math.random() * (cols - 4) + 2);
  } while (config.currentPosSet.has(`${row},${col}`)); // Check against current snake positions

  config.snakeFoodPos = [row, col];
  snakeFood.style.setProperty("grid-row-start", row);
  snakeFood.style.setProperty("grid-column-start", col);
  snakeFood.setAttribute("data-dr", row);
  snakeFood.setAttribute("data-dc", col);
  if (points !== 0 && points % config.starFoodOffset === 0) { // Use config offset
    snakeFood.classList.add(config.starFood)
  } else {
    snakeFood.classList.remove(config.starFood)
  }
}

function createSnake() {
  const { snakeCls, snakePartCls, snakeHeadCls } = config;
  const snake = [];

  // Clear previous snake/food if any (important for restarting)
  snakeBrd.innerHTML = '';
  config.currentPosSet.clear(); // Clear positions on creation


  const snakeFood = document.createElement("div");
  snakeFood.classList.add(config.snakeFd);
  snakeBrd.appendChild(snakeFood);
  config.snakeFood = snakeFood;
  // Food placed after snake setup to avoid collision


  const head = document.createElement("div");
  head.classList.add(snakeCls);
  head.classList.add(snakeHeadCls);
  head.classList.add(dirToClassMap[config.headPos.dir]); // Add initial direction class

  const headImg = document.createElement("img");
  headImg.classList.add("head-img");
  headImg.src = './fm_bg.png'; // Make sure this path is correct

  head.appendChild(headImg);

  snake.push(head);
  snakeBrd.appendChild(head);
  for (let i = 0; i < config.snakeLen; i++) {
    const div = document.createElement("div");
    div.classList.add(snakeCls);
    div.classList.add(snakePartCls);
    snake.push(div);
    snakeBrd.appendChild(div);
  }
  config.snake = snake;
  return snake;
}

function setup() {
  const { snake } = config;
  snakeBrd.style.setProperty(
    "grid-template-columns",
    `repeat(${config.cols}, 1fr)`
  );
  snakeBrd.style.setProperty(
    "grid-template-rows",
    `repeat(${config.rows}, 1fr)`
  );

  // Reset head position and direction for setup
  const startCol = Math.floor(config.cols / 2);
  const startRow = Math.floor(config.rows / 2);
  config.headPos = { dir: "up", row: startRow, col: startCol }; // Reset position and direction
  config.currentPosSet.clear(); // Clear old positions before setting new ones

  let currentRow = startRow;
  let currentCol = startCol;

  for (const snakePart of snake) {
    snakePart.style.setProperty("grid-row", `${currentRow} / span 1`);
    snakePart.style.setProperty("grid-column", `${currentCol} / span 1`);
    snakePart.setAttribute("data-dr", currentRow);
    snakePart.setAttribute("data-dc", currentCol);
    config.currentPosSet.add(`${currentRow},${currentCol}`);
    currentRow += 1; // Initial snake points downwards from head
  }

  // Place food *after* snake is positioned
  placeSnakeFood();

  // Ensure head class matches initial direction after setup
   const headElement = document.querySelector(`.${config.snakeHeadCls}`);
   if (headElement) {
      Object.values(dirToClassMap).forEach(cls => headElement.classList.remove(cls));
      headElement.classList.add(dirToClassMap[config.headPos.dir]);
   }
}

// --- NEW: Refactored Function to Set Direction ---
function setSnakeDirection(newDirection) {
  // 1. Check if game is running
  if (!raf) return;

  // 2. Check if the direction is valid (it should be from our maps)
  if (!dirToClassMap[newDirection]) return;

  // 3. Prevent moving directly opposite
  const currentDir = config.headPos.dir;
  if (newDirection === config.cancelDirMap[currentDir]) {
      console.log(`Ignoring opposite direction: ${newDirection} from ${currentDir}`);
      return;
  }

  // 4. Update internal state
  config.headPos.dir = newDirection;
  console.log("New direction set:", newDirection);


  // 5. Update visual representation (CSS class on head)
  const headElement = document.querySelector(`.${config.snakeHeadCls}`);
  if (headElement) {
      // Remove all direction classes first
      Object.values(dirToClassMap).forEach(cls => headElement.classList.remove(cls));
      // Add the new direction class
      headElement.classList.add(dirToClassMap[newDirection]);
  } else {
      console.error("Snake head element not found for CSS update.");
  }
}

// --- MODIFIED: Key Press Handler ---
function handleKeyPress(event) {
  // Handle Space for Pause/Resume FIRST
  if (event.code === "Space") {
    toggleStartGame();
    return;
  }

  // Map key code to game direction
  const newDirection = config.keyCodeToDirMap[event.code];

  // If the key pressed corresponds to a direction, try setting it
  if (newDirection) {
      setSnakeDirection(newDirection);
  }
}

function handleEat() {
  config.points += 1;
  pointsCount.textContent = config.points;

  // Add a new part to the snake
  const div = document.createElement("div");
  div.classList.add(config.snakeCls);
  div.classList.add(config.snakePartCls);

  // Important: Add the new part visually *near* the tail for smoothness
  // We'll position it correctly in the next moveSnake cycle
  const tail = config.snake[config.snake.length - 1];
  const tailRow = tail.getAttribute("data-dr");
  const tailCol = tail.getAttribute("data-dc");
  div.style.setProperty("grid-row", `${tailRow} / span 1`);
  div.style.setProperty("grid-column", `${tailCol} / span 1`);
  div.setAttribute("data-dr", tailRow);
  div.setAttribute("data-dc", tailCol);

  config.snake.push(div);
  snakeBrd.appendChild(div);


  // Speed logic (Optional - uncomment if needed)
  /*
  if (config.speed > 1) { // Assuming lower number means faster
    const pts = config.points;
    let newSpeed = config.speed; // Default to current
    if (pts > config.speedIntervals[3]) { // Example thresholds
      newSpeed = 1;
    } else if (pts > config.speedIntervals[2]) {
      newSpeed = 2;
    } else if (pts > config.speedIntervals[1]) {
      newSpeed = 3;
    } else if (pts > config.speedIntervals[0]) {
      newSpeed = 4;
    }
    if (newSpeed !== config.speed) {
        config.speed = newSpeed;
        speedCount.textContent = config.speed; // Update display
    }
  }
  */

  placeSnakeFood(); // Place new food
}

function getNextHeadOffset() {
  const { headPos, cols, rows, sameDirMap, currentPosSet } = config;
  const { dir, col, row } = headPos;

  // Calculate potential next coordinates based on direction
  let [rowOffset, colOffset] = sameDirMap[dir].split(",").map((n) => parseInt(n));
  let nextRow = row + rowOffset;
  let nextCol = col + colOffset;

  // --- Wall Wrapping ---
  if (nextCol >= cols) nextCol = 0; // Wrap right to left
  if (nextCol < 0) nextCol = cols - 1; // Wrap left to right
  if (nextRow >= rows) nextRow = 0; // Wrap bottom to top
  if (nextRow < 0) nextRow = rows - 1; // Wrap top to bottom

  // --- Self Collision Check ---
  // Check if the *next* head position collides with any *current* body part position
  // We temporarily remove the *current* tail's position from the set for this check,
  // because the head can move into the space the tail just vacated.
  const tail = config.snake[config.snake.length - 1];
  const tailPosStr = `${tail.getAttribute("data-dr")},${tail.getAttribute("data-dc")}`;
  let collision = false;
  if (config.currentPosSet.has(`${nextRow},${nextCol}`)) {
      // Only a collision if the target spot isn't the tail's current spot
      if (`${nextRow},${nextCol}` !== tailPosStr) {
          collision = true;
      }
      // Special case: Snake is very short (e.g., length 2) and tries to reverse immediately
      if (config.snake.length <= 2 && (`${nextRow},${nextCol}` === tailPosStr) ) {
         // This simple check might not be perfect for all edge cases but handles basic reversal
         // A more robust check might be needed depending on minimum snake length rules
      }
  }


  if (collision) {
    console.log("Collision detected at:", nextRow, nextCol);
    return null; // Indicate collision by returning null
  }

  // If no collision, update the head position state
  const nextPos = { row: nextRow, col: nextCol };
  config.headPos = { ...config.headPos, ...nextPos }; // Update row and col, keep dir
  return nextPos; // Return the valid next position
}

function moveSnake() {
  counter += 1;
  if (counter % config.speed !== 0) {
    raf = requestAnimationFrame(moveSnake);
    return;
  }

  const { snake, snakeFoodPos } = config;
  const nextHeadPos = getNextHeadOffset(); // Get calculated next position for the head

  // --- Handle Collision ---
  if (!nextHeadPos) {
    console.log("Game Over - Collision!");
    cancelAnimationFrame(raf);
    raf = null;
    config.lives += 1;
    deadCount.textContent = config.lives;

    // Reset UI for restart
    startGameBtn.classList.remove(config.hide);
    pauseGameBtn.classList.add(config.hide);
    alert(`Game Over! Points: ${config.points}. Press Start to play again.`);
    // Optionally reset points/speed here or keep score across lives
    config.points = 0;
    pointsCount.textContent = config.points;
    // config.speed = 10; // Reset speed if desired
    // speedCount.textContent = config.speed;

    // Re-create and setup the snake for a new game
    createSnake();
    setup();
    // Don't automatically restart - wait for button press
    return;
  }

  // --- Move the Snake Body ---
  let prevRow = nextHeadPos.row;
  let prevCol = nextHeadPos.col;
  const newPosSet = new Set(); // Build the set of positions for the *next* frame

  // Iterate through snake parts, updating their positions
  for (let i = 0; i < snake.length; i++) {
    const snakePart = snake[i];
    const currentRow = parseInt(snakePart.getAttribute("data-dr"));
    const currentCol = parseInt(snakePart.getAttribute("data-dc"));

    // Update style and data attributes
    snakePart.style.setProperty("grid-row", `${prevRow} / span 1`);
    snakePart.style.setProperty("grid-column", `${prevCol} / span 1`);
    snakePart.setAttribute("data-dr", prevRow);
    snakePart.setAttribute("data-dc", prevCol);

    // Add the new position to the set for the next frame's collision check
    newPosSet.add(`${prevRow},${prevCol}`);

    // Prepare for the next part: its new position will be the current part's old position
    prevRow = currentRow;
    prevCol = currentCol;

    // --- Check for Food Collision (only for the head) ---
    if (i === 0 && // Only check for the head part
        parseInt(snakePart.getAttribute("data-dr")) === snakeFoodPos[0] &&
        parseInt(snakePart.getAttribute("data-dc")) === snakeFoodPos[1])
    {
      handleEat();
      // No need to break, the rest of the snake still needs to move
    }
  }

  // Update the master position set for the next frame
  config.currentPosSet = newPosSet;

  // Continue the game loop
  raf = requestAnimationFrame(moveSnake);
}


function toggleStartGame() {
  if (raf) { // Game is running -> Pause it
    cancelAnimationFrame(raf);
    raf = null; // Indicate paused state
    startGameBtn.classList.remove(config.hide); // Show Start button
    pauseGameBtn.classList.add(config.hide);   // Hide Pause button
    console.log("Game Paused");
  } else { // Game is paused or stopped -> Start/Resume it
    // If starting from a stopped state (e.g., after game over), ensure setup is fresh
    if (!startGameBtn.classList.contains(config.hide)) { // Check if start button was visible
        // Optional: Reset score/speed if starting fresh after game over
        // config.points = 0; pointsCount.textContent = config.points;
        // config.speed = 10; speedCount.textContent = config.speed;
        // createSnake(); // Create a new snake if needed (already done after game over)
        // setup(); // Ensure correct initial positioning
    }
    raf = requestAnimationFrame(moveSnake); // Start the game loop
    startGameBtn.classList.add(config.hide);   // Hide Start button
    pauseGameBtn.classList.remove(config.hide); // Show Pause button
    console.log("Game Started/Resumed");
  }
}

function checkIsMobile() {
  let isMobile = false;
  const userAgent =
    navigator.userAgent || navigator.vendor || window.opera || "";
  // Regex check (simplified)
  if (/(android|iphone|ipad|ipod|blackberry|iemobile|opera mini)/i.test(userAgent)) {
    isMobile = true;
  }
  // Touch event check as fallback
  else if ("ontouchstart" in document.documentElement) {
    isMobile = true;
  }
  return isMobile;
}

const initGame = new Promise(function initGame(resolve) {
  const isMobile = checkIsMobile();

  if (isMobile) {
    // Check if dialog should be shown (e.g., first time or always for mobile?)
    // dialog.classList.remove(config.hide);
    // If using a dialog:
    // document
    //   .querySelector(`.${config.keyboardProceed}`) // Assuming this button dismisses dialog
    //   .addEventListener("click", () => {
    //     dialog.classList.add(config.hide);
    //     resolve(); // Resolve after dialog interaction
    //   });
    // If no dialog needed for mobile:
    resolve();
  } else {
    resolve(); // Resolve immediately for desktop
  }
});

function setupSwipeControls() {
    const hammer = new Hammer(document.body); // Listen on the whole body

    // Enable swipe recognizer for all directions
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    // Map Hammer swipe events to our setSnakeDirection function
    hammer.on('swipeup', (ev) => {
        console.log("Swipe Up Detected");
        setSnakeDirection('up');
    });
    hammer.on('swipedown', (ev) => {
        console.log("Swipe Down Detected");
        setSnakeDirection('down');
    });
    hammer.on('swipeleft', (ev) => {
        console.log("Swipe Left Detected");
        setSnakeDirection('left');
    });
    hammer.on('swiperight', (ev) => {
        console.log("Swipe Right Detected");
        setSnakeDirection('right');
    });

    console.log("Swipe controls initialized.");
}


function startGameFlow() {
  // Hide dialog if it was shown
  dialog.classList.add(config.hide);
  // Initial game setup
  createSnake();
  setup();
  // Setup swipe controls AFTER basic setup is done
  setupSwipeControls();
  // Game doesn't start automatically, waits for button press
  console.log("Game ready. Press Start or Space.");
}

// --- Initialize Game ---
initGame.then(startGameFlow); // Call the main game flow function after promise resolves