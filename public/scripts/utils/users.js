/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file holds users info.
*/
let users = [];

/**
 * @param id - socket id of user
 * @param username - name of user
 * @param room - room user is in
 */
function userJoin(id, username, room) {
    let user = {id, username, room};

    users.push(user);

    return user;
}

function getUsers() {
    return users;
}

function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

function getInRoom(name, room) {
    return users.find(user => user.username === name && user.room === room);
}

function getCurrentUserbyName(id) {
    return users.find(user => user.id === id);
}

function userLeave(id) {
    let index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = {userJoin, getCurrentUser, userLeave, getRoomUsers, getCurrentUserbyName, getUsers, getInRoom};