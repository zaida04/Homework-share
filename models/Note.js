const mongoose = require('mongoose');
var Note = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    creator: {
        id: {
            type: mongoose.ObjectId,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: false
        },
        type: {
            type: String,
            required: false
        },
        showname: {
            type: Boolean,
            default: false
        }
    },
    date: {
        type: Date,
        default: Date.now()
    },
    image: {
        buf: {
            type: Buffer,
            required: true
        },
        mime: {
            type: String,
            required: true
        }
    },
    views: {
        type: Array,
        required: false
    }
});

module.exports = mongoose.model('Note', Note);