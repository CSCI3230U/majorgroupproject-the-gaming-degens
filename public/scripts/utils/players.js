/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file holds player info.
*/
let users = [];

/**
 * @param socket - socket player uses
 * @param color - color of player
 * @param room - room player is in
 */
function addPlayer(socket, color, room) {
    let user = {socket, color, room};

    users.push(user);

    return user;
}

function getCurrentPlayer(socket) {
    return users.find(user => user.socket === socket);
}

function getRoomPlayers(room) {
    return users.filter(user => user.room === room);
}

function playerLeave(socket) {
    let index = users.findIndex(user => user.socket === socket);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

module.exports = {addPlayer, getRoomPlayers, getCurrentPlayer, playerLeave};