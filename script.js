let currentHeadline = { text: "", date: {} };
let score = 0;
let streak = 0;
let streakMultiplier = 1;
let gameState = { 
    difficulty: 'decade', // 'decade', 'year', 'month', or 'day'
    gameStarted: false
};
let timerInterval;
let timeLimit = 30; // seconds
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fetchHeadline() {
    const apiUrl = 'https://chroniclingamerica.loc.gov/search/pages/results/?format=json&proxtext=news&dateFilterType=yearRange&page=1';
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.items && data.items.length > 0) {
                const item = data.items[Math.floor(Math.random() * data.items.length)];
                const dateParts = item.date.split('-');
                currentHeadline = {
                    text: item.title,
                    date: {
                        year: parseInt(dateParts[0]),
                        month: parseInt(dateParts[1]),
                        day: parseInt(dateParts[2])
                    }
                };
                console.log("Headline fetched:", currentHeadline); // Debug log
                document.getElementById('headline').textContent = currentHeadline.text;
                updateGuessOptions();
            } else {
                document.getElementById('headline').textContent = "No headlines available. Refreshing...";
                setTimeout(fetchHeadline, 3000);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('headline').textContent = "Error loading headline. Please try again.";
            setTimeout(fetchHeadline, 5000);
        });
}

function updateGuessOptions() {
    console.log("Updating guess options for difficulty:", gameState.difficulty); // Debug log
    // Hide all guess containers
    document.getElementById('decadeGuess').style.display = 'none';
    document.getElementById('yearGuess').style.display = 'none';
    document.getElementById('monthGuess').style.display = 'none';
    document.getElementById('dayGuess').style.display = 'none';

    if (!gameState.gameStarted) {
        const difficultyRadios = document.getElementsByName('difficulty');
        for (let radio of difficultyRadios) {
            if (radio.checked) {
                gameState.difficulty = radio.value;
                break;
            }
        }
    }

    switch(gameState.difficulty) {
        case 'decade':
            document.getElementById('decadeGuess').style.display = 'block';
            const decadeSelect = document.getElementById('decadeSelect');
            decadeSelect.innerHTML = '';
            for (let i = 1700; i <= 2020; i += 10) {
                let option = document.createElement('option');
                option.value = i;
                option.text = `${i}s`;
                decadeSelect.appendChild(option);
            }
            break;
        case 'year':
            document.getElementById('yearGuess').style.display = 'block';
            const yearSelect = document.getElementById('yearSelect');
            yearSelect.innerHTML = '';
            console.log("Populating year dropdown for year mode"); // Debug log
            for (let i = 1700; i <= 2023; i++) {
                let option = document.createElement('option');
                option.value = i;
                option.text = i;
                yearSelect.appendChild(option);
            }
            console.log("Year dropdown populated with", yearSelect.options.length, "options"); // Debug log
            break;
        case 'month':
            document.getElementById('monthGuess').style.display = 'block';
            const monthInput = document.getElementById('monthInput');
            console.log("Month mode - game started:", gameState.gameStarted, "headline year:", currentHeadline.date.year); // Debug log
            if (!gameState.gameStarted || !currentHeadline.date.year) {
                // Before game starts, set min and max to full range
                console.log("Setting month input range before start"); // Debug log
                monthInput.min = "1700-01";
                monthInput.max = "2023-12";
            } else {
                // After game starts, narrow down to ±1 year from the headline date
                console.log("Setting narrowed month input range after start"); // Debug log
                const minYear = currentHeadline.date.year - 1;
                const maxYear = currentHeadline.date.year + 1;
                monthInput.min = `${minYear}-01`;
                monthInput.max = `${maxYear}-12`;
            }
            console.log("Month input range set to min:", monthInput.min, "max:", monthInput.max); // Debug log
            break;
        case 'day':
            document.getElementById('dayGuess').style.display = 'block';
            const dayYearSelect = document.getElementById('dayYearSelect');
            const dayMonthSelect = document.getElementById('dayMonthSelect');
            const daySelect = document.getElementById('daySelect');
            dayYearSelect.innerHTML = '';
            dayMonthSelect.innerHTML = '';
            daySelect.innerHTML = '';
            if (!gameState.gameStarted || !currentHeadline.date.year) {
                // Before game starts, show all years, all months, and all days (1-31)
                for (let i = 1700; i <= 2023; i++) {
                    let option = document.createElement('option');
                    option.value = i;
                    option.text = i;
                    dayYearSelect.appendChild(option);
                }
                months.forEach((month, index) => {
                    let option = document.createElement('option');
                    option.value = index + 1;
                    option.text = month;
                    dayMonthSelect.appendChild(option);
                });
                for (let i = 1; i <= 31; i++) {
                    let option = document.createElement('option');
                    option.value = i;
                    option.text = `${i}${getDaySuffix(i)}`;
                    daySelect.appendChild(option);
                }
            } else {
                // After game starts, narrow down to ±1 year, all months, and days in the correct month
                for (let i = -1; i <= 1; i++) {
                    const year = currentHeadline.date.year + i;
                    if (year >= 1700 && year <= 2023) {
                        let option = document.createElement('option');
                        option.value = year;
                        option.text = year;
                        dayYearSelect.appendChild(option);
                    }
                }
                months.forEach((month, index) => {
                    let option = document.createElement('option');
                    option.value = index + 1;
                    option.text = month;
                    dayMonthSelect.appendChild(option);
                });
                const daysInMonth = new Date(currentHeadline.date.year, currentHeadline.date.month, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    let option = document.createElement('option');
                    option.value = i;
                    option.text = `${i}${getDaySuffix(i)}`;
                    daySelect.appendChild(option);
                }
            }
            break;
    }
}

