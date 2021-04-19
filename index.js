let express = require('express');
let session = require('express-session');
let socketio = require('socket.io');
const { v4: uuidv4 } = require('uuid');
let http = require('http');
let formatMessage = require('./public/scripts/utils/messages.js');
let {userJoin, getCurrentUser, userLeave, getRoomUsers, getCurrentUserbyName, getUsers, getInRoom} = require('./public/scripts/utils/users.js');
let {addPlayer, getCurrentPlayer, getRoomPlayers, playerLeave} = require('./public/scripts/utils/players.js');
let {addGame, getCurrentGame, getGames} = require('./public/scripts/utils/games.js');
const modelUsers = require('./public/scripts/models/usersModel.js');
const { Cookie } = require('express-session');

let app = express();
let server = http.createServer(app);
let io = socketio(server);

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(express.static('public'));

app.set('port', process.env.PORT || 3000); 
server.listen(app.get('port'), function() {
    console.log(`Listening for requests on port ${app.get('port')}`);
});

let adminName = "Chat Bot";
let welcomeMessage = "The room code above is used to connect to a game. Send it to your opponent.";
let roomSize = 2;
let players = getUsers();

function extractCookies(cookies) {
    if (cookies == undefined) return false;
    cookies = cookies
                .split(';')
                .map(cookie => cookie.split('='))
                .reduce((accumulator, [key, value]) => 
                    ({...accumulator, [key.trim()]: decodeURIComponent(value)}),
                {});
    return cookies;
}

