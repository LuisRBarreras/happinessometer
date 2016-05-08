'use strict';

const _ = require('lodash'),
    mongoose = require('mongoose'),
    Mood = require('../models/mood'),
    companyService = require('../services/company.service')(),
    errorsUtils = require('../utils/errors.utils');

class MoodService {
    constructor() {
    }

    setMood(moodConfig, callback) {
        if (!moodConfig ||  !moodConfig.mood || !moodConfig.comment || !moodConfig.company) {
            return errorsUtils.handleAppValidationError('No mood values provided', callback);
        }

        companyService.findById(moodConfig.company, (err, loadedCompany) => {
            if (err) {
                return callback(err);
            }

            if (!loadedCompany) {
                return errorsUtils.handleAppValidationError(
                    'No Company exists with that id', callback);
            }

            let newMoodSetting = {
                mood: moodConfig.mood.toLowerCase(),
                comment: moodConfig.comment,
                company: loadedCompany.id
            };

            if (moodConfig.user) {
                newMoodSetting.user = moodConfig.user;
            }

            // TODO rgutierrez - this should be valid under DEV env only
            if (moodConfig.createdAt) {
                newMoodSetting.createdAt = moodConfig.createdAt;
            }

            let newMood = Mood(newMoodSetting);

            newMood.save()
                .then(mood => {
                    Mood.findOne({ _id: mood.id })
                        .populate('company')
                        .populate('user')
                        .exec((err, loadedMood) => {
                            if (err) {
                                return errorsUtils.handleMongoDBError(err, callback);
                            }
                            callback(err, loadedMood);
                        });
                    }, err => {
                        return errorsUtils.handleMongoDBError(err, callback);
                    });
        });
    }

    findAllWithPage(companyId, page, callback) {
        var perPage = 30;

        Mood.find({ company: companyId })
            .limit(perPage)
            .populate('company')
            .populate('user')
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
    }

    findAllByCompanyWithPage(page, companyDomain, dateRange, callback) {
        var perPage = 30;

        companyService.findWithDomain(companyDomain, function(companyErr, company) {
            var criteria = { company: company._id };
            if (companyErr) {
                return errorsUtils.handleMongoDBError(companyErr, callback);
            }

            if (!company) {
                return errorsUtils.handleAppCommonError('No Company found with domain %s', companyDomain);
            }

            if (dateRange && dateRange.to && dateRange.from) {
                criteria.createdAt = {
                    '$gte': dateRange.from.startOf('day').utc().toDate(),
                    '$lt': dateRange.to.endOf('day').utc().toDate()
                }
            }

            Mood.find(criteria)
                .limit(perPage)
                .populate('company')
                .populate('user')
                .skip(perPage * (page - 1))
                .sort({
                    createdAt: 'desc'
                })
                .exec(function (err1, moods) {
                    if (err1) {
                        return errorsUtils.handleMongoDBError(err1, callback);
                    }
                    Mood.count(criteria).exec(function(err2, count) {
                        if (err2) {
                            return errorsUtils.handleMongoDBError(err2, callback);
                        }
                        callback(null, moods, _.ceil(count / perPage), count);
                    });
                });
        });
    }

    findAll(companyId, callback) {
        var perPage = 30;

        Mood.find({ company: companyId })
            .exec(function (err1, moods) {
                if (err1) {
                    return errorsUtils.handleMongoDBError(err1, callback);
                }
                callback(null, moods);
            });
    }

    quantityReport(companyId, callback) {
        // find all users in company
        // find all company moods in that period of time
        // build a json with moods per user
        // calculate average mood per user
        // calculate average mood per company (average mood in all users)

        Mood.aggregate([{
            $match: {
                company: mongoose.Types.ObjectId(companyId)
            }
        }, {
            $unwind: '$mood'
        },{
            $group: {
                _id: '$mood',
                mood: { $first: '$mood' },
                quantity: { $sum: 1 }
            }
        }]).exec(function(err2, result) {
            if (err2) {
                return errorsUtils.handleMongoDBError(err2, callback);
            }
            return callback(null, result);
        });
    }

    hashtagReport(callback) {
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
}

module.exports = () => {
    return new MoodService();
};
