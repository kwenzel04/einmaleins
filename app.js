let currentMode = "speedrun";
let currentQuestionIndex = 0;
let totalQuestions = 20;
let questions = [];

let startTime = 0;
let timerInterval = null;
let penaltySeconds = 0;
let selectedRows = [2, 3, 4, 5];

let lives = 3;
let survivalScore = 0;
let survivalTimer = 5.0;

const menuScreen = document.getElementById('menu-screen');
const rowSelectScreen = document.getElementById('row-select-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');

const startSpeedrunBtn = document.getElementById('start-speedrun-btn');
const startRowsBtn = document.getElementById('start-rows-btn');
const startFillBtn = document.getElementById('start-fill-btn');
const startSurvivalBtn = document.getElementById('start-survival-btn');
const confirmRowsBtn = document.getElementById('confirm-rows-btn');

const backToMenuBtns = document.querySelectorAll('.back-to-menu-btn');
const restartBtn = document.getElementById('restart-btn');

const questionText = document.getElementById('question-text');
const answerButtons = document.querySelectorAll('.btn-answer');
const progressText = document.getElementById('progress');
const statusDisplay = document.getElementById('status-display');

const resultTitle = document.getElementById('result-title');
const resultLabel = document.getElementById('result-label');
const finalScoreText = document.getElementById('final-score');
const penaltyInfoText = document.getElementById('penalty-info');

startSpeedrunBtn.addEventListener('click', () => initGame("speedrun"));
startRowsBtn.addEventListener('click', openRowSelection);
startFillBtn.addEventListener('click', () => initGame("fill"));
startSurvivalBtn.addEventListener('click', () => initGame("survival"));
confirmRowsBtn.addEventListener('click', () => initGame("rows"));

backToMenuBtns.forEach(btn => btn.addEventListener('click', showMenu));
restartBtn.addEventListener('click', () => initGame(currentMode));

answerButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const val = parseInt(e.target.innerText);
        checkAnswer(val, e.target);
    });
});

function showScreen(screen) {
    [menuScreen, rowSelectScreen, gameScreen, resultScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');

    document.body.setAttribute('data-screen', screen.id);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        const colors = {
            'menu-screen': '#2d2b55',
            'row-select-screen': '#2b2b36',
            'game-screen': '#1e1e24',
            'result-screen': '#1e1e24'
        };
        themeColorMeta.setAttribute('content', colors[screen.id] || '#121214');
    }
}

function showMenu() {
    clearInterval(timerInterval);
    showScreen(menuScreen);
}

function openRowSelection() {
    const grid = document.getElementById('rows-grid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = `row-toggle ${selectedRows.includes(i) ? 'selected' : ''}`;
        btn.innerText = i;
        btn.addEventListener('click', () => {
            if (selectedRows.includes(i)) {
                if (selectedRows.length > 1) {
                    selectedRows = selectedRows.filter(r => r !== i);
                    btn.classList.remove('selected');
                }
            } else {
                selectedRows.push(i);
                btn.classList.add('selected');
            }
        });
        grid.appendChild(btn);
    }
    showScreen(rowSelectScreen);
}

function initGame(mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    penaltySeconds = 0;
    clearInterval(timerInterval);

    if (mode === "speedrun") {
        totalQuestions = 20;
        questions = generateQuestions(totalQuestions, [1,2,3,4,5,6,7,8,9,10], false);
        startStandardTimer();
    } else if (mode === "rows") {
        totalQuestions = 10;
        questions = generateQuestions(totalQuestions, selectedRows, false);
        startStandardTimer();
    } else if (mode === "fill") {
        totalQuestions = 15;
        questions = generateQuestions(totalQuestions, [1,2,3,4,5,6,7,8,9,10], true);
        startStandardTimer();
    } else if (mode === "survival") {
        lives = 3;
        survivalScore = 0;
        nextSurvivalQuestion();
        startSurvivalTimer();
    }

    if (mode !== "survival") {
        loadQuestion();
    }
    showScreen(gameScreen);
}

function startStandardTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000 + penaltySeconds;
        statusDisplay.innerText = elapsed.toFixed(1) + 's';
    }, 100);
}

function startSurvivalTimer() {
    survivalTimer = 5.0;
    timerInterval = setInterval(() => {
        survivalTimer -= 0.1;
        statusDisplay.innerText = Math.max(0, survivalTimer).toFixed(1) + 's';
        
        if (survivalTimer <= 0) {
            handleSurvivalMistake();
        }
    }, 100);
}