function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

function startGame() {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        const difficultyRadios = document.getElementsByName('difficulty');
        for (let radio of difficultyRadios) {
            radio.disabled = true; // Lock difficulty selection
            if (radio.checked) {
                gameState.difficulty = radio.value;
                break;
            }
        }
        document.getElementById('difficulty').style.display = 'none'; // Hide difficulty selection
        document.getElementById('activeMode').style.display = 'block'; // Show active mode
        document.getElementById('currentMode').textContent = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
        document.getElementById('guessContainer').style.display = 'block'; // Show guessing box
        document.querySelector('button[onclick="startGame()"]').style.display = 'none';
        fetchHeadline();
    }
}

function checkGuess() {
    let guess;
    let correct = false;
    let feedback = "";

    switch(gameState.difficulty) {
        case 'decade':
            guess = document.getElementById('decadeSelect').value;
            correct = Math.floor(currentHeadline.date.year / 10) * 10 === parseInt(guess);
            feedback = `The decade was the ${Math.floor(currentHeadline.date.year / 10) * 10}s.`;
            break;
        case 'year':
            guess = document.getElementById('yearSelect').value;
            correct = currentHeadline.date.year === parseInt(guess);
            feedback = `The year was ${currentHeadline.date.year}.`;
            break;
        case 'month':
            const monthInputValue = document.getElementById('monthInput').value;
            if (!monthInputValue) return; // Prevent submission if no value is selected
            const [guessYear, guessMonth] = monthInputValue.split('-').map(Number);
            console.log("Month mode guess:", guessYear, guessMonth); // Debug log
            correct = currentHeadline.date.year === guessYear && currentHeadline.date.month === guessMonth;
            feedback = `The month was ${new Date(1970, currentHeadline.date.month - 1, 1).toLocaleString('default', { month: 'long' })} ${currentHeadline.date.year}.`;
            break;
        case 'day':
            const dayYear = document.getElementById('dayYearSelect').value;
            const dayMonth = document.getElementById('dayMonthSelect').value;
            const day = document.getElementById('daySelect').value;
            guess = `${dayYear}-${dayMonth}-${day}`;
            const [guessYear2, guessMonth2, guessDay] = guess.split('-').map(Number);
            correct = currentHeadline.date.year === guessYear2 && currentHeadline.date.month === guessMonth2 && currentHeadline.date.day === guessDay;
            feedback = `The day was ${new Date(1970, currentHeadline.date.month - 1, 1).toLocaleString('default', { month: 'long' })} ${currentHeadline.date.day}${getDaySuffix(currentHeadline.date.day)}, ${currentHeadline.date.year}.`;
            break;
    }

    if(correct) {
        streak++;
        streakMultiplier = 1 + (streak * 0.1);
        score += Math.round(streakMultiplier);
        document.getElementById('result').textContent = "Correct!";
        document.getElementById('currentScore').textContent = score;
        document.getElementById('currentStreak').textContent = streak;
    } else {
        gameOver(feedback);
        return;
    }

    document.getElementById('guessContainer').querySelectorAll('select, input').forEach(input => {
        input.value = '';
    });
    fetchHeadline();
    if (gameState.difficulty !== 'decade' && gameState.difficulty !== 'year') {
        startTimer();
    } else {
        stopTimer();
    }
}

