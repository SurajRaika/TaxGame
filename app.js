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
  speed: 10, // Change initial speed to 4 (slowest)
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
  headPos: { col: 0, row: 0, dir: "up" },
  currentPosSet: new Set(),
  sameDirMap: {
    up: "-1,0",
    down: "1,0",
    left: "0,-1",
    right: "0,1",
  },
  cancelDirMap: {
    up: "ArrowDown",
    down: "ArrowUp",
    left: "ArrowRight",
    right: "ArrowLeft",
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
  speedIntervals: [1,2,3,4], // Keep the intervals the same
  starFoodOffset: 5,
};

let counter = -1;

let raf = null;

const startGameBtn = document.querySelector(`.${config.startGame}`);
const pauseGameBtn = document.querySelector(`.${config.pauseGame}`);
const snakeBrd = document.querySelector(`.${config.snakeBoard}`);
const pointsCount = document.querySelector(`.${config.ptsCount}`);
const speedCount = document.querySelector(`.${config.spdCount}`);
const deadCount = document.querySelector(`.${config.deadCount}`);
const dialog = document.querySelector(`.${config.dialog}`);

startGameBtn.addEventListener("click", toggleStartGame);
pauseGameBtn.addEventListener("click", toggleStartGame);
document.body.addEventListener("keydown", handleKeyPress);

pointsCount.textContent = config.points;
speedCount.textContent = config.speed;
deadCount.textContent = config.lives;

function placeSnakeFood() {
  const { cols, rows, snakeFood, points } = config;
  let row = Math.floor(Math.random() * (rows - 4) + 2);
  let col = Math.floor(Math.random() * (cols - 4) + 2);
  config.snakeFoodPos = [row, col];
  snakeFood.style.setProperty("grid-row-start", row);
  snakeFood.style.setProperty("grid-column-start", col);
  snakeFood.setAttribute("data-dr", row);
  snakeFood.setAttribute("data-dc", col);
  if (points !== 0 && points % 5 === 0) {
    snakeFood.classList.add(config.starFood)
  } else {
    snakeFood.classList.remove(config.starFood)
  }
}

function createSnake() {
  const { snakeCls, snakePartCls, snakeHeadCls } = config;
  const snake = [];

  const snakeFood = document.createElement("div");
  snakeFood.classList.add(config.snakeFd);
  snakeBrd.appendChild(snakeFood);
  config.snakeFood = snakeFood;
  placeSnakeFood();

  const head = document.createElement("div");
  head.classList.add(snakeCls);
  head.classList.add(snakeHeadCls);
  
  const headImg = document.createElement("img");
  headImg.classList.add("head-img");
  headImg.src = './fm_bg.png';

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
  // snakeBoard.append(snake);
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

  const prev = {};
  prev.col = Math.floor(config.cols / 2);
  prev.row = Math.floor(config.rows / 2);
  config.headPos = { ...config.headPos, ...prev };
  for (const snakePart of snake) {
    snakePart.style.setProperty("grid-row", `${prev.row} / span 1`);
    snakePart.style.setProperty("grid-column", `${prev.col} / span 1`);
    snakePart.setAttribute("data-dr", prev.row);
    snakePart.setAttribute("data-dc", prev.col);
    // add all the current cols and rows.
    config.currentPosSet.add(`${prev.row},${prev.col}`);
    // prev.col += 1;
    prev.row += 1;
  }
}

function handleKeyPress(event) {
  const { headPos, keyCodeToDirMap, cancelDirMap } = config;
  if (event.code === "Space") {
    toggleStartGame();
    return;
  }

  if (!raf) return;

  if (!keyCodeToDirMap[event.code]) return;
  const { dir: currentDir } = headPos;
  if (event.code === cancelDirMap[currentDir]) return;
  console.log(keyCodeToDirMap[event.code]);
  headPos.dir = keyCodeToDirMap[event.code];
  const headElement = document.querySelector('.snk-hd');
  console.log(dirToClassMap,headPos.dir)

  // Remove all direction classes
  Object.values(dirToClassMap).forEach(cls => 
    
    headElement.classList.remove(cls)
  );
  // Add new direction class
  headElement.classList.add(dirToClassMap[headPos.dir]);
  
}

