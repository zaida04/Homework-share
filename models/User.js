const mongoose = require('mongoose');
var User = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    name: {
        type: String,
        required: false
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
    },
    admin: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model('User', User);