let express = require('express');
let session = require('express-session');
const { v4: uuidv4 } = require('uuid');
let app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(express.static('public'));
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
    request.session.password = request.body.passsword;
    response.send('Login Successful');
});

app.get('/logout', function(request, response) {
    request.session.username = '';
    request.session.passsword = '';
});

app.set('port', process.env.PORT || 3000); 

app.listen(app.get('port'), function() {
    console.log(`Listening for requests on port ${app.get('port')}`);
});

