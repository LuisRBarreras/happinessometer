'use strict';

var _ = require('lodash'),
    Mood = require('../models/mood'),
    errorsUtils = require('../utils/errors.utils');

var MoodService = function() {
};

MoodService.prototype.setMood = function(moodConfig, callback) {
    if (!moodConfig ||  !moodConfig.mood || !moodConfig.comment || !moodConfig.from) {
        return errorsUtils.handleAppValidationError('No mood values provided.', callback);
    }

    var newMoodSetting = {
        mood: moodConfig.mood.toLowerCase(),
        comment: moodConfig.comment,
        from: moodConfig.from
    };
    
    if (moodConfig.user) {
        newMoodSetting.user = moodConfig.user
    }
    var newMood = Mood(newMoodSetting);

    newMood.save(function(err, mood) {
        if (err) {
            return errorsUtils.handleMongoDBError(err, callback);
        }
        callback(err, mood);
    });
};

// TODO this needs pagination or something
MoodService.prototype.findAllWithPage = function(page, callback) {
    var perPage = 30;

    Mood.find()
        .limit(perPage)
        .skip(perPage * (page - 1))
        .sort({
            createdAt: 'desc'
        })
        .exec(function (err1, moods) {
            if (err1) {
                return errorsUtils.handleMongoDBError(err1, callback);
            }
            Mood.count().exec(function(err2, count) {
                if (err2) {
                    return errorsUtils.handleMongoDBError(err2, callback);
                }
                callback(null, moods, _.ceil(count / perPage), count);
            });
        });
};

MoodService.prototype.findAll = function(callback) {
    var perPage = 30;

    Mood.find()
        .exec(function (err1, moods) {
            if (err1) {
                return errorsUtils.handleMongoDBError(err1, callback);
            }
            callback(null, moods);
        });
};

MoodService.prototype.quantityReport = function(callback) {
    this.findAll(function(err1, moods) {
        if (err1) {
            return callback(err1);
        }

        Mood.aggregate({
            $group: {
                _id: '$mood',
                mood: { $first: '$mood' },
                quantity: { $sum: 1 }
            }
        }).exec(function(err2, result) {
            if (err2) {
                return errorsUtils.handleMongoDBError(err2, callback);
            }
            return callback(null, result);
        });
    });
};

MoodService.prototype.hashtagReport = function(callback) {
    this.findAll(function(err, moods) {
        // TODO handle error

        callback(null, {
            hashtags: [{
                hashtag: '#yolo',
                quantity: 1000,
                moods: [{
                    mood: 'happy',
                    quantity: 500
                },{
                    mood: 'sad',
                    quantity: 300
                },{
                    mood: 'normal',
                    quantity: 200
                }]
            },{
                hashtag: '#freedomhackday',
                quantity: 500,
                moods: [{
                    mood: 'happy',
                    quantity: 300
                },{
                    mood: 'sad',
                    quantity: 100
                },{
                    mood: 'normal',
                    quantity: 100
                }]
            },{
                hashtag: '#java',
                quantity: 1340,
                moods: [{
                    mood: 'happy',
                    quantity: 340
                },{
                    mood: 'sad',
                    quantity: 500
                },{
                    mood: 'normal',
                    quantity: 500
                }]
            },{
                hashtag: '#java',
                quantity: 1340,
                moods: [{
                    mood: 'happy',
                    quantity: 340
                },{
                    mood: 'sad',
                    quantity: 500
                },{
                    mood: 'normal',
                    quantity: 500
                }]
            }]
        });
    });
}

module.exports = function() {
    return new MoodService();
};
