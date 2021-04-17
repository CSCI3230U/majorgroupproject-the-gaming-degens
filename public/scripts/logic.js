const allCells = document.querySelectorAll(".cell:not(.row-top)");
const topCells = document.querySelectorAll(".cell.row-top")
const resetButton = document.querySelector(".reset");
const statusSpan = document.querySelector(".status");

$(document).ready(function() {
    $(".navbar-burger").click(function() {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });
});

const column0 = [allCells[35], allCells[28], allCells[21], allCells[14], allCells[7], allCells[0], topCells[0]];
const column1 = [allCells[36], allCells[29], allCells[22], allCells[15], allCells[8], allCells[1], topCells[1]];
const column2 = [allCells[37], allCells[30], allCells[23], allCells[16], allCells[9], allCells[2], topCells[2]];
const column3 = [allCells[38], allCells[31], allCells[24], allCells[17], allCells[10], allCells[3], topCells[3]];
const column4 = [allCells[39], allCells[32], allCells[25], allCells[18], allCells[11], allCells[4], topCells[4]];
const column5 = [allCells[40], allCells[33], allCells[26], allCells[19], allCells[12], allCells[5], topCells[5]];
const column6 = [allCells[41], allCells[34], allCells[27], allCells[20], allCells[13], allCells[6], topCells[6]];
const columns = [column0, column1, column2, column3, column4, column5, column6];

const topRow = [topCells[0], topCells[1], topCells[2], topCells[3], topCells[4], topCells[5], topCells[6]];
const row0 = [allCells[0], allCells[1], allCells[2], allCells[3], allCells[4], allCells[5], allCells[6]];
const row1 = [allCells[7], allCells[8], allCells[9], allCells[10], allCells[11], allCells[12], allCells[13]];
const row2 = [allCells[14], allCells[15], allCells[16], allCells[17], allCells[18], allCells[19], allCells[20]];
const row3 = [allCells[21], allCells[22], allCells[23], allCells[24], allCells[25], allCells[26], allCells[27]];
const row4 = [allCells[28], allCells[29], allCells[30], allCells[31], allCells[32], allCells[33], allCells[34]];
const row5 = [allCells[35], allCells[36], allCells[37], allCells[38], allCells[39], allCells[40], allCells[41]];
const rows = [row0, row1, row2, row3, row4, row5, topRow];

let gameLive = true;
let yellowIsNext = true;

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
    console.log(cells.length);
    if (cells.length <= 4) return false;

    gameLive = false;
    for (let cell of cells) {
        cell.classList.add("win");
    }
    statusSpan.textContent = `${yellowIsNext ? "Yellow": "Red"} has won!`;
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
    gameLive = true;
    yellowIsNext = true;
    statusSpan.textContent = "";
}

// function checkStatusGame(cell) {
//     let color = getColorofCell(cell);
//     if (!color) return;
//     let [row, col] = getCellLocation(cell);

//     // check horizontally
//     let winningCells = [cell];
//     let checkRow = row;
//     let checkCol = col - 1;
//     while (checkCol >= 0) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkCol--;
//         } else {
//             break;
//         }
//     }
//     checkCol = col + 1;
//     console.log(checkRow, checkCol);
//     while (checkCol <= 6) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkCol++;
//         } else {
//             break;
//         }
//     }

//     let hasWon = checkWinningCells(winningCells);
//     if (hasWon) return;

//     // check vertically
//     winningCells = [cell];
//     checkRow = row - 1;
//     checkCol = col;
//     while (checkRow >= 0) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow--;
//         } else {
//             break;
//         }
//     }
//     checkRow = row + 1;
//     while (checkRow <= 5) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow++;
//         } else {
//             break;
//         }
//     }

//     hasWon = checkWinningCells(winningCells);
//     if (hasWon) return;

//     // check diagnoally (forwardslash)
//     winningCells = [cell];
//     checkRow = row + 1;
//     checkCol = col - 1;
//     while (checkCol >= 0 && checkRow <= 5) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow++;
//             checkCol--;
//         } else {
//             break;
//         }
//     }
//     checkRow = row - 1;
//     checkCol = col + 1;
//     while (checkCol <= 6 && checkRow >= 0) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow--;
//             checkCol++;
//         } else {
//             break;
//         }
//     }

//     hasWon = checkWinningCells(winningCells);
//     if (hasWon) return;

//     // check diagnoally (backslash)
//     winningCells = [cell];
//     checkRow = row - 1;
//     checkCol = col - 1;
//     while (checkCol >= 0 && checkRow >= 0) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow--;
//             checkCol--;
//         } else {
//             break;
//         }
//     }
//     checkRow = row + 1;
//     checkCol = col + 1;
//     while (checkCol <= 6 && checkRow <= 5) {
//         let cellToCheck = rows[checkRow][checkCol];
//         if (color === getColorofCell(cellToCheck)) {
//             winningCells.push(cellToCheck);
//             checkRow++;
//             checkCol++;
//         } else {
//             break;
//         }
//     }

//     hasWon = checkWinningCells(winningCells);
//     if (hasWon) return;

//     // let rowsWithoutTop = rows.slice();
//     // for (let row of rows) {
//     //     for (let cell of row) {
            
//     //     }
//     // }
// }

function checkStatusGame(cell) {
    let color = getColorofCell(cell);
    if (!color) return;
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
    if (hasWon) return;

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
    if (hasWon) return;

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
    if (hasWon) return;

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
    if (hasWon) return;

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
}

$(".cell").hover(function(eventIn) {
    if (!gameLive) return;
    let cell = eventIn.target;
    let [row, col] = getCellLocation(cell);

    let topCell = topCells[col];
    topCell.classList.add(yellowIsNext ? "yellow": "red");
}
,function(eventOut) {
    let cell = eventOut.target;
    let [row, col] = getCellLocation(cell);
    clearColor(col);
});    

$(".cell").click(function(event) {
    if (!gameLive) return;

    let cell = event.target;
    let [row, col] = getCellLocation(cell);

    let openCell = getFirstOpenCell(col);
    
    if (!openCell) return;

    openCell.classList.add(yellowIsNext ? "yellow": "red");
    checkStatusGame(openCell);

    yellowIsNext = !yellowIsNext;
    clearColor(col);

    if (gameLive) {
        let topCell = topCells[col];
        topCell.classList.add(yellowIsNext ? "yellow": "red");
    }
});    