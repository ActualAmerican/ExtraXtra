document.addEventListener("DOMContentLoaded", () => {
    // Menu elements
    const menuScreen = document.getElementById("menu-screen");
    const gameScreen = document.getElementById("game-screen");
    const modeDecadeBtn = document.getElementById("mode-decade");
    const modeDisplay = document.getElementById("mode-display");

    // Game elements
    const articleText = document.getElementById("article-text");
    const guessInput = document.getElementById("guess-input");
    const submitButton = document.getElementById("submit-guess");
    const scoreDisplay = document.getElementById("score");
    const streakDisplay = document.getElementById("streak");
    const feedback = document.getElementById("feedback");

    let score = 0;
    let streak = 0;
    let correctDecade;
    let currentMode = "decade";

    // Start game with selected mode
    function startGame(mode) {
        currentMode = mode;
        modeDisplay.textContent = mode;
        menuScreen.style.display = "none";
        gameScreen.style.display = "block";
        fetchArticle();
        console.log(`Game started in ${mode} mode`);
    }

    modeDecadeBtn.addEventListener("click", () => startGame("decade"));

    // Fetch article from Chronicling America API
    async function fetchArticle() {
        try {
            const response = await fetch("https://chroniclingamerica.loc.gov/search/pages/results/?format=json&proximity=5&rows=1&sort=date");
            const data = await response.json();
            console.log("API Response:", data);

            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                const date = item.date; // e.g., "19230115"
                correctDecade = Math.floor(parseInt(date.substring(0, 4)) / 10) * 10;
                console.log("Correct Decade:", correctDecade);

                // Redact time-sensitive info with black bars
                let text = item.ocr_eng || "No text available.";
                text = redactText(text);
                articleText.innerHTML = text; // Use innerHTML for styled spans

                // Narrow decade input range
                guessInput.min = correctDecade - 10;
                guessInput.max = correctDecade + 10;
            } else {
                articleText.textContent = "Failed to load article. Try refreshing.";
            }
        } catch (error) {
            console.error("Error fetching article:", error);
            articleText.textContent = "Error loading article.";
        }
    }

    // Redact text with black bars
    function redactText(text) {
        // Redact years (1800–2099)
        text = text.replace(/\b(18|19|20)\d{2}\b/g, (match) => {
            const width = match.length * 0.6 + "em"; // Approximate width based on character count
            return `<span class="redaction-bar" style="width: ${width}"></span>`;
        });
        // Redact months
        text = text.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, (match) => {
            const width = match.length * 0.6 + "em";
            return `<span class="redaction-bar" style="width: ${width}"></span>`;
        });
        return text;
    }

    // Handle guess submission
    submitButton.addEventListener("click", () => {
        const guess = parseInt(guessInput.value);
        console.log("User Guess:", guess);

        if (isNaN(guess)) {
            feedback.textContent = "Please enter a valid guess.";
            feedback.className = "feedback incorrect";
            return;
        }

        if (guess === correctDecade && currentMode === "decade") {
            score += 1;
            streak += 1;
            feedback.textContent = "Correct! Onward to the next article.";
            feedback.className = "feedback correct";
            updateScoreDisplay();
            setTimeout(() => {
                feedback.textContent = "";
                fetchArticle();
                guessInput.value = "";
            }, 1500);
        } else {
            feedback.textContent = `Game Over! The correct decade was ${correctDecade}. Final Score: ${score}`;
            feedback.className = "feedback incorrect";
            submitButton.disabled = true;
        }
    });

    // Update score and streak display
    function updateScoreDisplay() {
        scoreDisplay.textContent = score;
        streakDisplay.textContent = streak;
    }

    console.log("Menu loaded, awaiting mode selection...");
});