io.on('connection', socket => {
    let pushUsers = false;
    let cookies = socket.handshake.headers.cookie;
    let dictCookies = extractCookies(cookies);
    console.log("new connection... " + socket.id);
    if (getRoomUsers(dictCookies.room).length < roomSize && dictCookies) {
        if ("room" in dictCookies && "username" in dictCookies) {
            if (dictCookies.room !== "undefined" && dictCookies.signedIn == "true") {
                if (!getInRoom(dictCookies.username, dictCookies.room)) { 
                    userJoin(socket.id, dictCookies.username, dictCookies.room);
                    addPlayer(socket, null, dictCookies.room);
                }
                let game = getCurrentGame(dictCookies.room);
                if (game) {
                    socket.emit('moveHistory' , game.moves);
                }
    
                socket.emit('rejoin', ({
                    r: dictCookies.room, 
                    n: dictCookies.username,
                }));
    
                socket.join(dictCookies.room);
        
                socket.emit('message', formatMessage(adminName, 'Welcome back to Connect 4!'));
        
                socket.broadcast.to(dictCookies.room).emit('message', formatMessage(adminName, `${dictCookies.username} has joined the Game`));
                if (getRoomUsers(dictCookies.room).length > 1) {
                    io.to(dictCookies.room).emit('live', true);
                }
        
                io.to(dictCookies.room).emit('roomUsers', {
                    rm: dictCookies.room,
                    users: getRoomUsers(dictCookies.room),
                }); 
                pushUsers = true;
            }
        }
    } else {
        socket.emit('tooManyUsers');
    }

    socket.on('startGame', (num) => {
        let user = getCurrentPlayer(socket);
        let users = getRoomPlayers(user.room);
        
        addGame([], user.room);

        if (num == 0) {
            users[0].socket.emit('color', "yellow");
            players[0].color = 'yellow';
            users[1].socket.emit('color', "red");
            players[1].color = 'red';
        } else {
            users[0].socket.emit('color', "red");
            players[0].color = 'red';
            users[1].socket.emit('color', "yellow");
            players[1].color = 'yellow';
        }
    });

    //Send to database
    socket.once('connected', (color) =>{
        var winningPlayer;
        var losingPlayer;
        if (players[0].color == color){
            winningPlayer = players[0].username;
            losingPlayer = players[1].username;
        }
        if(players[1].color == color){
            winningPlayer = players[1].username;
            losingPlayer = players[0].username;
        }
      //  Increase winner
        modelUsers.User.find({username: winningPlayer}).then(function(winner){
            var addwin = 0
            addwin = winner[0].wins + 1;
            let playerData = {
                username: winner[0].username,
                password: winner[0].password,
                wins: addwin,
                loses: winner[0].loses
            }
            
            modelUsers.User.updateOne(
                {username: winningPlayer}, 
                playerData, 
                function(error, numAffected) {
                    if (error || numAffected != 1) {
                        console.error('Unable to update student:', error);
                        
                    } 
                }
                );
            
        });

        //Increase lose
        modelUsers.User.find({username: losingPlayer}).then(function(loser){
            var addloss = 0
            addloss = loser[0].loses + 1;
            let loserData = {
                username: loser[0].username,
                password: loser[0].password,
                wins: loser[0].wins,
                loses: addloss,
            }
            
            modelUsers.User.updateOne(
                {username: losingPlayer}, 
                loserData, 
                function(error, numAffected) {
                    if (error || numAffected != 1) {
                        console.error('Unable to update student:', error);
                        
                    } 
                }
                );
            
        });
        

    });

    socket.on('createRoom', (room) => {
        if (getRoomUsers(room).length > roomSize-1) {
            socket.emit('tooManyUsers');
            return;
        }    
        cookies = socket.handshake.headers.cookie;
        dictCookies = extractCookies(cookies);
        if (!dictCookies) return;
        let user = userJoin(socket.id, dictCookies.username, room);
        addPlayer(socket, null, room);

        socket.emit('room', ({
            r: room,
            n: dictCookies.username,
        }));

        socket.join(user.room);

        socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));
        socket.emit('message', formatMessage(adminName, welcomeMessage));
        
        socket.broadcast.to(user.room).emit('message', formatMessage(adminName, `${dictCookies.username} has joined the Game`));

        if (!pushUsers) {
            io.to(user.room).emit('roomUsers', {
                rm: user.room,
                users: getRoomUsers(user.room),
            }); 
        }
    });

    socket.on('joinRoom', (room) => {
        if (getRoomUsers(room).length > roomSize-1) {
            socket.emit('tooManyUsers');
            return;
        }
        cookies = socket.handshake.headers.cookie;
        dictCookies = extractCookies(cookies);
        if (!dictCookies) return;
        let user = userJoin(socket.id, dictCookies.username, room);
        addPlayer(socket, null, room);

        socket.emit('room', ({
            r: room,
            n: dictCookies.username,
        }));

        socket.join(user.room);

        socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));

        socket.broadcast.to(user.room).emit('message', formatMessage(adminName, `${dictCookies.username} has joined the Game`));
        if (getRoomUsers(user.room).length > 1) {
            io.to(user.room).emit('live', true);
        }
        if (!pushUsers) {
            io.to(user.room).emit('roomUsers', {
                rm: user.room,
                users: getRoomUsers(user.room),
            }); 
        } 
    });

    socket.on('chatMessage', (msg) => {
        let user = getCurrentUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        } else {
            socket.emit('notInRoom');
        }
    });

    socket.on('move', (move) => {
        let user = getCurrentUser(socket.id);
        socket.broadcast.to(user.room).emit('brodMove', move);
        let game = getCurrentGame(user.room);
        game.moves.push(move);
    });

    socket.on('reset', () => {
        let user = getCurrentUser(socket.id);
        let game = getCurrentGame(user.room);
        game.moves = [];
        socket.broadcast.to(user.room).emit('resetCall');
    });

    socket.on('disconnect', () => {
        let user = userLeave(socket.id);
        playerLeave(socket);
        cookies = socket.handshake.headers.cookie;
        dictCookies = extractCookies(cookies);
        if (!dictCookies) return;
        if (user) {
            io.to(user.room).emit('message', formatMessage(adminName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                rm: user.room,
                users: getRoomUsers(user.room),
            }); 
        }
        io.to(dictCookies.room).emit('live', false);
    });

    socket.on('leftRoom', () => {
        let user = userLeave(socket.id);
        playerLeave(socket);

        if (user) {
            socket.leave(user.room);
            io.to(user.room).emit('message', formatMessage(adminName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                rm: user.room,
                users: getRoomUsers(user.room),
            }); 
        }
        io.to(user.room).emit('live', false);
    });

    console.log(getUsers());
});

app.use(express.urlencoded({extended: false}));
app.use(session({
    genid: () => uuidv4(),
    resave: false,
    saveUninitialized: false,
    secret: 'passphrase',
}));

