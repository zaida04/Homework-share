const mongoose = require('mongoose');
var Note = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    creator: {
        type: mongoose.ObjectId,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    image: {
        type: Buffer,
        required: false
    }
});

module.exports = mongoose.model('Note', Note);