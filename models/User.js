const mongoose = require('mongoose');
var User = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    date: {
        type: Date,
        default: Date.now()
    },
    password: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('User', User);