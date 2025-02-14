let currentHeadline = { text: "", date: "" };
let score = 0;
let streak = 0;
let streakMultiplier = 1;
let gameState = { 
    difficulty: 'decade' // 'decade', 'year', 'month', or 'day'
};
let timerInterval;
let timeLimit = 30; // seconds

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
                document.getElementById('headline').textContent = currentHeadline.text;
                updateGuessOptions();
            } else {
                document.getElementById('headline').textContent = "No headlines available. Refreshing...";
                setTimeout(fetchHeadline, 3000); // Try again after 3 seconds
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('headline').textContent = "Error loading headline. Please try again.";
            setTimeout(fetchHeadline, 5000); // Retry after 5 seconds
        });
}

function updateGuessOptions() {
    const select = document.getElementById('guess');
    select.innerHTML = ''; // Clear previous options

    switch(gameState.difficulty) {
        case 'decade':
            for (let i = 1700; i <= 2020; i += 10) {
                let option = document.createElement('option');
                option.value = i;
                option.text = `${i}s`;
                select.appendChild(option);
            }
            break;
        case 'year':
            for (let i = 1700; i <= 2023; i++) {
                let option = document.createElement('option');
                option.value = i;
                option.text = i;
                select.appendChild(option);
            }
            break;
        case 'month':
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            months.forEach((month, index) => {
                let option = document.createElement('option');
                option.value = index + 1; // Months are 1-indexed
                option.text = month;
                select.appendChild(option);
            });
            break;
        case 'day':
            const daysInMonth = new Date(currentHeadline.date.year, currentHeadline.date.month, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                let option = document.createElement('option');
                option.value = i;
                option.text = `${i}${getDaySuffix(i)}`;
                select.appendChild(option);
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

function checkGuess() {
    const guess = document.getElementById('guess').value;
    let correct = false;
    let feedback = "";

    const difficultyRadios = document.getElementsByName('difficulty');
    for (let radio of difficultyRadios) {
        if (radio.checked) {
            gameState.difficulty = radio.value;
            break;
        }
    }

    switch(gameState.difficulty) {
        case 'decade':
            correct = Math.floor(currentHeadline.date.year / 10) * 10 === parseInt(guess);
            feedback = `The decade was the ${Math.floor(currentHeadline.date.year / 10) * 10}s.`;
            break;
        case 'year':
            correct = currentHeadline.date.year === parseInt(guess);
            feedback = `The year was ${currentHeadline.date.year}.`;
            break;
        case 'month':
            correct = currentHeadline.date.month === parseInt(guess);
            feedback = `The month was ${new Date(1970, guess - 1, 1).toLocaleString('default', { month: 'long' })}.`;
            break;
        case 'day':
            correct = currentHeadline.date.day === parseInt(guess);
            feedback = `The day was ${currentHeadline.date.day}${getDaySuffix(currentHeadline.date.day)}.`;
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

    document.getElementById('guess').value = ''; // Reset selection
    fetchHeadline();
    if (gameState.difficulty !== 'decade' && gameState.difficulty !== 'year') {
        startTimer();
    } else {
        stopTimer();
    }
}

function gameOver(feedback) {
    document.getElementById('result').textContent = `Wrong! ${feedback} Game Over! Your final score: ${score}`;
    document.getElementById('guess').disabled = true;
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
    document.getElementById('guess').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('next').style.display = 'none';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('guess').disabled = false;
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
    document.getElementById('guess').disabled = false;
    document.getElementById('restart').style.display = 'none';
    newRound();
}

document.getElementById('currentScore').textContent = score;
document.getElementById('currentStreak').textContent = streak;
newRound(); // Start the game by fetching the first headline

// Load high score when page loads
window.onload = function() {
    const highScore = localStorage.getItem('highScore');
    if (highScore) {
        document.getElementById('score').innerHTML += `<br>High Score: ${highScore}`;
    }
};