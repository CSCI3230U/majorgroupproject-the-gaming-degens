/*
    Names: Andrew Murdoch, Andre Forbes and Adam Green
    Class: CSCI 3230U

    This file processes most of the functionality of this website
    This will include things such as acessing the databse, listening for certain events to trigger events such as 
    printing whos the winner and many more
*/
let express = require('express');
let session = require('express-session');
let socketio = require('socket.io');
const d3 = require('d3');
const { v4: uuidv4 } = require('uuid');
let http = require('http');
let formatMessage = require('./public/scripts/utils/messages.js');
let {userJoin, getCurrentUser, userLeave, getRoomUsers, getCurrentUserbyName, getUsers, getInRoom} = require('./public/scripts/utils/users.js');
let {addPlayer, getCurrentPlayer, getRoomPlayers, playerLeave} = require('./public/scripts/utils/players.js');
let {addGame, getCurrentGame, getGames} = require('./public/scripts/utils/games.js');
let {addChat, getCurrentChat, getchats} = require('./public/scripts/utils/history.js');
const modelUsers = require('./public/scripts/models/usersModel.js');

let app = express();
let server = http.createServer(app);
let io = socketio(server);

/**
 * Access and initialize the views and the ports that 
 * will be used to reach the website
 */
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(express.static('public'));

app.set('port', process.env.PORT || 3000); 
server.listen(app.get('port'), function() {
    console.log(`Listening for requests on port ${app.get('port')}`);
});

/**
 * Initialize some global variables to reduce repition
 */
let adminName = "Chat Bot";
let welcomeMessage = "The room code above is used to connect to a game. Send it to your opponent.";
let roomSize = 2;
let chatHistSize = 12;
let players = getUsers(); //This will store the information of the players and be used alongside with the database

/**
 * Get the cookies of the connected users 
 * @param {*} cookies the cookies of the current session of the server
 * @returns the different connections for the players
 */
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

/**
 * Server side connection to handle all events that can happen on the page
 */
io.on('connection', socket => {
    let pushUsers = false;
    let cookies = socket.handshake.headers.cookie;
    let dictCookies = extractCookies(cookies);
    if (getRoomUsers(dictCookies.room).length < roomSize && dictCookies) {
        if ("room" in dictCookies && "username" in dictCookies) {
            if (dictCookies.room !== "undefined" && dictCookies.signedIn == "true") {
                if (!getInRoom(dictCookies.username, dictCookies.room)) { 
                    userJoin(socket.id, dictCookies.username, dictCookies.room);
                    console.log(getUsers());
                    addPlayer(socket, null, dictCookies.room);
                }
                let game = getCurrentGame(dictCookies.room);
                if (game) {
                    socket.emit('moveHistory' , game.moves);
                }

                let chat = getCurrentChat(dictCookies.room);
                if (chat) {
                    socket.emit('rejoin', chat.messages);
                }
    
                socket.join(dictCookies.room);
        
                socket.emit('message', formatMessage(adminName, 'Welcome back to Connect 4!'));
        
                socket.broadcast.to(dictCookies.room).emit('message', formatMessage(adminName, `${dictCookies.username} has rejoined the Game`));
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
    /**
     * Starts the game and assigns colours to each player
     */
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

    /**
     * This will be used to pass the final game information to the databse and update players
     */
    socket.on('addGame', (color) =>{
        var winningPlayer;
        var losingPlayer;
        if (players[0].color == color) {
            winningPlayer = players[0].username;
            losingPlayer = players[1].username;
        }
        if(players[1].color == color) {
            winningPlayer = players[1].username;
            losingPlayer = players[0].username;
        }
        /**
         * Incresae the win counter for designated player
         */
        modelUsers.User.find({username: winningPlayer}).then(function(winner) {
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
                        console.error('Unable to update player:', error);
                    } 
                });
        });
        /**
         * Increase the loss counter for the designated player
         */
        modelUsers.User.find({username: losingPlayer}).then(function(loser) {
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
                        console.error('Unable to update player:', error);
                    } 
                });
        });
    });
    /**
     * Intialize a room that will be able to store chat history of each player in the room
     * First test if room has too mnay players, return and alert user the room has 
     * too many players
     */

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
    /*
    * When a user atempts to enter a designated room, first test if there are too many users
    * if room is not full, update te chat room with list of the players and display message
    * someone has joined
    */
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
        /*
        * Lets the user know when a second player has joined the chat room
        */
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
    
    /*
    * Adds the passed through information from the messages and 
    *  pushes them to the chat box in the designated room    
    */
    socket.on('addMessage', ({text, time, name}) => {
        let user = getCurrentUser(socket.id);
        let chat = getCurrentChat(user.room);
        if (chat == undefined) {
            chat = addChat(socket.id, user.room, 0, []);
        }
        if (name == user.username) return;
        if (chat.numMsg <= chatHistSize) {
            chat.messages.push({text, time, name});
            chat.numMsg++;
        } else {
            chat.messages.push({text, time, name});
            chat.messages.shift();
        }
        console.log(chat.messages);
    });

    /*
    * Accepts the message that will be posted and passes it to the 
    * designated room with the username of who is sending the message
    */
    socket.on('chatMessage', (msg) => {
        let user = getCurrentUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        } else {
            socket.emit('notInRoom');
        }
    });
    /*
    * Adds current players move to the other player's screen
    */
    socket.on('move', (move) => {
        let user = getCurrentUser(socket.id);
        socket.broadcast.to(user.room).emit('brodMove', move);
        let game = getCurrentGame(user.room);
        game.moves.push(move);
    });
    /*
    * Called when the reset button is pressed so it can restart the game
    */
    socket.on('reset', () => {
        let user = getCurrentUser(socket.id);
        let game = getCurrentGame(user.room);
        game.moves = [];
        socket.broadcast.to(user.room).emit('resetCall');
    });
    /*
    * When another player disconnects, send a message to the chat room 
    * notifying that the player has disconnected
    */
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

    /*
    * Sends a message to the chat box that notifies the other
    *  user when a player has left the conversation
    */
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

    console.log("Users connected to server: ", getUsers());
});

