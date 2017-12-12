
let scoreboard = [];

function init(_scoreboard) {
    scoreboard = _scoreboard;

    scoreboard.forEach(player => {
        player.score = 0;
    });

    console.log(scoreboard);
}

function getScore(address) {
    return _getByAddress(address).score;
}

function setScore(address, amount) {
    const user = _getByAddress(address);
    user.score = amount;
}

function updateScore(address, amount) {
    const user = _getByAddress(address);
    user.score += amount;
}

function saveScore() {
    localStorage.setItem('score', JSON.stringify(scoreboard));
}


function _getByAddress(address) {
    return scoreboard.find(s => s.address === address);
}

module.exports = {
    init,
    getScore,
    setScore,
    updateScore,
    saveScore,
}