function handleEat() {
  config.points += 1;
  pointsCount.textContent = config.points;
  // add one more snake part
  // if (config.points % 2 === 0) {
  const div = document.createElement("div");
  div.classList.add(config.snakeCls);
  div.classList.add(config.snakePartCls);
  config.snake.push(div);
  snakeBrd.appendChild(div);

  // // }
  // if (config.speed > 1) {
  //   const pts = config.points;
  //   if (pts > config.speedIntervals[3]) {
  //     config.speed = 1;
  //   } else if (pts > config.speedIntervals[2]) {
  //     config.speed = 2;
  //   } else if (pts > config.speedIntervals[1]) {
  //     config.speed = 3;
  //   } else if (pts > config.speedIntervals[0]) {
  //     config.speed = 4;
  //   }
  //   speedCount.textContent = config.speed;
  // }
  placeSnakeFood();
}

function getNextHeadOffset() {
  const { headPos, cols, rows, posMap, sameDirMap, currentPosSet } = config;
  const { dir, col, row } = headPos;
  let [nextRow, nextCol] = sameDirMap[dir].split(",").map((n) => parseInt(n));

  nextRow = nextRow + row;
  nextCol = nextCol + col;

  // break
  if (currentPosSet.has(`${nextRow},${nextCol}`)) return;

  if (nextCol > cols) nextCol = 0;
  if (nextCol < 0) nextCol = cols;
  if (nextRow < 0) nextRow = rows;
  if (nextRow > rows) nextRow = 0;

  const nextPos = { row: nextRow, col: nextCol };

  config.headPos = { ...config.headPos, ...nextPos };

  return { ...nextPos };
}

function moveSnake() {
  counter += 1;
  if (counter % config.speed !== 0) {
    raf = requestAnimationFrame(moveSnake);
    return;
  }
  const { snake, snakeFoodPos } = config;
  let nextPos = getNextHeadOffset();
  config.currentPosSet.clear();
  if (!nextPos) {
    cancelAnimationFrame(raf);
    raf = null;
    config.lives += 1;
    deadCount.textContent = config.lives;
    setup();
    raf = requestAnimationFrame(moveSnake);
    return;
  }
  config.currentPosSet.add(`${nextPos.row},${nextPos.col}`);
  let i = 0;
  for (let snakePart of snake) {
    config.currentPosSet.add(`${nextPos.row},${nextPos.col}`);
    const row = parseInt(snakePart.getAttribute("data-dr"));
    const col = parseInt(snakePart.getAttribute("data-dc"));
    snakePart.style.setProperty("grid-row", `${nextPos.row} / span 1`);
    snakePart.style.setProperty("grid-column", `${nextPos.col} / span 1`);
    snakePart.setAttribute("data-dr", nextPos.row);
    snakePart.setAttribute("data-dc", nextPos.col);
    nextPos = { row, col };
    if (
      i === 0 &&
      nextPos.row === snakeFoodPos[0] &&
      nextPos.col === snakeFoodPos[1]
    ) {
      handleEat();
    }
  }
  raf = requestAnimationFrame(moveSnake);
}

function toggleStartGame() {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
    startGameBtn.classList.toggle(config.hide);
    pauseGameBtn.classList.toggle(config.hide);
    return;
  }
  raf = requestAnimationFrame(moveSnake);
  startGameBtn.classList.toggle(config.hide);
  pauseGameBtn.classList.toggle(config.hide);
}

function checkIsMobile() {
  let isMobile = false;
  const userAgent =
    navigator.userAgent || navigator.vendor || window.opera || "";
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|whiteberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
      userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      userAgent.substr(0, 4)
    )
  ) {
    isMobile = true;
  } else if ("ontouchstart" in document.documentElement) {
    isMobile = true;
  }
  return isMobile;
}

const initGame = new Promise(function initGame(resolve) {
  const isMobile = checkIsMobile();

  if (isMobile) {
    dialog.classList.remove(config.hide);
    document
      .querySelector(`.${config.keyboardProceed}`)
      .addEventListener("click", () => {
        resolve();
      });
  } else {
    resolve();
  }
});

function startGame() {
  dialog.classList.add(config.hide);
  createSnake();
  setup();
}

initGame.then(startGame);
