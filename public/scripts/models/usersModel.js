var mongoose = require('mongoose');

// setup mongodb database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Connect4', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function(error) {
    if (error) {
        console.error('Unable to connect: ', error);
    } else {
        console.log('Connected to MongoDB Connect4');
    }
});
mongoose.set('useCreateIndex', true);

// setup schema for database
let Schema = mongoose.Schema;
let usersSchema = new Schema({
    username: String,
    password: String,
    wins: Number,
    loses: Number,

}, {
    collection: 'users'
});
// export schema
module.exports.User = mongoose.model('Connect4', usersSchema);



