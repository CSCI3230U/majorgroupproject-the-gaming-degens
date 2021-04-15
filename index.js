const express = require('express');
let app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.set('port', process.env.PORT || 3000); 

app.listen(app.get('port'), function() {
    console.log(`Listening for requests on port ${app.get('port')}`);
});

