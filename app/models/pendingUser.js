'use strict';

var mongoose = require('mongoose'),
    moment = require('moment'),
    config = require('../../config/config'),
    Schema = mongoose.Schema,
    pendingUserSchema;

/**
 * A Pending users represents a request to add a new user to the application.
 *
 * When a new request to add a user is created a 'code' is associated to the request
 * and this code is used by the validation link to activate the new user.
 *
 * A request to add a user into the app is valid until 'validUntil' date.
 */
pendingUserSchema = new Schema({
    company: {
        type: Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    email: {
        type: String,
        lowercase: true, 
        required: true,
        unique: true
    },
    validUntil: {
        type: Date,
        required: true,
        default: moment().add(config.app.pendingUser.validUntilDays, 'days').utc() 
    },
    code: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    toJSON: {
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
            delete ret.validUntil;
            delete ret.createdAt;
            return ret;
        }
    }
});

pendingUserSchema.methods.isValid = function(date) {
    return true;
};

module.exports = mongoose.model('PendingUser', pendingUserSchema);