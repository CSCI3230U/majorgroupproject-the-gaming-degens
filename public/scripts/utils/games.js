
let games = [];

function addGame(moves, room) {
    let game = {moves, room};

    games.push(game);

    return game;
}

function getGames() {
    return games;
}

function getCurrentGame(room) {
    return games.find(game => game.room === room);
}

module.exports = {addGame, getCurrentGame, getGames};