/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file holds chats info.
*/
let chats = [];

/**
 * @param id - socket id for game
 * @param room - room for game
 * @param numMsg - number of messages in chat from game
 * @param messages - the content of the messages from chat
 */
function addChat(id, room, numMsg, messages) {
    let chat = {id, room, numMsg, messages};

    chats.push(chat);

    return chat;
}

function getchats() {
    return chats;
}

function getCurrentChat(room) {
    return chats.find(game => game.room === room);
}

module.exports = {addChat, getCurrentChat, getchats};