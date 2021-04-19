let allCells = document.querySelectorAll(".cell:not(.row-top)");
let topCells = document.querySelectorAll(".cell.row-top")
let resetButton = document.querySelector(".reset");
let statusSpan = document.querySelector(".status");
let chatMessages = document.querySelector('.chat-messages');
let input = document.getElementById("gameCode");
let inRoom = false;
let gameLive = false;
let isMyTurn = true;
let cookis = extractCookies(document.cookie)
let myColor = cookis.color;
let opponentColor = "";
if (myColor == "yellow") {
    opponentColor = "red";
} else {
    opponentColor = "yellow";
    isMyTurn = false;
}
let room = "";

let socket = io();

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

function makeRoomCode(length) {
    let result = [];
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

$("#createRoom").click(function(event) {
    input.classList.add("hidden");
    let lengthOfCode = 5;
    room = makeRoomCode(lengthOfCode);
    socket.emit('createRoom', room);
    let codeHolder = document.getElementById("code");
    codeHolder.value = room;
    document.getElementById('form').submit();
}); 

$("#joinRoom").click(function(event) {
    $("#roomName").text("↓ Enter game code below ↓");
    input.classList.remove("hidden");
    $(input).on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            room = input.value;
            socket.emit('joinRoom', room);
            input.classList.add("hidden");
            $("#roomName").text("");
            let codeHolder = document.getElementById("code");
            codeHolder.value = room;
            document.getElementById('form').submit();
        }
    });
});     

$("#lev").click(function(event) {
    socket.emit('leftRoom', room);
    document.cookie = 'room=undefined';
    let codeHolder = document.getElementById("code");
    codeHolder.value = "undefined";
    document.getElementById('form').submit();
});     

function createMessage(name, time, text) {
    let div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${name} <span>${time}</span></p>
    <p class="text">
        ${text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('message', message => {
    createMessage(message.username, message.time, message.text);
});

socket.on('tooManyUsers', () => {
    createMessage("chat bot", '', "Can't connect to game since there are too many players in it!");
    $("#roomName").text("Can't connect to game!");
});

socket.on('live', status => {
    inRoom = status;
    createMessage("Chat Bot", "", "Press the \"Start Game\" button to play!");
});

socket.on('notInRoom', message => {
    createMessage("Warning!", "", "You are not in a chat room yet!");
});

$("#chat-form").submit(function(e) {
    e.preventDefault();
    let msg = e.target.elements.msg.value;
    socket.emit('chatMessage', msg);

    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

socket.on('room', ({r, n}) => {
    document.cookie = `room=${r}`;
    document.cookie = `username=${n}`;
});

socket.on('roomUsers', ({rm, users}) => {
    outputRoomName(rm);
    outputUsers(users);
});

function outputRoomName(rm) {
    let rmName = document.getElementById("room-name");
    rmName.innerHTML = rm;
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function outputUsers(users) {
    let userList = document.getElementById("users");
    removeAllChildNodes(userList);
    // userList.innerHTML = `${users.map(user => `<li>${user.username}<li>`).join()}`;
    for (let user of users) {
        let li = document.createElement('li');
        li.innerHTML = user.username;
        userList.appendChild(li);
    }
}

$(document).ready(function() {
    $(".navbar-burger").click(function() {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });
});

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

function getclassArray(cell) {
    let classList = cell.classList;
    return [...classList];
}

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

function getCell(row, col) {
    return rows[row][col];
}   

function clearColor(index) {
    let topCell = topCells[index];
    topCell.classList.remove("yellow");
    topCell.classList.remove("red");
}

function getColorofCell(cell) {
    let classList = getclassArray(cell);
    if (classList.includes("yellow")) return "yellow";
    if (classList.includes("red")) return "red";
    return null;
}

function checkWinningCells(cells) {
    if (cells.length <= 4) return false;

    gameLive = false;
    for (let cell of cells) {
        cell.classList.add("win");
    }
    
    statusSpan.textContent = `${isMyTurn ? myColor: opponentColor} has won!`;
    
    if(isMyTurn){
        socket.emit('connected', myColor);
        
    }  
    else{
        socket.emit('connected', opponentColor);
        
    } 
   
    
    return true;
}

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

    // check diagnoally (forwardslash)
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

    // check diagnoally (backslash)
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

function replayGame(moves) {
    $("#st").removeClass("startGame");
    $("#st").addClass("hidden");
    let x = 0;
    let row, col;
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
    let lastCell = getCell(row, col);
    let status = checkStatusGame(lastCell);
    if (status == true) {
        statusSpan.textContent = `${!isMyTurn ? myColor: opponentColor} has won!`;
        
    }
}

$(".cell").hover(function(eventIn) {
    if (!gameLive) return;
    if (!isMyTurn) return; 
    let cell = eventIn.target;
    let [row, col] = getCellLocation(cell);

    let topCell = topCells[col];
    topCell.classList.add(isMyTurn ? myColor: opponentColor);
}
,function(eventOut) {
    let cell = eventOut.target;
    let [row, col] = getCellLocation(cell);
    clearColor(col);
});    

$(".cell").click(function(event) {
    if (!gameLive) return;
    if (!inRoom) return;
    if (!isMyTurn) return; 

    let cell = event.target;
    let [row, col] = getCellLocation(cell);

    let openCell = getFirstOpenCell(col);
    
    if (!openCell) return;

    statusSpan.textContent = "Opponents turn.....";

    openCell.classList.add(isMyTurn ? myColor: opponentColor);
    checkStatusGame(openCell);

    isMyTurn = !isMyTurn;
    clearColor(col);

    socket.emit('move', col);
});    

$(".startGame").click(function(event) {
    if (!inRoom) return;
    let num = getRandomInt(0, 2);
    socket.emit('startGame', num);
});

socket.on('moveHistory', (moves) => {
    replayGame(moves);
});

socket.on('brodMove', (move) => {
    statusSpan.textContent = "";
    let opponentCellMove = getFirstOpenCell(move);
    opponentCellMove.classList.add(isMyTurn ? myColor: opponentColor);
    let status = checkStatusGame(opponentCellMove);
    if (status) {
        console.log();
    }
    isMyTurn = true;
});

socket.on('color', (c) => {
    myColor = c;
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
    console.log(myColor);
});



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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
}
