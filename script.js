document.addEventListener("DOMContentLoaded", () => {
    const modeScreen = document.getElementById("mode-screen");
    const timeframeScreen = document.getElementById("timeframe-screen");
    const gameScreen = document.getElementById("game-screen");
    const endgameScreen = document.getElementById("endgame-screen");
    const standardModeBtn = document.getElementById("standard-mode");
    const timeLimitModeBtn = document.getElementById("time-limit-mode");
    const timeframeDecadeBtn = document.getElementById("timeframe-decade");
    const timeframeYearBtn = document.getElementById("timeframe-year");
    const timeframeMonthBtn = document.getElementById("timeframe-month");
    const timeframeDayBtn = document.getElementById("timeframe-day");
    const backToModeBtn = document.getElementById("back-to-mode");
    const modeDisplay = document.getElementById("mode-display");
    const articleContainer = document.getElementById("article-container");
    const articleText = document.getElementById("article-text");
    const inputContainer = document.getElementById("input-container");
    const inputLabel = document.getElementById("input-label");
    const submitButton = document.getElementById("submit-guess");
    const hintButton = document.getElementById("hint-button");
    const scoreDisplay = document.getElementById("score");
    const streakDisplay = document.getElementById("streak");
    const multiplierDisplay = document.getElementById("multiplier");
    const timeLimitMultiplierDisplay = document.getElementById("time-limit-multiplier");
    const hintsUsedDisplay = document.getElementById("hints-used");
    const timeLeftDisplay = document.getElementById("time-left");
    const timeRemainingDisplay = document.getElementById("time-remaining");
    const feedback = document.getElementById("feedback");
    const debugAnswer = document.getElementById("debug-answer");
    const endgameMessage = document.getElementById("endgame-message");
    const endgameScore = document.getElementById("endgame-score");
    const personalBestDisplay = document.getElementById("personal-best");
    const restartButton = document.getElementById("restart-game");
    const shareButton = document.getElementById("share-score");
    const watchAdButton = document.getElementById("watch-ad");
    const backToMenuButton = document.getElementById("back-to-menu");

    let score = 0;
    let streak = 0;
    let baseMultiplier = 1.0;
    let multiplier = 1.0;
    let currentMode;
    let currentTimeframe;
    let correctDate;
    let adUsed = false;
    let hintsUsed = 0;
    let hintLocked = false;
    let lastHintText = "";
    let timeRemaining = 30;
    let timerInterval = null;
    let personalBest = localStorage.getItem("personalBest") ? parseInt(localStorage.getItem("personalBest")) : 0;
    let articleQueue = [];

    // Fetch a single random article from the Chronicling America API
    async function fetchRandomArticle() {
        try {
            const proxyUrl = "https://api.allorigins.win/get?url=";
            const apiUrl = encodeURIComponent("https://chroniclingamerica.loc.gov/search/pages/results/?rows=1&format=json&sort=random");
            const response = await fetch(proxyUrl + apiUrl);
            const data = await response.json();
            const articleData = JSON.parse(data.contents);

            if (!articleData.items || articleData.items.length === 0) {
                throw new Error("No articles found");
            }

            const article = articleData.items[0];
            const date = article.date;
            const year = parseInt(date.substring(0, 4));
            const month = parseInt(date.substring(4, 6));
            const day = parseInt(date.substring(6, 8));
            const textUrl = `https://chroniclingamerica.loc.gov${article.url.replace(".json", "/ocr.txt")}`;

            const textResponse = await fetch(proxyUrl + encodeURIComponent(textUrl));
            const textData = await textResponse.json();
            let text = textData.contents;

            // Redact sensitive information
            text = redactText(text);

            return {
                text: text,
                correctDate: { year, month, day, decade: Math.floor(year / 10) * 10 }
            };
        } catch (error) {
            console.error("Error fetching article:", error);
            return null;
        }
    }

    // Preload articles into the queue in the background
    async function preloadArticles(count = 5) {
        const promises = Array.from({ length: count }, fetchRandomArticle);
        const articles = await Promise.all(promises);
        articleQueue.push(...articles.filter((article) => article !== null));
    }

    // Show timeframe selection screen
    function showTimeframeScreen(mode) {
        currentMode = mode;
        modeScreen.style.display = "none";
        timeframeScreen.style.display = "block";
    }

    // Start the game
    async function startGame(timeframe) {
        currentTimeframe = timeframe;
        modeDisplay.textContent = `${currentMode === "time-limit" ? "Time Limit " : "Standard "}${timeframe}`;
        timeframeScreen.style.display = "none";
        gameScreen.style.display = "block";
        endgameScreen.style.display = "none";
        score = 0;
        streak = 0;
        baseMultiplier = getBaseMultiplier();
        multiplier = currentMode === "time-limit" ? baseMultiplier * 2 : baseMultiplier;
        adUsed = false;
        hintsUsed = 0;
        hintLocked = false;
        timeRemaining = 30;
        articleQueue = [];
        submitButton.disabled = false;
        hintButton.disabled = false;
        feedback.textContent = "";
        updateDisplay();
        setupInput(timeframe);
        await preloadArticles(5); // Initial batch of 5 articles
        fetchArticle();
        if (currentMode === "time-limit") startTimer();
        console.log(`Game started in ${currentMode} ${timeframe} mode`);
    }

    // Get base multiplier based on timeframe
    function getBaseMultiplier() {
        return { decade: 1.0, year: 1.5, month: 2.0, day: 2.5 }[currentTimeframe];
    }

    // Setup input field based on timeframe
    function setupInput(timeframe) {
        inputContainer.innerHTML = "";
        let input;
        switch (timeframe) {
            case "decade":
                input = createInput("number", "guess-input", "10", "1800", "2020", "e.g., 1920");
                inputLabel.textContent = "Enter the decade (e.g., 1920):";
                break;
            case "year":
                input = createInput("number", "guess-input", "1", "1800", "2020", "e.g., 1923");
                inputLabel.textContent = "Enter the year (e.g., 1923):";
                break;
            case "month":
                input = createInput("month", "guess-input", null, "1800-01", "2020-12");
                inputLabel.textContent = "Enter the year and month (e.g., 1923-08):";
                break;
            case "day":
                input = createInput("date", "guess-input", null, "1800-01-01", "2020-12-31");
                inputLabel.textContent = "Enter the full date (e.g., 1923-08-15):";
                break;
        }
        inputContainer.appendChild(input);
    }

    // Helper to create input elements
    function createInput(type, id, step, min, max, placeholder) {
        const input = document.createElement("input");
        input.type = type;
        input.id = id;
        if (step) input.step = step;
        if (min) input.min = min;
        if (max) input.max = max;
        if (placeholder) input.placeholder = placeholder;
        return input;
    }

    // Event listeners for mode selection
    standardModeBtn.addEventListener("click", () => showTimeframeScreen("standard"));
    timeLimitModeBtn.addEventListener("click", () => showTimeframeScreen("time-limit"));

    // Event listeners for timeframe selection
    timeframeDecadeBtn.addEventListener("click", () => startGame("decade"));
    timeframeYearBtn.addEventListener("click", () => startGame("year"));
    timeframeMonthBtn.addEventListener("click", () => startGame("month"));
    timeframeDayBtn.addEventListener("click", () => startGame("day"));
    backToModeBtn.addEventListener("click", () => {
        timeframeScreen.style.display = "none";
        modeScreen.style.display = "block";
    });

    // Fetch and display the next article
    async function fetchArticle() {
        if (articleQueue.length <= 2) {
            preloadArticles(5); // Replenish queue when low
        }
        if (articleQueue.length > 0) {
            const article = articleQueue.shift();
            correctDate = article.correctDate;
            articleText.innerHTML = article.text.replace(/\n/g, "<br>");
            articleText.style.display = "block";

            articleContainer.classList.remove("era-1800s", "era-1900s", "era-2000s");
            articleContainer.classList.add(correctDate.year < 1900 ? "era-1800s" : correctDate.year < 2000 ? "era-1900s" : "era-2000s");

            hintButton.disabled = hintsUsed >= 5;
            hintLocked = false;
            timeRemaining = 30;
            updateDisplay();
            if (currentMode === "time-limit") startTimer();
            updateHintButtonText();
        } else {
            articleText.innerHTML = "Loading article...";
            const article = await fetchRandomArticle();
            if (article) {
                articleQueue.push(article);
                fetchArticle();
            } else {
                articleText.innerHTML = "Error loading article. Please try again.";
            }
        }
    }

    // Redact sensitive information with black bar styling
    function redactText(text) {
        text = text.replace(/\b(18|19|20)\d{2}\b/g, '<span class="redacted">[DATE]</span>');
        text = text.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, '<span class="redacted">[MONTH]</span>');
        text = text.replace(/\b\d{1,2}(st|nd|rd|th)?\b/g, '<span class="redacted">[DAY]</span>');
        text = text.replace(/\b(Mr|Mrs|Ms|Dr|President|King|Queen)\.?\s+[A-Z][a-z]+\b/g, '<span class="redacted">[NAME]</span>');
        text = text.replace(/\b(London|Paris|New York|Washington)\b/g, '<span class="redacted">[PLACE]</span>');
        return text;
    }

    // Start the timer for time-limit mode
    function startTimer() {
        clearInterval(timerInterval);
        timeLeftDisplay.style.display = "block";
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateDisplay();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                feedback.textContent = "Time's up!";
                feedback.className = "feedback incorrect";
                setTimeout(endGame, 500);
            }
        }, 1000);
    }

    // Handle guess submission
    submitButton.addEventListener("click", () => {
        const input = document.getElementById("guess-input");
        let guess = parseGuess(input.value);
        if (!guess) {
            feedback.textContent = "Please enter a valid guess.";
            feedback.className = "feedback incorrect";
            return;
        }

        if (checkGuess(guess)) {
            updateScore();
            feedback.textContent = "Correct! Next article loading...";
            feedback.className = "feedback correct";
            clearInterval(timerInterval);
            setTimeout(() => {
                feedback.textContent = "";
                feedback.className = "feedback";
                hintLocked = false;
                fetchArticle();
                input.value = "";
            }, 2000);
        } else {
            feedback.textContent = "Incorrect!";
            feedback.className = "feedback incorrect";
            clearInterval(timerInterval);
            setTimeout(endGame, 500);
        }
    });

    // Parse user input based on timeframe
    function parseGuess(value) {
        if (!value) return null;
        if (currentTimeframe === "decade" || currentTimeframe === "year") return parseInt(value);
        if (currentTimeframe === "month") {
            const [year, month] = value.split("-");
            return { year: parseInt(year), month: parseInt(month) };
        }
        if (currentTimeframe === "day") {
            const [year, month, day] = value.split("-");
            return { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
        }
        return null;
    }

    // Check if the guess is correct
    function checkGuess(guess) {
        switch (currentTimeframe) {
            case "decade": return guess === correctDate.decade;
            case "year": return guess === correctDate.year;
            case "month": return guess.year === correctDate.year && guess.month === correctDate.month;
            case "day": return guess.year === correctDate.year && guess.month === correctDate.month && guess.day === correctDate.day;
            default: return false;
        }
    }

    // Update the score
    function updateScore() {
        const basePoints = { decade: 100, year: 200, month: 300, day: 400 }[currentTimeframe];
        streak++;
        baseMultiplier = Math.min(getBaseMultiplier() + (streak - 1) * 0.1, { decade: 5.0, year: 8.0, month: 10.0, day: 15.0 }[currentTimeframe]);
        multiplier = currentMode === "time-limit" ? baseMultiplier * 2 : baseMultiplier;
        score += basePoints * multiplier;
        updateDisplay();
    }

    // Handle hint requests
    hintButton.addEventListener("click", () => {
        const hintCost = 200 + hintsUsed * 100;
        if (hintsUsed >= 5) {
            feedback.textContent = "No more hints available!";
            feedback.className = "feedback";
        } else if (score < hintCost) {
            feedback.textContent = `Not enough points for hint (${hintCost} required)!`;
            feedback.className = "feedback";
        } else if (!hintLocked) {
            hintsUsed++;
            score -= hintCost;
            hintButton.disabled = hintsUsed >= 5;
            hintLocked = true;
            const hintText = generateHint();
            feedback.textContent = hintText;
            feedback.className = "feedback hint";
            lastHintText = hintText;
            updateDisplay();
            updateHintButtonText();
        }
    });

    // Generate hint text
    function generateHint() {
        const hintCost = 200 + (hintsUsed - 1) * 100;
        switch (currentTimeframe) {
            case "decade": return `Hint: Decade is between ${correctDate.decade - 20} and ${correctDate.decade + 20}. (-${hintCost} points)`;
            case "year": return `Hint: Year is between ${correctDate.year - 5} and ${correctDate.year + 5}. (-${hintCost} points)`;
            case "month": return `Hint: Year is ${correctDate.year}. (-${hintCost} points)`;
            case "day": return `Hint: Month is ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][correctDate.month - 1]}. (-${hintCost} points)`;
        }
    }

    // Update hint button text
    function updateHintButtonText() {
        const hintCost = 200 + hintsUsed * 100;
        hintButton.textContent = hintsUsed < 5 ? `Hint (-${hintCost} points)` : "Hint (Max Used)";
    }

    // Update UI elements
    function updateDisplay() {
        scoreDisplay.textContent = Math.round(score);
        streakDisplay.textContent = streak;
        multiplierDisplay.textContent = baseMultiplier.toFixed(1);
        timeLimitMultiplierDisplay.textContent = currentMode === "time-limit" ? " x2" : "";
        hintsUsedDisplay.textContent = hintsUsed === 5 ? "5 (MAX)" : hintsUsed;
        timeRemainingDisplay.textContent = timeRemaining;
        timeLeftDisplay.style.display = currentMode === "time-limit" ? "block" : "none";
        debugAnswer.textContent = correctDate ? `Debug Answer: ${correctDate.year}-${String(correctDate.month).padStart(2, "0")}-${String(correctDate.day).padStart(2, "0")}` : "Loading...";
    }

    // End the game
    function endGame() {
        clearInterval(timerInterval);
        gameScreen.style.display = "none";
        endgameScreen.style.display = "block";
        const finalScore = Math.round(score);
        endgameMessage.textContent = `The correct date was ${correctDate.year}-${String(correctDate.month).padStart(2, "0")}-${String(correctDate.day).padStart(2, "0")}.`;
        endgameScore.textContent = finalScore;
        personalBest = Math.max(personalBest, finalScore);
        personalBestDisplay.textContent = personalBest;
        localStorage.setItem("personalBest", personalBest);
        watchAdButton.disabled = adUsed;
    }

    // Endgame button listeners
    restartButton.addEventListener("click", () => startGame(currentTimeframe));
    backToMenuButton.addEventListener("click", () => {
        clearInterval(timerInterval);
        endgameScreen.style.display = "none";
        modeScreen.style.display = "block";
    });
    shareButton.addEventListener("click", () => {
        const text = `I scored ${Math.round(score)} in ExtraXtra ${currentMode} ${currentTimeframe} mode!`;
        navigator.share ? navigator.share({ text }).catch(console.error) : alert("Copy this: " + text);
    });
    watchAdButton.addEventListener("click", () => {
        if (!adUsed) {
            adUsed = true;
            watchAdButton.disabled = true;
            endgameScreen.style.display = "none";
            gameScreen.style.display = "block";
            fetchArticle();
        }
    });

    console.log("Game initialized, awaiting mode selection...");
});