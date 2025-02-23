document.addEventListener("DOMContentLoaded", () => {
    const menuScreen = document.getElementById("menu-screen");
    const gameScreen = document.getElementById("game-screen");
    const endgameScreen = document.getElementById("endgame-screen");
    const modeDecadeBtn = document.getElementById("mode-decade");
    const modeYearBtn = document.getElementById("mode-year");
    const modeMonthBtn = document.getElementById("mode-month");
    const modeDayBtn = document.getElementById("mode-day");
    const modeDisplay = document.getElementById("mode-display");
    const articleContainer = document.getElementById("article-container");
    const articleText = document.getElementById("article-text");
    const inputContainer = document.getElementById("input-container");
    const inputLabel = document.getElementById("input-label");
    const submitButton = document.getElementById("submit-guess");
    const scoreDisplay = document.getElementById("score");
    const streakDisplay = document.getElementById("streak");
    const multiplierDisplay = document.getElementById("multiplier");
    const feedback = document.getElementById("feedback");
    const endgameMessage = document.getElementById("endgame-message");
    const endgameScore = document.getElementById("endgame-score");
    const personalBestDisplay = document.getElementById("personal-best");
    const restartButton = document.getElementById("restart-game");
    const shareButton = document.getElementById("share-score");
    const watchAdButton = document.getElementById("watch-ad");
    const backToMenuButton = document.getElementById("back-to-menu");

    let score = 0;
    let streak = 0;
    let multiplier = 1.0;
    let currentMode;
    let correctDate;
    let adUsed = false;
    let personalBest = localStorage.getItem("personalBest") ? parseInt(localStorage.getItem("personalBest")) : 0;

    // Start game
    function startGame(mode) {
        currentMode = mode;
        modeDisplay.textContent = mode;
        menuScreen.style.display = "none";
        gameScreen.style.display = "block";
        endgameScreen.style.display = "none";
        score = 0;
        streak = 0;
        multiplier = 1.0;
        adUsed = false;
        submitButton.disabled = false;
        feedback.textContent = "";
        setupInput(mode);
        fetchArticle();
        updateDisplay();
        console.log(`Game started in ${mode} mode`);
    }

    // Setup input
    function setupInput(mode) {
        inputContainer.innerHTML = "";
        let input;
        switch (mode) {
            case "decade":
                input = document.createElement("input");
                input.type = "number";
                input.id = "guess-input";
                input.step = "10";
                input.min = "1800";
                input.max = "2020";
                input.placeholder = "e.g., 1920";
                inputLabel.textContent = "Enter the decade (e.g., 1920):";
                break;
            case "year":
                input = document.createElement("input");
                input.type = "number";
                input.id = "guess-input";
                input.min = "1800";
                input.max = "2020";
                input.placeholder = "e.g., 1923";
                inputLabel.textContent = "Enter the year (e.g., 1923):";
                break;
            case "month":
                input = document.createElement("input");
                input.type = "month";
                input.id = "guess-input";
                input.min = "1800-01";
                input.max = "2020-12";
                inputLabel.textContent = "Enter the year and month (e.g., 1923-08):";
                break;
            case "day":
                input = document.createElement("input");
                input.type = "date";
                input.id = "guess-input";
                input.min = "1800-01-01";
                input.max = "2020-12-31";
                inputLabel.textContent = "Enter the full date (e.g., 1923-08-15):";
                break;
        }
        inputContainer.appendChild(input);
    }

    // Mode listeners
    modeDecadeBtn.addEventListener("click", () => startGame("decade"));
    modeYearBtn.addEventListener("click", () => startGame("year"));
    modeMonthBtn.addEventListener("click", () => startGame("month"));
    modeDayBtn.addEventListener("click", () => startGame("day"));

    // Fetch article
    async function fetchArticle() {
        try {
            const response = await fetch("https://chroniclingamerica.loc.gov/search/pages/results/?format=json&proximity=5&rows=1&sort=date");
            const data = await response.json();
            console.log("API Response:", data);

            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                const date = item.date;
                correctDate = {
                    year: parseInt(date.substring(0, 4)),
                    month: parseInt(date.substring(4, 6)),
                    day: parseInt(date.substring(6, 8)),
                    decade: Math.floor(parseInt(date.substring(0, 4)) / 10) * 10
                };
                console.log("Correct Date:", correctDate);

                let text = item.ocr_eng || "No text available.";
                text = redactText(text);
                articleText.innerHTML = text;

                articleContainer.classList.remove("era-1800s", "era-1900s", "era-2000s");
                if (correctDate.year < 1900) {
                    articleContainer.classList.add("era-1800s");
                } else if (correctDate.year < 2000) {
                    articleContainer.classList.add("era-1900s");
                } else {
                    articleContainer.classList.add("era-2000s");
                }

                const input = document.getElementById("guess-input");
                if (currentMode === "decade") {
                    input.min = correctDate.decade - 10;
                    input.max = correctDate.decade + 10;
                } else if (currentMode === "year") {
                    input.min = correctDate.year - 5;
                    input.max = correctDate.year + 5;
                }
            } else {
                articleText.textContent = "Failed to load article. Try refreshing.";
            }
        } catch (error) {
            console.error("Error fetching article:", error);
            articleText.textContent = "Error loading article.";
        }
    }

    // Redact text
    function redactText(text) {
        text = text.replace(/\b(18|19|20)\d{2}\b/g, (match) => {
            const width = match.length * 0.6 + "em";
            return `<span class="redaction-bar" style="width: ${width}"></span>`;
        });
        text = text.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, (match) => {
            const width = match.length * 0.6 + "em";
            return `<span class="redaction-bar" style="width: ${width}"></span>`;
        });
        return text;
    }

    // Handle guess
    submitButton.addEventListener("click", () => {
        const input = document.getElementById("guess-input");
        let guess;
        if (currentMode === "month") {
            const [year, month] = input.value.split("-");
            guess = { year: parseInt(year), month: parseInt(month) };
        } else if (currentMode === "day") {
            const [year, month, day] = input.value.split("-");
            guess = { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
        } else {
            guess = parseInt(input.value);
        }
        console.log("User Guess:", guess);

        if (!guess || (typeof guess === "object" && (isNaN(guess.year) || (currentMode !== "year" && isNaN(guess.month))))) {
            feedback.textContent = "Please enter a valid guess.";
            feedback.className = "feedback incorrect";
            return;
        }

        if (checkGuess(guess)) {
            updateScore();
            feedback.textContent = "Correct! Onward to the next article.";
            feedback.className = "feedback correct";
            updateDisplay();
            setTimeout(() => {
                feedback.textContent = "";
                feedback.className = "feedback";
                fetchArticle();
                input.value = "";
            }, 3000);
        } else {
            feedback.textContent = "Incorrect!";
            feedback.className = "feedback incorrect";
            setTimeout(() => {
                feedback.className = "feedback";
                endGame();
            }, 500);
        }
    });

    // Check guess
    function checkGuess(guess) {
        switch (currentMode) {
            case "decade": return guess === correctDate.decade;
            case "year": return guess === correctDate.year;
            case "month": return guess.year === correctDate.year && guess.month === correctDate.month;
            case "day": return guess.year === correctDate.year && guess.month === correctDate.month && guess.day === correctDate.day;
        }
        return false;
    }

    // Update score with mode-specific multipliers and caps
    function updateScore() {
        const basePoints = { decade: 1, year: 2, month: 3, day: 4 }[currentMode];
        const multiplierIncrement = {
            decade: 0.05, // Easiest, smallest boost
            year: 0.15,   // Moderate increase
            month: 0.25,  // Bigger jump
            day: 0.40     // Hardest, biggest boost
        }[currentMode];
        const maxMultiplier = {
            decade: 2.5,  // Lowest cap
            year: 3.0,
            month: 3.5,
            day: 4.0      // Highest cap
        }[currentMode];
        streak++;
        multiplier = Math.min(1.0 + streak * multiplierIncrement, maxMultiplier);
        score += basePoints * multiplier;
    }

    // Update display
    function updateDisplay() {
        scoreDisplay.textContent = Math.round(score);
        streakDisplay.textContent = streak;
        multiplierDisplay.textContent = multiplier.toFixed(2);
    }

    // End game
    function endGame() {
        gameScreen.style.display = "none";
        endgameScreen.style.display = "block";
        const finalScore = Math.round(score);
        endgameMessage.textContent = `The correct date was ${correctDate.year}-${String(correctDate.month).padStart(2, '0')}-${String(correctDate.day).padStart(2, '0')}.`;
        endgameScore.textContent = finalScore;
        personalBest = Math.max(personalBest, finalScore);
        personalBestDisplay.textContent = personalBest;
        localStorage.setItem("personalBest", personalBest);
        watchAdButton.disabled = adUsed;
    }

    // Endgame actions
    restartButton.addEventListener("click", () => startGame(currentMode));
    backToMenuButton.addEventListener("click", () => {
        endgameScreen.style.display = "none";
        menuScreen.style.display = "block";
    });
    shareButton.addEventListener("click", () => {
        const text = `I scored ${Math.round(score)} in ExtraXtra ${currentMode} mode! Beat that!`;
        if (navigator.share) {
            navigator.share({ text }).catch(err => console.error("Share failed:", err));
        } else {
            alert("Share not supported. Copy this: " + text);
        }
    });
    watchAdButton.addEventListener("click", () => {
        if (!adUsed) {
            adUsed = true;
            watchAdButton.disabled = true;
            endgameScreen.style.display = "none";
            gameScreen.style.display = "block";
            fetchArticle();
            console.log("Ad watched - continuing game");
        }
    });

    console.log("Menu loaded, awaiting mode selection...");
});