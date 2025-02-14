let currentHeadline = { text: "", date: "" };
let score = 0;
let gameState = { 
    difficulty: 'year', // 'year', 'month', or 'day'
    timeLimit: null 
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
        score++;
        document.getElementById('result').textContent = "Correct!";
    } else {
        document.getElementById('result').textContent = `Wrong! ${feedback}`;
    }
    document.getElementById('currentScore').textContent = score;
    document.getElementById('next').style.display = 'block';
    if (gameState.timeLimit) clearTimeout(gameState.timeLimit);
}

function newRound() {
    document.getElementById('guess').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('next').style.display = 'none';
    fetchHeadline();
    if (gameState.difficulty === 'day' || gameState.difficulty === 'month') {
        gameState.timeLimit = setTimeout(() => {
            document.getElementById('result').textContent = "Time's up!";
            document.getElementById('next').style.display = 'block';
        }, 30000); // 30 seconds
    }
}

function shareScore() {
    const shareText = `I scored ${score} in Extra! Extra! Guess the Date. Can you beat it?`;
    if (navigator.share) {
        navigator.share({
            title: 'Extra! Extra! Guess the Date',
            text: shareText,
            url: window.location.href
        }).then(() => console.log('Thanks for sharing!'))
          .catch((error) => console.log('Error sharing:', error));
    } else {
        alert('Please copy this link and share: ' + window.location.href);
    }
}

document.getElementById('next').style.display = 'none';
document.getElementById('currentScore').textContent = score;
newRound(); // Start the game by fetching the first headline