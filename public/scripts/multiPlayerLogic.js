/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file holds the connect 4 game logic when playing multiplayer.
*/
let allCells = document.querySelectorAll(".cell:not(.row-top)");
let topCells = document.querySelectorAll(".cell.row-top")
let resetButton = document.querySelector(".reset");
let statusSpan = document.querySelector(".status");
let chatMessages = document.querySelector('.chat-messages');
let input = document.getElementById("gameCode");
let inRoom = false;     // opponent is in room
let gameLive = false;   // toggle game state
let isMyTurn = true;    // is it my turn ?
let cookis = extractCookies(document.cookie)    // extract cookies to get my color after reconnection
let myColor = cookis.color;
let opponentColor = "";
// set color and turn after reconnection
if (myColor == "yellow") {
    opponentColor = "red";
} else {
    opponentColor = "yellow";
    isMyTurn = false;
}
let room = "";

let socket = io();

/**
 * Extracts cookies from web browser
 * @returns dictionary of cookies
 */
function extractCookies(cookies) {
    if (!cookies) return;
    cookies = cookies
                .split(';')
                .map(cookie => cookie.split('='))
                .reduce((accumulator, [key, value]) => 
                    ({...accumulator, [key.trim()]: decodeURIComponent(value)}),
                {});
    return cookies;
}

/**
 * Create random code for game room
 * @returns game code
 */
function makeRoomCode(length) {
    let result = [];
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

/**
 * Sends game code to server when the create room 
 * dropdown item is pressed
 */
$("#createRoom").click(function(event) {
    input.classList.add("hidden");
    let lengthOfCode = 5;
    room = makeRoomCode(lengthOfCode);
    // let server know user is creating room
    socket.emit('createRoom', room);
    // submits hidden form containing game code
    let codeHolder = document.getElementById("code");
    codeHolder.value = room;
    document.getElementById('form').submit();
}); 

/**
 * Get's user input (game code) and sends it to server 
 * when the join room dropdown item is pressed
 */
$("#joinRoom").click(function(event) {
    $("#roomName").text("↓ Enter game code below ↓");
    input.classList.remove("hidden");
    $(input).on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            room = input.value;
            // let server know user is joining room
            socket.emit('joinRoom', room);
            input.classList.add("hidden");
            $("#roomName").text("");
            let codeHolder = document.getElementById("code");
            codeHolder.value = room;
            document.getElementById('form').submit();
        }
    });
});     


/**
 * When leave room button is clicked, leave the room
 */
$("#lev").click(function(event) {
    // let server know user is leaving room
    socket.emit('leftRoom', room);
    // set current room cookie to undefined 
    document.cookie = 'room=undefined';
    // submit new room value
    let codeHolder = document.getElementById("code");
    codeHolder.value = "undefined";
    document.getElementById('form').submit();
});     

/**
 * Create the messages for chat
 * @param name - username
 * @param time - timestamp of message
 * @param text - content of message
 */
