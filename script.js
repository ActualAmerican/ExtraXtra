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
    const articleImg = document.getElementById("article-img");
    const articlePdf = document.getElementById("article-pdf");
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

    // Curated set
    const articleSet = [
        { id: "1914-06-29", date: "1914-06-29", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1914-06-29/ed-1/seq-1.pdf" },
        { id: "1929-10-29", date: "1929-10-29", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1929-10-29/ed-1/seq-1.pdf" },
        { id: "1933-03-04", date: "1933-03-04", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83045462/1933-03-04/ed-1/seq-1.pdf" },
        { id: "1941-12-08", date: "1941-12-08", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83045462/1941-12-08/ed-1/seq-1.pdf" },
        { id: "1955-12-01", date: "1955-12-01", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1955-12-01/ed-1/seq-1.pdf" },
        { id: "1963-11-23", date: "1963-11-23", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1963-11-23/ed-1/seq-1.pdf" },
        { id: "1969-07-21", date: "1969-07-21", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1969-07-21/ed-1/seq-1.pdf" },
        { id: "1918-11-11", date: "1918-11-11", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1918-11-11/ed-1/seq-1.pdf" },
        { id: "1920-08-26", date: "1920-08-26", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83045462/1920-08-26/ed-1/seq-1.pdf" },
        { id: "1945-08-15", date: "1945-08-15", pdf: "https://chroniclingamerica.loc.gov/lccn/sn83045462/1945-08-15/ed-1/seq-1.pdf" }
    ];

    // PDF to Image Conversion
    async function preloadPDF(pdfUrl) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js";
        try {
            const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
            const page = await pdf.getPage(1);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const viewport = page.getViewport({ scale: 2.0 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            return canvas.toDataURL("image/jpeg", 0.8);
        } catch (e) {
            console.error("PDF load failed:", e);
            return null;
        }
    }

    // Show timeframe screen
    function showTimeframeScreen(mode) {
        currentMode = mode;
        modeScreen.style.display = "none";
        timeframeScreen.style.display = "block";
    }

    // Start game
    function startGame(timeframe) {
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
        submitButton.disabled = false;
        hintButton.disabled = false;
        feedback.textContent = "";
        updateDisplay();
        setupInput(timeframe);
        fetchArticle();
        if (currentMode === "time-limit") startTimer();
        console.log(`Game started in ${currentMode} ${timeframe} mode`);
    }

    // Get base multiplier
    function getBaseMultiplier() {
        return { decade: 1.0, year: 1.5, month: 2.0, day: 2.5 }[currentTimeframe];
    }

    // Setup input
    function setupInput(timeframe) {
        inputContainer.innerHTML = "";
        let input;
        switch (timeframe) {
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
    standardModeBtn.addEventListener("click", () => showTimeframeScreen("standard"));
    timeLimitModeBtn.addEventListener("click", () => showTimeframeScreen("time-limit"));

    // Timeframe listeners
    timeframeDecadeBtn.addEventListener("click", () => startGame("decade"));
    timeframeYearBtn.addEventListener("click", () => startGame("year"));
    timeframeMonthBtn.addEventListener("click", () => startGame("month"));
    timeframeDayBtn.addEventListener("click", () => startGame("day"));
    backToModeBtn.addEventListener("click", () => {
        timeframeScreen.style.display = "none";
        modeScreen.style.display = "block";
    });

    // Fetch article
    async function fetchArticle() {
        try {
            if (!articleQueue.length) {
                articleQueue = [...articleSet]; // Clone and shuffle
                articleQueue.sort(() => Math.random() - 0.5);
            }
            const article = articleQueue.shift();

            correctDate = {
                year: parseInt(article.date.substring(0, 4)),
                month: article.date.length >= 7 ? parseInt(article.date.substring(5, 7)) : 1,
                day: article.date.length >= 10 ? parseInt(article.date.substring(8, 10)) : 1,
                decade: Math.floor(parseInt(article.date.substring(0, 4)) / 10) * 10
            };
            console.log("Selected Article:", article);

            const imgData = await preloadPDF(article.pdf);
            if (imgData) {
                articleImg.src = imgData;
                articleImg.style.display = "block";
                articlePdf.style.display = "none";
                articleText.style.display = "none";
            } else {
                articlePdf.src = article.pdf;
                articlePdf.style.display = "block";
                articleImg.style.display = "none";
                articleText.style.display = "none";
            }

            articleContainer.classList.remove("era-1800s", "era-1900s", "era-2000s");
            if (correctDate.year < 1900) articleContainer.classList.add("era-1800s");
            else if (correctDate.year < 2000) articleContainer.classList.add("era-1900s");
            else articleContainer.classList.add("era-2000s");

            const input = document.getElementById("guess-input");
            if (currentTimeframe === "decade") {
                input.min = correctDate.decade - 10;
                input.max = correctDate.decade + 10;
            } else if (currentTimeframe === "year") {
                input.min = correctDate.year - 5;
                input.max = correctDate.year + 5;
            }
            hintButton.disabled = hintsUsed >= 5;
            hintLocked = false;
            timeRemaining = 30;
            updateDisplay();
            if (currentMode === "time-limit") startTimer();
            updateHintButtonText();

            if (articleQueue.length) preloadPDF(articleQueue[0].pdf); // Preload next
        } catch (error) {
            console.error("Error loading article:", error);
            articleText.innerHTML = "Error loading article: " + error.message;
            articleImg.style.display = "none";
            articlePdf.style.display = "none";
            articleText.style.display = "block";
        }
    }

    // Zoom controls
    window.zoomIn = function() {
        let scale = parseFloat(articleImg.style.transform.replace("scale(", "").replace(")", "") || 1);
        scale = Math.min(3, scale + 0.2);
        requestAnimationFrame(() => articleImg.style.transform = `scale(${scale})`);
    };
    window.zoomOut = function() {
        let scale = parseFloat(articleImg.style.transform.replace("scale(", "").replace(")", "") || 1);
        scale = Math.max(0.5, scale - 0.2);
        requestAnimationFrame(() => articleImg.style.transform = `scale(${scale})`);
    };

    // Redact text
    function redactText(text) {
        text = text.replace(/\b(18|19|20)\d{2}\b/g, "[DATE]");
        text = text.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, "[MONTH]");
        text = text.replace(/\b(Mr|Mrs|Ms|Dr|President|King|Queen)\.?\s+[A-Z][a-z]+\b/g, "[NAME]");
        text = text.replace(/\b(London|Paris|New York|Washington)\b/g, "[PLACE]");
        return text;
    }

    // Start timer
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
                setTimeout(() => {
                    feedback.className = "feedback";
                    hintLocked = false;
                    endGame();
                }, 500);
            }
        }, 1000);
    }

    // Handle guess
    submitButton.addEventListener("click", () => {
        const input = document.getElementById("guess-input");
        let guess;
        if (currentTimeframe === "month") {
            const [year, month] = input.value.split("-");
            guess = { year: parseInt(year), month: parseInt(month) };
        } else if (currentTimeframe === "day") {
            const [year, month, day] = input.value.split("-");
            guess = { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
        } else {
            guess = parseInt(input.value);
        }
        console.log("User Guess:", guess);

        if (!guess || (typeof guess === "object" && (isNaN(guess.year) || (currentTimeframe !== "year" && isNaN(guess.month))))) {
            feedback.textContent = "Please enter a valid guess.";
            feedback.className = "feedback incorrect";
            return;
        }

        if (checkGuess(guess)) {
            updateScore();
            feedback.textContent = "Correct! Onward to the next article.";
            feedback.className = "feedback correct";
            clearInterval(timerInterval);
            updateDisplay();
            setTimeout(() => {
                feedback.textContent = "";
                feedback.className = "feedback";
                hintLocked = false;
                fetchArticle();
                input.value = "";
            }, 3000);
        } else {
            feedback.textContent = "Incorrect!";
            feedback.className = "feedback incorrect";
            clearInterval(timerInterval);
            setTimeout(() => {
                feedback.className = "feedback";
                hintLocked = false;
                endGame();
            }, 500);
        }
    });

    // Hint button logic
    hintButton.addEventListener("click", () => {
        const hintCost = 200 + hintsUsed * 100;
        if (hintsUsed < 5 && score >= hintCost && !hintLocked) {
            hintsUsed++;
            score -= hintCost;
            hintButton.disabled = hintsUsed >= 5;
            hintLocked = true;
            let hintText;
            switch (currentTimeframe) {
                case "decade": hintText = `Hint: The decade is between ${correctDate.decade - 20} and ${correctDate.decade + 20}. (-${hintCost} points)`; break;
                case "year": hintText = `Hint: The year is between ${correctDate.year - 5} and ${correctDate.year + 5}. (-${hintCost} points)`; break;
                case "month": hintText = `Hint: The year is ${correctDate.year}. (-${hintCost} points)`; break;
                case "day":
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    hintText = `Hint: The date is in ${monthNames[correctDate.month - 1]} ${correctDate.year}. (-${hintCost} points)`; break;
            }
            feedback.textContent = hintText;
            feedback.className = "feedback hint";
            lastHintText = hintText;
            updateDisplay();
            updateHintButtonText();
            console.log(`Hint ${hintsUsed} used: ${hintText}, Cost: ${hintCost} points`);
        } else if (hintsUsed >= 5) {
            feedback.textContent = "No more hints available!";
            feedback.className = "feedback";
        } else if (hintLocked) {
            feedback.textContent = "Hint locked until next guess!";
            feedback.className = "feedback";
            setTimeout(() => {
                feedback.textContent = lastHintText;
                feedback.className = "feedback hint";
            }, 1000);
        } else {
            feedback.textContent = `Not enough points for hint (${hintCost} required)!`;
            feedback.className = "feedback";
        }
    });

    // Update hint button text
    function updateHintButtonText() {
        const hintCost = 200 + hintsUsed * 100;
        hintButton.textContent = hintsUsed < 5 ? `Hint (-${hintCost} points)` : "Hint (Max Used)";
    }

    // Check guess
    function checkGuess(guess) {
        switch (currentTimeframe) {
            case "decade": return guess === correctDate.decade;
            case "year": return guess === correctDate.year;
            case "month": return guess.year === correctDate.year && guess.month === correctDate.month;
            case "day": return guess.year === correctDate.year && guess.month === correctDate.month && guess.day === correctDate.day;
        }
        return false;
    }

    // Update score
    function updateScore() {
        const basePoints = { decade: 100, year: 200, month: 300, day: 400 }[currentTimeframe];
        const maxBaseMultiplier = { decade: 5.0, year: 8.0, month: 10.0, day: 15.0 }[currentTimeframe];
        streak++;
        baseMultiplier = Math.min(getBaseMultiplier() + (streak - 1) * 0.1, maxBaseMultiplier);
        multiplier = currentMode === "time-limit" ? baseMultiplier * 2 : baseMultiplier;
        const maxMultiplier = maxBaseMultiplier * (currentMode === "time-limit" ? 2 : 1);
        multiplier = Math.min(multiplier, maxMultiplier);
        score += basePoints * multiplier;
    }

    // Update display
    function updateDisplay() {
        scoreDisplay.textContent = Math.round(score);
        streakDisplay.textContent = streak;
        multiplierDisplay.textContent = baseMultiplier.toFixed(1);
        timeLimitMultiplierDisplay.textContent = currentMode === "time-limit" ? " x2" : "";
        hintsUsedDisplay.textContent = hintsUsed === 5 ? "5 (MAX)" : hintsUsed;
        timeRemainingDisplay.textContent = timeRemaining;
        timeLeftDisplay.style.display = currentMode === "time-limit" ? "block" : "none";
        debugAnswer.textContent = correctDate ? `Debug Answer: ${correctDate.year}-${String(correctDate.month).padStart(2, '0')}-${String(correctDate.day).padStart(2, '0')}` : "Debug Answer: Loading...";
    }

    // End game
    function endGame() {
        clearInterval(timerInterval);
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
    restartButton.addEventListener("click", () => startGame(currentTimeframe));
    backToMenuButton.addEventListener("click", () => {
        clearInterval(timerInterval);
        endgameScreen.style.display = "none";
        modeScreen.style.display = "block";
    });
    shareButton.addEventListener("click", () => {
        const text = `I scored ${Math.round(score)} in ExtraXtra ${currentMode} ${currentTimeframe} mode! Beat that!`;
        if (navigator.share) navigator.share({ text }).catch(err => console.error("Share failed:", err));
        else alert("Share not supported. Copy this: " + text);
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