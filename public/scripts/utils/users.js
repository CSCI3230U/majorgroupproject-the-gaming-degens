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
/**
 * @returns user with socket id
 */
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}
/**
 * @returns if a user is in a certain room
 */
function getInRoom(name, room) {
    return users.find(user => user.username === name && user.room === room);
}
/**
 * Removes user from list of users
 */
function userLeave(id) {
    let index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}
/**
 * @returns users in a room
 */
function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = {userJoin, getCurrentUser, userLeave, getRoomUsers, getUsers, getInRoom};