function createMessage(name, time, text) {
    // Create div and append p tag to it with content
    let div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${name} <span>${time}</span></p>
    <p class="text">
        ${text}
    </p>`;
    // append div to chat
    document.querySelector('.chat-messages').appendChild(div);
    // scroll the chat down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    // only add messages from users to chat history
    if (name !== "Chat Bot") {
        socket.emit('addMessage', {text, time, name});
    }
}

/**
 * Recieve messages from server and create message
 */
socket.on('message', message => {
    createMessage(message.username, message.time, message.text);
});

/**
 * Recieve info from server that there are too many users in room 
 * when trying to join
 */
socket.on('tooManyUsers', () => {
    createMessage("chat bot", '', "Can't connect to game since there are too many players in it!");
    $("#roomName").text("Can't connect to game!");
});

socket.on('live', status => {
    inRoom = status;
    // createMessage("Chat Bot", "", "Press the \"Start Game\" button to play!");
});

/**
 * Let user know if they are not in room yet 
 */
socket.on('notInRoom', message => {
    createMessage("Warning!", "", "You are not in a chat room yet!");
});

/**
 * Send message from user to server
 */
$("#chat-form").submit(function(e) {
    e.preventDefault();
    let msg = e.target.elements.msg.value;
    socket.emit('chatMessage', msg);

    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

/**
 * Set room and username cookies
 * @param r - room
 * @param n - username
 */
socket.on('room', ({r, n}) => {
    document.cookie = `room=${r}`;
    document.cookie = `username=${n}`;
});

/**
 * Set the "Users" interface on chat up and the "Room Name"
 * @param rm - room
 * @param users - users in room
 */
socket.on('roomUsers', ({rm, users}) => {
    outputRoomName(rm);
    outputUsers(users);
});

/**
 * Setup room name on chat interface
 */
function outputRoomName(rm) {
    let rmName = document.getElementById("room-name");
    rmName.innerHTML = rm;
}

/**
 * Removes all children from a parent element
 */
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

/**
 * Setup "Users" interface in chat interface
 */
function outputUsers(users) {
    let userList = document.getElementById("users");
    removeAllChildNodes(userList);
    for (let user of users) {
        let li = document.createElement('li');
        li.innerHTML = user.username;
        userList.appendChild(li);
    }
}

/**
 * Setup burger menu
 */
$(document).ready(function() {
    $(".navbar-burger").click(function() {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });
});

// declerations of all cells in the connect 4 game for easy indexing
let column0 = [allCells[35], allCells[28], allCells[21], allCells[14], allCells[7], allCells[0], topCells[0]];
let column1 = [allCells[36], allCells[29], allCells[22], allCells[15], allCells[8], allCells[1], topCells[1]];
let column2 = [allCells[37], allCells[30], allCells[23], allCells[16], allCells[9], allCells[2], topCells[2]];
let column3 = [allCells[38], allCells[31], allCells[24], allCells[17], allCells[10], allCells[3], topCells[3]];
let column4 = [allCells[39], allCells[32], allCells[25], allCells[18], allCells[11], allCells[4], topCells[4]];
let column5 = [allCells[40], allCells[33], allCells[26], allCells[19], allCells[12], allCells[5], topCells[5]];
let column6 = [allCells[41], allCells[34], allCells[27], allCells[20], allCells[13], allCells[6], topCells[6]];
let columns = [column0, column1, column2, column3, column4, column5, column6];

let topRow = [topCells[0], topCells[1], topCells[2], topCells[3], topCells[4], topCells[5], topCells[6]];
let row0 = [allCells[0], allCells[1], allCells[2], allCells[3], allCells[4], allCells[5], allCells[6]];
let row1 = [allCells[7], allCells[8], allCells[9], allCells[10], allCells[11], allCells[12], allCells[13]];
let row2 = [allCells[14], allCells[15], allCells[16], allCells[17], allCells[18], allCells[19], allCells[20]];
let row3 = [allCells[21], allCells[22], allCells[23], allCells[24], allCells[25], allCells[26], allCells[27]];
let row4 = [allCells[28], allCells[29], allCells[30], allCells[31], allCells[32], allCells[33], allCells[34]];
let row5 = [allCells[35], allCells[36], allCells[37], allCells[38], allCells[39], allCells[40], allCells[41]];
let rows = [row0, row1, row2, row3, row4, row5, topRow];

/**
 * get class list of cell
 */
function getclassArray(cell) {
    let classList = cell.classList;
    return [...classList];
}
/**
 * Get the cell location 
 * @returns row and column of the cell provided
 */
function getCellLocation(cell) {
    let classArr = getclassArray(cell);

    let rowClass = classArr.find(className => className.includes("row"));
    let colClass = classArr.find(className => className.includes("col"));
    
    let row = rowClass[4];
    let col = colClass[4];

    row = parseInt(row);
    col = parseInt(col);

    return [row, col]
}
/**
 * Get first open cell in the connect 4 grid
 */
function getFirstOpenCell(index) {
    let column = columns[index];
    let slicedColumn = column.slice(0, 6);

    for (let cell of slicedColumn) {
        let classArr = getclassArray(cell);
        if (!classArr.includes("yellow") && !classArr.includes("red")) {
            return cell;
        }
    }
    return null;
}
/**
 * @returns the cell at a certain row and column
 */
function getCell(row, col) {
    return rows[row][col];
}   
/**
 * Clears the color of the top cells (the cells that show when hovering the board)
 */
function clearColor(index) {
    let topCell = topCells[index];
    topCell.classList.remove("yellow");
    topCell.classList.remove("red");
}
/**
 * @returns the cell color
 */
function getColorofCell(cell) {
    let classList = getclassArray(cell);
    if (classList.includes("yellow")) return "yellow";
    if (classList.includes("red")) return "red";
    return null;
}
/**
 * Check if player who placed chip won 
 * @param cells - consecutive cells
 */
function checkWinningCells(cells) {
    // if the array of consecutive cells is less than 4 return
    if (cells.length <= 4) return false;

    gameLive = false;
    for (let cell of cells) {
        cell.classList.add("win");
    }
    // output who has won to user
    statusSpan.textContent = `${isMyTurn ? myColor: opponentColor} has won!`;

    return true;
}
/**
 * Reset game board
 */
function resetGameBoard() {
    for (let row of rows) {
        for (let cell of row) {
            cell.classList.remove("red");
            cell.classList.remove("yellow");
            cell.classList.remove("win");
        }
    }
    statusSpan.textContent = "";
}

/**
 * Check if anybody has won
 */
function checkStatusGame(cell) {
    let color = getColorofCell(cell);
    if (!color) return null;
    let [row, col] = getCellLocation(cell);

    // check horizontally
    let winningCells = [];
    let checkRow = row;
    let checkCol = col;
    while (checkCol >= 0) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkCol--;
        } else {
            break;
        }
    }
    checkCol = col;
    while (checkCol <= 6) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkCol++;
        } else {
            break;
        }
    }

    let hasWon = checkWinningCells(winningCells);
    if (hasWon) return true;

    // check vertically
    winningCells = [];
    checkRow = row;
    checkCol = col;
    while (checkRow >= 0) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow--;
        } else {
            break;
        }
    }
    checkRow = row;
    while (checkRow <= 5) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow++;
        } else {
            break;
        }
    }

    hasWon = checkWinningCells(winningCells);
    if (hasWon) return true;

    // check diagonally (forwardslash)
    winningCells = [];
    checkRow = row;
    checkCol = col;
    while (checkCol >= 0 && checkRow <= 5) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow++;
            checkCol--;
        } else {
            break;
        }
    }
    checkRow = row;
    checkCol = col;
    while (checkCol <= 6 && checkRow >= 0) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow--;
            checkCol++;
        } else {
            break;
        }
    }

    hasWon = checkWinningCells(winningCells);
    if (hasWon) return true;

    // check diagonally (backslash)
    winningCells = [];
    checkRow = row;
    checkCol = col;
    while (checkCol >= 0 && checkRow >= 0) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow--;
            checkCol--;
        } else {
            break;
        }
    }
    checkRow = row;
    checkCol = col;
    while (checkCol <= 6 && checkRow <= 5) {
        let cellToCheck = rows[checkRow][checkCol];
        if (color === getColorofCell(cellToCheck)) {
            winningCells.push(cellToCheck);
            checkRow++;
            checkCol++;
        } else {
            break;
        }
    }

    hasWon = checkWinningCells(winningCells);
    if (hasWon) return true;

    // check if tie (very rare)
    let rowsWithoutTop = rows.slice(0, 6);
    for (let r of rowsWithoutTop) {
        for (let c of r) {
            let classList = getclassArray(c);
            if (!classList.includes("yellow") && !classList.includes("red")) {
                return;
            }
        }
    }

    gameLive = false;
    statusSpan.textContent = "Game is a tie!";
    return false;
}

/**
 * When user reconnects and game is currently in progress remake the board
 * @param moves - all previous executed in game
 */
function replayGame(moves) {
    // remove start game button
    $("#st").removeClass("startGame");
    $("#st").addClass("hidden");
    let x = 0;
    let row, col;
    // set correct class for each cell in each previous move
    for (let move of moves) {
        x++;
        let cell = getFirstOpenCell(move);
        cell.classList.add(isMyTurn ? myColor: opponentColor);
        isMyTurn = !isMyTurn;
        if (moves.length == x) {
            [row, col] = getCellLocation(cell);
        }
    }
    gameLive = true;
    // check if user reconnects on a finished game
    let lastCell = getCell(row, col);
    let status = checkStatusGame(lastCell);
    if (status == true) {
        statusSpan.textContent = `${!isMyTurn ? myColor: opponentColor} has won!`;
    }
}

/**
 * Show top cells over the currently hovered cell on game board
 */
$(".cell").hover(function(eventIn) {
    // if the game is not live or it's not my turn don't hover
    if (!gameLive) return;
    if (!isMyTurn) return; 
    let cell = eventIn.target;
    let [row, col] = getCellLocation(cell);

    let topCell = topCells[col];
    topCell.classList.add(isMyTurn ? myColor: opponentColor);
}
, function(eventOut) {
    let cell = eventOut.target;
    let [row, col] = getCellLocation(cell);
    clearColor(col);
});    

/**
 * Logic for when making a move in game (clicking a cell in grid)
 */
$(".cell").click(function(event) {
    if (!gameLive) return;
    // return if other user is not in room
    if (!inRoom) return;
    if (!isMyTurn) return; 
    // get move
    let cell = event.target;
    let [row, col] = getCellLocation(cell);

    let openCell = getFirstOpenCell(col);
    // return if there is no open spots in that column
    if (!openCell) return;
    
    statusSpan.textContent = "Opponents turn.....";
    // set cell user choose with correct class
    openCell.classList.add(isMyTurn ? myColor: opponentColor);
    // check if user has won
    checkStatusGame(openCell);
    // change turn
    isMyTurn = !isMyTurn;
    // clear topcells class
    clearColor(col);
    // send move to server
    socket.emit('move', col);
});    

/**
 * Start game when "start game" button is pressed
 * Random number is used to randomly decide which user gets what color
 */
$(".startGame").click(function(event) {
    if (!inRoom) return;
    // generate rand num (0 or 1)
    let num = getRandomInt(0, 2);
    // send color info
    socket.emit('startGame', num);
});
/**
 * Replay the game when user reconnects
 */
socket.on('moveHistory', (moves) => {
    replayGame(moves);
});
/**
 * When user reconnects recreate chat from the room they left
 */
socket.on('rejoin', (messages) => {
    for (let message of messages) {
        let div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `<p class="meta">${message.name} <span>${message.time}</span></p>
        <p class="text">
            ${message.text}
        </p>`;
        document.querySelector('.chat-messages').appendChild(div);

        console.log(message.text);
    
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
/**
 * Gets opponents moves from the server and adds them to game board
 */
socket.on('brodMove', (move) => {
    statusSpan.textContent = "";
    let opponentCellMove = getFirstOpenCell(move);
    opponentCellMove.classList.add(isMyTurn ? myColor: opponentColor);
    let status = checkStatusGame(opponentCellMove);
    if (status) {
        if (isMyTurn) {
            socket.emit('addGame', myColor);
        } 
        else{
            socket.emit('addGame', opponentColor);
        }  
    }
    isMyTurn = true;
});

/**
 * Initialization of game
 * @param c - user chip color for game
 */
socket.on('color', (c) => {
    // set user's color
    myColor = c;
    // set cookies to hold color and status of game
    document.cookie = `color=${c}`;
    document.cookie = `gameLive=true`;
    createMessage("Chat Bot", '', `The game has started you are ${myColor}`);
    if (c == "yellow") {
        opponentColor = "red";
        isMyTurn = true;
    } else {
        opponentColor = "yellow";
        isMyTurn = false;
        statusSpan.textContent = "Opponents turn.....";
    }
    gameLive = true;
    $("#st").removeClass("startGame");
    $("#st").addClass("hidden");
});
/**
 * When "reset" button is pressed reset board
 */
socket.on('resetCall', () => {
    $("#st").addClass("startGame");
    $("#st").removeClass("hidden");
    resetGameBoard();
});
$(".reset").click(function(event) {
    resetGameBoard();
    socket.emit('reset');
    $("#st").addClass("startGame");
    $("#st").removeClass("hidden");
});    
/**
 * @returns random integer between min and max
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
}