/*
* Encodes the url so users are not able to see the background information 
*/
app.use(express.urlencoded({extended: false}));
app.use(session({
    genid: () => uuidv4(),
    resave: false,
    saveUninitialized: false,
    secret: 'passphrase',
}));

/*
* When connecting to localhost:3000 the game page will be present, this is similar to the '/home' tab
*/
app.get('/', function(request, response) {
    response.render("game", {
        pageTitle: "Connect 4!",
    });
});

/*
* Routes to a game room that corresponds with the designated game room code
*/
app.get('/gameRoom', function(request, response) {
    response.cookie('room', request.query.code);
    response.render("game", {
        pageTitle: "Connect 4!",
        resp: "Game Code: " + request.query.code,
        signedIn: true,
    });
});

/*
* Routes to the home page of the connect4 where users are able to naviagte to anywhere on the page
*/
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
/*
* Routes to the leaderboards tab
*/
app.get('/leaderboards', function(request, response) {
    let dictCookies = extractCookies(request.headers.cookie);
    if (dictCookies.signedIn == 'true') {
        response.render("leaderboards", {
            pageTitle: "Connect 4 Leaderboards",
            signedIn: true,
        });
    } else {
        response.render("leaderboards", {
            pageTitle: "Connect 4 Leaderboards",
            signedIn: false,
        });
    }
});

/*
* Routing to the sign-up tab
*/
app.get('/sign-up', function(request, response) {
    response.render("sign-up", {
        pageTitle: "Sign Up Page",
    });
});

/*
* Routing to the login tab
*/
app.get('/login', function(request, response) {
    response.render("login", {
        pageTitle: "Login Page",
    });
});

/*
* Creates chart for leaderboards (not done)
*/
app.post('/createChart', function(request, response) {

    var mockWins = {
        "Joey": 6.0,
        "Beth": 5.0,
        "Emma": 4.0,
        "Matt": 2.0,
        "Tyler": 0.0
    };

    var data = [], item;

    for (var username in mockWins) {
        item = {};
        item.username = username;
        item.wins = mockWins[username];
        data.push(item);
    }

    d3.selectAll("svg > *").remove();
    const colourScale = d3.scaleLinear()
                        .domain([0, 1])
                        .range(['Lavender', 'RoyalBlue']);
    
    var svg = d3.select("svg"),
    margin = 200,
    width = svg.attr("width") - margin,
    height = svg.attr("height") - margin;

    svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin * 0.5 - 20)
    .attr("font-size", "18px")
    .attr('text-anchor', 'middle')
    .text('Grade Distribution');

    var xScale = d3.scaleBand().range ([0, width]).padding(0.4),
        yScale = d3.scaleLinear().range ([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + 100 + "," + 100 + ")");

    xScale.domain(data.map(function(d) { return d.username; }));
    yScale.domain([0, d3.max(data, function(d) { return d.wins; })]);

    g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("y", height - margin - 50)
    .attr("x", width - margin)
    .attr("font-size", "20px")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .text("Player");

    g.append("g")
    .call(d3.axisLeft(yScale).tickFormat(function(d){
        return  d;
    }).ticks(10))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 50)
    .attr("x", - margin*0.5 + 20)
    .attr("dy", "-5.1em")
    .attr("font-size", "20px")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .text("Number of wins");

    g.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return xScale(d.username); })
    .attr("y", function(d) { return yScale(d.wins); })
    .attr("width", xScale.bandwidth())
    .attr("height", function(d) { return height - yScale(d.wins); })
    .attr("fill", (data) => colourScale(data.wins));


});


/*
* Create a login page that will check if the user exists
*  and starts a session with current user
*/
app.post('/processLogin', function(request, response) {
    request.session.signedIn = true;
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var rightCombo = false;

    response.cookie('username', request.body.username);
    response.cookie('signedIn', "true");

    /* Verify taht username is present in the database andprint corresponding result.  
    If username or password is incorrect, print out a general statement for security purposes
    */
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


/*
* Make a sign up and verify that the username is not the same as another in the database
*/
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
    /*
    * Search databse for the user to verify name is not present
    */
    modelUsers.User.find({username: request.session.username}).then(function(playerInfo) {
        /*
        First check if username is not present 
        Also verfify that both username and password meet requirement stated in the text box when signing up
        */
            if (playerInfo.length == 0){
                newAccount = true;           
            }
            
            if (request.session.username.length < 4 ) {
                userGreaterThanFour = false;
            }
            if (request.session.password.length < 6) {
                passGreaterThanSix = false;
            }
            // If all the test are passed, add the account to the database
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
            /*
            * Set up various error statements for the user to be presented with
            */
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

/*
* Log user out and return to main page with message alerting user they have successfully signed out 
*/
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

