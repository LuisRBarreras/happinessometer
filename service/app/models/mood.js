'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = mongoose.model('Mood',  new Schema({
    mood: {
        type: Number,
        min: 1,
        max: 3,
        required: true
    },
    comment: {
        type: String,
        maxlength: 140,
        required: true
    },
    // TODO createdAt should be UTC
    createdAt: {
        type: Date,
        default: Date.now
    }
}));