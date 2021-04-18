let express = require('express');
let session = require('express-session');
const { v4: uuidv4 } = require('uuid');
let http = require('http');
let socketio = require('socket.io');
let formatMessage = require('./public/scripts/utils/messages.js');
let { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./public/scripts/utils/users.js');
const modelUsers = require('./public/scripts/models/usersModel.js');

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

io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        let user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(adminName, 'Welcome to Connect 4!'));

        socket.broadcast.to(user.room).emit('message', formatMessage(adminName, `${username} has joined the Game`));
    });

    console.log("New Connection...", socket.id);

    socket.on('chatMessage', (msg) => {
        let user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        let user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(adminName, `${user.username} has left the chat`));
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
app.post('/processLogin',function(request, response) {
    console.log(request.body);
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
app.post('/processSignUp',function(request, response) {
    request.session.username = request.body.username;
    request.session.password = request.body.password;
    var newAccount = false;
    var userGreaterThanFour = true;
    var passGreaterThanSix = true;

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
            //     console.log('Error in input');
            //     response.render("sign-up", {
            //     pageTitle: "Connect 4!",
            //     resp: "Username amsut be atelast 4 characters",
            // });
            }
            if (request.session.password.length < 6){
                passGreaterThanSix = false;
            //     console.log('Error in input');
            //     response.render("sign-up", {
            //     pageTitle: "Connect 4!",
            //     resp: "Password must be atlest 6 characters",
            // });
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
    request.session.password = '';
});

