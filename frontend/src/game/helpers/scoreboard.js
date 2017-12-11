
const scoreboard = {};

function getScore(address) {
    if(scoreboard[address] !== undefined) {
        return scoreboard[address];
    } else {
        scoreboard[address] = 0;
        return scoreboard[address];
    }
}

function setScore(address, amount) {
    scoreboard[address] = amount;
}

function updateScore(address, amount) {
    scoreboard[address] += amount;
}

function formatForDisplay() {
    let scores = [];

    for(const address of Object.keys(scoreboard)) {
        if (scoreboard[address]) {
            scores.push([address, scoreboard[address].toString()]);
        }
    }

    return scores;
}

function formatForContract() {
    let scores = [];

    for(const address of Object.keys(scoreboard)) {
        if (scoreboard[address]) {
            scores.push(scoreboard[address]);
        }
    }

    return scores;
}

function saveScore() {
    localStorage.setItem('score', scoreboard);
}

module.exports = {
    getScore,
    setScore,
    updateScore,
    formatForDisplay,
    formatForContract,
    saveScore,
}