app.get('/', function(request, response) {
    response.render("game", {
        pageTitle: "Connect 4!",
    });
});

app.get('/gameRoom', function(request, response) {
    response.cookie('room', request.query.code);
    response.render("game", {
        pageTitle: "Connect 4!",
        resp: "Game Code: " + request.query.code,
        signedIn: true,
    });
});


app.get('/home', function(request, response) {
    let dictCookies = extractCookies(request.headers.cookie);
    if (dictCookies.signedIn == 'true') {
        response.render("game", {
            pageTitle: "Connect 4!",
            signedIn: true,
        });
    } else {
        response.render("game", {
            pageTitle: "Connect 4!",
            signedIn: false,
        });
    }
});

app.get('/sign-up', function(request, response) {
    response.render("sign-up", {
        pageTitle: "Sign Up Page",
    });
});

app.get('/login', function(request, response) {
    response.render("login", {
        pageTitle: "Login Page",
    });
});

//Process logining
app.post('/processLogin', function(request, response) {
    request.session.signedIn = true;
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var rightCombo = false;

    response.cookie('username', request.body.username);
    response.cookie('signedIn', "true");

    modelUsers.User.find({username: request.session.username}).then(function(playerInfo) {
       for (var i = 0; i < playerInfo.length; i++){
           if (request.body.username == playerInfo[i].username &&  request.body.password == playerInfo[i].password) {
               rightCombo = true;           
            }
       }
       if (rightCombo == true) {
            response.render("game", {
                pageTitle: "Connect 4!",
                resp: "Login Successful!",
                signedIn: true,
            });
       }
       else {
            response.render("login", {
                pageTitle: "Connect 4!",
                resp: "Invalid Username or password!",
                signedIn: true,
            });
       }        
    });   
});


//MAke a sign up and verify that the user name is not the same as another in the database
app.post('/processSignUp',function(request, response) {
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var newAccount = false;
    var userGreaterThanFour = true;
    var passGreaterThanSix = true;

    response.cookie('username', request.body.username);
    response.cookie('room', "undefined");
    response.cookie('signedIn', "true");

    let userData = {
        username: request.body.username,
        password: request.body.password,
        wins: 0,
        loses: 0,
    }
    
    modelUsers.User.find({username: request.session.username}).then(function(playerInfo) {
            if (playerInfo.length == 0){
                newAccount = true;           
            }
            
            if (request.session.username.length < 4 ) {
                userGreaterThanFour = false;
            }
            if (request.session.password.length < 6) {
                passGreaterThanSix = false;
            }
                
            if (newAccount == true && userGreaterThanFour == true && passGreaterThanSix == true){
            
            let newUser = new modelUsers.User(userData);
            newUser.save(function(error) {
                if (error) {
                    console.error('Unable to add User:', error);
                } else {
                    console.log('User added');
                    response.render("game", {
                        pageTitle: "Connect 4!",
                        resp: "Sign-up Successful!",
                        signedIn: true,
                    });
                }
            });
        }
        else {
            if (userGreaterThanFour == false && passGreaterThanSix == false) {
                console.log('Error in input');
                response.render("sign-up", {
                    pageTitle: "Connect 4!",
                    resp: "Both username and password values are invalid",
                });
            }
            else if (userGreaterThanFour == false) {
                console.log('Error in input');
                response.render("sign-up", {
                    pageTitle: "Connect 4!",
                    resp: "Username must be atleast 4 characters",
                });
            }

            else if (passGreaterThanSix == false) {
                console.log('Error in input');
                response.render("sign-up", {
                    pageTitle: "Connect 4!",
                    resp: "Password must be atleast 6 characters",
                });
            }
            else {
                console.log('Error in input');
                response.render("sign-up", {
                    pageTitle: "Connect 4!",
                    resp: "Username already exists!",
                });
            }
        }       
     });
});

app.get('/logout', function(request, response) {
    request.session.username = '';
    request.session.passsword = '';

    response.cookie('signedIn', "false");
    response.cookie('username', "undefined");
    response.cookie('room', "undefined");
    response.render("game", {
        pageTitle: "Connect 4!",
        resp: "Signed Out!",
        signedIn: false,
    });
});

