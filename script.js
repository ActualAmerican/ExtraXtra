let currentHeadline = { text: "", date: "" };
let score = 0;
let streak = 0;
let streakMultiplier = 1;
let gameState = { 
    difficulty: 'year' // 'year', 'month', or 'day'
};

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
                        year: dateParts[0],
                        month: dateParts[1],
                        day: dateParts[2]
                    }
                };
                document.getElementById('headline').textContent = currentHeadline.text;
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

function checkGuess() {
    const guess = document.getElementById('guess').value;
    let correct = false;
    let feedback = "";

    switch(gameState.difficulty) {
        case 'year':
            correct = guess === currentHeadline.date.year;
            feedback = `The year was ${currentHeadline.date.year}.`;
            break;
        case 'month':
            correct = guess === currentHeadline.date.month;
            feedback = `The month was ${currentHeadline.date.month}.`;
            break;
        case 'day':
            correct = guess === currentHeadline.date.day;
            feedback = `The day was ${currentHeadline.date.day}.`;
            break;
    }

    if(correct) {
        streak++;
        streakMultiplier = 1 + (streak * 0.1); // Increases with each correct guess
        score += Math.round(streakMultiplier);
        document.getElementById('result').textContent = "Correct!";
        document.getElementById('currentScore').textContent = score;
        document.getElementById('currentStreak').textContent = streak;
    } else {
        gameOver(feedback);
        return;
    }

    document.getElementById('guess').value = '';
    fetchHeadline();
}

function gameOver(feedback) {
    document.getElementById('result').textContent = `Wrong! ${feedback} Game Over! Your final score: ${score}`;
    document.getElementById('guess').disabled = true;
    document.getElementById('next').style.display = 'none';
    document.getElementById('restart').style.display = 'inline-block';
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
    fetchHeadline();
}

function restartGame() {
    score = 0;
    streak = 0;
    streakMultiplier = 1;
    document.getElementById('currentScore').textContent = score;
    document.getElementById('currentStreak').textContent = streak;
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