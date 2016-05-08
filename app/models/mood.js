'use strict';

var mongoose = require('mongoose'),
    moodEnum = require('./mood_enum'),
    Schema = mongoose.Schema;

module.exports = mongoose.model('Mood',  new Schema({
    company: {
        type: Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: false
    },
    mood: {
        type: String,
        enum: moodEnum,
        required: true
    },
    comment: {
        type: String,
        maxlength: 140,
        required: true
    },
    from: {
        type: String,
        enum: ['web', 'android', 'ios', 'slack'],
        required: true,
        default: 'web'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            'use strict';
            
            let user = ret.user,
                company = ret.company;
            delete ret.user;
            delete ret._id;
            delete ret.__v;
            delete ret.id;

            ret.company = company.name;
            ret.user = user.email;
            return ret;
        }
    }
}));