/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file holds games info.
*/
let games = [];

/**
 * @param moves - moves in game
 * @param room - room for game
 */
function addGame(moves, room) {
    let game = {moves, room};

    games.push(game);

    return game;
}

function getGames() {
    return games;
}
/**
 * @returns game in certain game room 
 */
function getCurrentGame(room) {
    return games.find(game => game.room === room);
}

module.exports = {addGame, getCurrentGame, getGames};