function gameOver(feedback) {
    document.getElementById('result').textContent = `Wrong! ${feedback} Game Over! Your final score: ${score}`;
    document.getElementById('guessContainer').querySelectorAll('select, input').forEach(input => {
        input.disabled = true;
    });
    document.getElementById('submitGuess').disabled = true;
    document.getElementById('next').style.display = 'none';
    document.getElementById('restart').style.display = 'inline-block';
    stopTimer();
    updateHighScore(score);
}

function updateHighScore(newScore) {
    const highScore = localStorage.getItem('highScore');
    if (!highScore || newScore > parseInt(highScore)) {
        localStorage.setItem('highScore', newScore);
        document.getElementById('score').innerHTML += `<br>New High Score: ${newScore}`;
    }
}

function newRound() {
    document.getElementById('guessContainer').querySelectorAll('select, input').forEach(input => {
        input.value = '';
        input.disabled = false;
    });
    document.getElementById('result').textContent = '';
    document.getElementById('next').style.display = 'none';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('submitGuess').disabled = false;
    fetchHeadline();
    
    if (gameState.difficulty !== 'decade' && gameState.difficulty !== 'year') {
        startTimer();
    } else {
        stopTimer();
    }
}

function startTimer() {
    let time = timeLimit;
    document.getElementById('timer').style.display = 'block';
    document.getElementById('timeLeft').textContent = time;

    timerInterval = setInterval(() => {
        time--;
        document.getElementById('timeLeft').textContent = time;
        if (time <= 0) {
            clearInterval(timerInterval);
            gameOver("Time's up!");
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer').style.display = 'none';
}

function restartGame() {
    score = 0;
    streak = 0;
    streakMultiplier = 1;
    document.getElementById('currentScore').textContent = score;
    document.getElementById('currentStreak').textContent = streak;
    document.getElementById('score').innerHTML = `Score: <span id="currentScore">0</span> | Streak: <span id="currentStreak">0</span>`;
    document.getElementById('result').textContent = ''; // Clear game over message
    document.getElementById('guessContainer').style.display = 'none'; // Hide guessing box
    document.getElementById('restart').style.display = 'none';
    document.getElementById('difficulty').style.display = 'block'; // Show difficulty selection
    document.getElementById('activeMode').style.display = 'none'; // Hide active mode
    gameState.gameStarted = false;
    const difficultyRadios = document.getElementsByName('difficulty');
    for (let radio of difficultyRadios) {
        radio.disabled = false; // Unlock difficulty selection
    }
    document.querySelector('button[onclick="startGame()"]').style.display = 'inline-block';
    document.getElementById('headline').textContent = "Select difficulty and start guessing!";
    updateGuessOptions();
}

function endGameForDev() {
    gameOver("Development ended game.");
}

document.getElementById('currentScore').textContent = score;
document.getElementById('currentStreak').textContent = streak;
updateGuessOptions(); // Initialize dropdown options based on default difficulty

// Add event listeners to difficulty radios to update dropdown options
const difficultyRadios = document.getElementsByName('difficulty');
difficultyRadios.forEach(radio => {
    radio.addEventListener('change', updateGuessOptions);
});