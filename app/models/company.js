'use strict';

var mongoose = require('mongoose'),
    moment = require('moment'),
    Schema = mongoose.Schema;

module.exports = mongoose.model('Company', new Schema({
    name: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        lowercase: true,
        required: true,
        unique : true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
            delete ret.createdAt;
            delete ret.id;
            return ret;
        }
    }
}));