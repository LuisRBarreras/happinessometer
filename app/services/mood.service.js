'use strict';

const 
    _ = require('lodash'),
    moment = require('moment'),
    mongoose = require('mongoose');

const
    companyService = require('../services/company.service')(),
    errorsUtils = require('../utils/errors.utils'),
    logger = require('../utils/logger'),
    DateUtils = require('../utils/date.utils'),
    Mood = require('../models/mood');

const PER_PAGE = 30;

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

    findAll(companyId, params, callback) {
        let _page = 1,
            criteria = {
                company: companyId
            };

        if (params.page && params.page >= 2) {
            _page = params.page;
        }

        if (params.dateRange) {
            criteria.createdAt = DateUtils.createDateRangeCriteriaIfAny(params.dateRange);
        }

        Mood.find(criteria)
            .limit(PER_PAGE)
            .populate('company')
            .populate('user')
            .skip(PER_PAGE * (_page - 1))
            .sort({
                createdAt: 'desc'
            })
            .exec((err, moods) => {
                if (err) {
                    return errorsUtils.handleMongoDBError(err, callback);
                }
                Mood.count(criteria).exec((err, count) => {
                    if (err) {
                        return errorsUtils.handleMongoDBError(err, callback);
                    }
                    callback(err, moods, _.ceil(count / PER_PAGE), count);
                });
            });
    }
}

module.exports = () => {
    return new MoodService();
};