function nextSurvivalQuestion() {
    questions = generateQuestions(1, [1,2,3,4,5,6,7,8,9,10], Math.random() > 0.5);
    loadQuestion();
    progressText.innerText = `Punkte: ${survivalScore} | ${'♥'.repeat(lives)}`;
    survivalTimer = 5.0;
}

function loadQuestion() {
    const q = questions[currentMode === "survival" ? 0 : currentQuestionIndex];
    questionText.innerText = q.displayText;

    if (currentMode !== "survival") {
        progressText.innerText = `Frage ${currentQuestionIndex + 1} / ${totalQuestions}`;
    }

    answerButtons.forEach((btn, idx) => {
        btn.innerText = q.options[idx];
        btn.classList.remove('wrong-disabled');
    });
}

function checkAnswer(selectedValue, buttonElement) {
    const q = questions[currentMode === "survival" ? 0 : currentQuestionIndex];

    if (selectedValue === q.correct) {
        triggerFlash('flash-correct');

        if (currentMode === "survival") {
            survivalScore++;
            nextSurvivalQuestion();
        } else {
            currentQuestionIndex++;
            if (currentQuestionIndex < totalQuestions) {
                loadQuestion();
            } else {
                finishGame();
            }
        }
    } else {
        triggerFlash('flash-wrong');
        buttonElement.classList.add('wrong-disabled');

        if (currentMode === "survival") {
            handleSurvivalMistake();
        } else {
            penaltySeconds += 5;
        }
    }
}

function handleSurvivalMistake() {
    lives--;
    if (lives > 0) {
        nextSurvivalQuestion();
    } else {
        finishGame();
    }
}

function triggerFlash(className) {
    gameScreen.classList.remove('flash-correct', 'flash-wrong');
    document.body.classList.remove('flash-correct', 'flash-wrong');

    void gameScreen.offsetWidth; 

    gameScreen.classList.add(className);
    document.body.classList.add(className);

    setTimeout(() => {
        gameScreen.classList.remove(className);
        document.body.classList.remove(className);
    }, 300);
}

function finishGame() {
    clearInterval(timerInterval);
    resultTitle.innerText = "Geschafft! 🎉";
    penaltyInfoText.innerText = "";

    if (currentMode === "survival") {
        resultTitle.innerText = "Game Over! 💔";
        resultLabel.innerText = "Erzielte Punkte:";
        finalScoreText.innerText = survivalScore;
    } else {
        const totalTime = ((Date.now() - startTime) / 1000 + penaltySeconds).toFixed(1);
        resultLabel.innerText = "Deine Zeit:";
        finalScoreText.innerText = `${totalTime}s`;
        if (penaltySeconds > 0) {
            penaltyInfoText.innerText = `(Inkl. ${penaltySeconds}s Strafe für Fehler)`;
        } else {
            penaltyInfoText.innerText = 'Fehlerfrei! Ausgezeichnet!';
        }
    }

    showScreen(resultScreen);
}

function generateQuestions(count, allowedRows, isFillMode) {
    const list = [];
    for (let i = 0; i < count; i++) {
        const num1 = allowedRows[Math.floor(Math.random() * allowedRows.length)];
        const num2 = Math.floor(Math.random() * 10) + 1;
        const result = num1 * num2;

        let displayText = "";
        let correct = 0;

        if (isFillMode) {
            const hideFirst = Math.random() > 0.5;
            if (hideFirst) {
                displayText = `? × ${num2} = ${result}`;
                correct = num1;
            } else {
                displayText = `${num1} × ? = ${result}`;
                correct = num2;
            }
        } else {
            displayText = `${num1} × ${num2}`;
            correct = result;
        }

        const options = generateSmartOptions(num1, num2, correct, isFillMode);
        list.push({ displayText, correct, options });
    }
    return list;
}

function generateSmartOptions(num1, num2, correct, isFillMode) {
    const options = new Set([correct]);
    let attempts = 0;

    while (options.size < 4 && attempts < 100) {
        attempts++;
        let wrong;

        if (isFillMode) {
            wrong = Math.floor(Math.random() * 10) + 1;
        } else {
            const rand = Math.random();
            if (rand < 0.5) {
                const diff = (Math.floor(Math.random() * 5) - 2) || 1;
                wrong = num1 * Math.max(1, num2 + diff);
            } else {
                const diff = (Math.floor(Math.random() * 5) - 2) || 1;
                wrong = num2 * Math.max(1, num1 + diff);
            }
        }

        if (wrong > 0 && wrong !== correct) {
            options.add(wrong);
        }
    }

    let fallback = 1;
    while (options.size < 4) {
        if (fallback !== correct) {
            options.add(fallback);
        }
        fallback++;
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
}