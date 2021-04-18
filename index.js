let express = require('express');
let session = require('express-session');
let socketio = require('socket.io');
//let session_handler = require('io-session-handler').from(socketio); 
const { v4: uuidv4 } = require('uuid');
let http = require('http');
let formatMessage = require('./public/scripts/utils/messages.js');
let { userJoin, getCurrentUser, userLeave, getRoomUsers, getCurrentUserbyName} = require('./public/scripts/utils/users.js');
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

function extractCookies(cookies) {
    cookies = cookies
                .split(';')
                .map(cookie => cookie.split('='))
                .reduce((accumulator, [key, value]) => 
                    ({...accumulator, [key.trim()]: decodeURIComponent(value)}),
                {});
    return cookies;
}

io.on('connection', socket => {
    let cookies = socket.handshake.headers.cookie;
    let dictCookies = extractCookies(cookies);
    if ("room" in dictCookies) {
        if (dictCookies.room !== "undefined") {
            socket.join(dictCookies.room);

            userJoin(socket.id, dictCookies.username, dictCookies.room);
    
            socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));
    
            socket.broadcast.to(dictCookies.room).emit('message', formatMessage(adminName, `${dictCookies.username} has joined the Game`));
            socket.emit('live', true);
    
            io.to(dictCookies.room).emit('roomUsers', {
                rm: dictCookies.room,
                users: getRoomUsers(dictCookies.room),
            }); 
        }
    }

    socket.on('createRoom', ({username, room}) => {
        let user = userJoin(socket.id, username, room);

        socket.emit('room', ({
            r: room,
            n: username,
        }));

        cookies = socket.handshake.headers.cookie;
        dictCookies = extractCookies(cookies);

        socket.join(user.room);

        socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));
        socket.emit('message', formatMessage(adminName, welcomeMessage));
        
        socket.broadcast.to(user.room).emit('message', formatMessage(adminName, `${username} has joined the Game`));

        io.to(user.room).emit('roomUsers', {
            rm: user.room,
            users: getRoomUsers(user.room),
        }); 
    });

    socket.on('joinRoom', ({username, room}) => {
        let user = userJoin(socket.id, username, room);

        socket.emit('room', ({
            r: room,
            n: username,
        }));

        socket.join(user.room);

        socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));

        socket.broadcast.to(user.room).emit('message', formatMessage(adminName, `${username} has joined the Game`));
        socket.broadcast.to(user.room).emit('live', true);
        socket.emit('live', true);

        io.to(user.room).emit('roomUsers', {
            rm: user.room,
            users: getRoomUsers(user.room),
        }); 
    });

    console.log("New Connection...", socket.id);

    socket.on('chatMessage', (msg) => {
        let user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('move', (move) => {
        let user = getCurrentUser(socket.id);
        console.log(move);
        io.to(user.room).emit('move', move);
    });

    socket.on('disconnect', () => {
        let user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(adminName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                rm: user.room,
                users: getRoomUsers(user.room),
            }); 
        }
    });
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
app.post('/processedLogin', function(request, response) {
    request.session.signedIn = true;
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var rightCombo = false;
    modelUsers.User.find({username: request.session.username}).then(function(playerInfo){
       for (var i = 0; i < playerInfo.length; i++){

           if ( request.body.username == playerInfo[i].username &&  request.body.password == playerInfo[i].password){
               rightCombo = true;           }
       }
       if (rightCombo == true){
        response.render("game", {
            pageTitle: "Connect 4!",
            resp: "Login Successful!",
        });
       }
       else{
        response.render("game", {
            pageTitle: "Connect 4!",
            resp: "Invalid Username or password!",
        });
       }        
    });   
});


//MAke a sign up and verify that the user name is not the same as another in the database
app.post('/processedSignUp',function(request, response) {
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var newAccount = false;
    var userGreaterThanFour = true;
    var passGreaterThanSix = true;

    response.cookie('username', "undefined");
    response.cookie('room', "undefined");
    response.cookie('signedIn', "true");

    let userData = {
        username: request.body.username,
        password: request.body.password,
    }

    

    console.log(userData);
    modelUsers.User.find({username: request.session.username}).then(function(playerInfo){
            if ( playerInfo.length == 0){
                newAccount = true;           
            }
            
            if (request.session.username.length < 4 ){
                userGreaterThanFour = false;
            }
            if (request.session.password.length < 6){
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
                    });
                }
            });
        }
        else{
            if(userGreaterThanFour == false && passGreaterThanSix == false){
                console.log('Error in input');
                response.render("sign-up", {
                pageTitle: "Connect 4!",
                resp: "Both username and password values are invalid",
                });
            }
            else if(userGreaterThanFour == false){
                console.log('Error in input');
                response.render("sign-up", {
                pageTitle: "Connect 4!",
                resp: "Username must be atleast 4 characters",
                });
            }

            else if(passGreaterThanSix == false){
                console.log('Error in input');
                response.render("sign-up", {
                pageTitle: "Connect 4!",
                resp: "Password must be atleast 6 characters",
                });
            }
            else{
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
    response.render("game", {
        pageTitle: "Connect 4!",
        resp: "Signed Out!",
        signedIn: false,
    });
});

