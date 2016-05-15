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
    Mood = require('../models/mood'),
    User = require('../models/user'),
    moodEnum = require('../models/mood_enum');

class QuantityReportService {
    constructor() {
    }

    run(companyId, params, callback) {
        var self = this,
            options = {
            map: function () {
                emit(this.user, this.mood);
            },
            reduce: function (key, values) {
                return values.join(",");
            },
            finalize: function (key, reducedVal) {
                var obj = {}, res = reducedVal.split(",");
                for (var i = 0; i < res.length; ++i) {
                    obj[res[i].trim()] = (obj[res[i].trim()] || 0) + 1;
                }
                return obj;
            },
            query: {
                company: companyId,
                user: { $exists: true }
            },
            verbose: true
        };

        if (params && params.dateRange) {
            options.query.createdAt = DateUtils.createDateRangeCriteriaIfAny(params.dateRange);
        }

        Mood.mapReduce(options, (err, results) => {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            let moods = {};
            _(moodEnum).forEach((mood) => {
                moods[mood] = 0;
            });

            _(results).forEach((user) => {
                let maxMood = '', maxCount = 0;
                for (let moodAttr in user.value) {
                    if (user.value[moodAttr] > maxCount) {
                        maxCount = user.value[moodAttr];
                        maxMood = moodAttr;
                    }
                }

                moods[maxMood] = moods[maxMood] + 1;
            });


            User.count({
                company: companyId,
                enabled: true
            }).exec((err, count) => {
                if (err) {
                    return errorsUtils.handleMongoDBError(err, callback);
                }

                // add count of users without mood to normal mood
                moods.normal += (count - results.length);
                callback(err, {
                    totalUsers: count,
                    moods: this._toArrayOfMoods(moods)
                });
            });
        });
    }

    _toArrayOfMoods(moodsObject) {
        let array = [];
        for (let attr in moodsObject) {
            array.push({
                mood: attr,
                total: moodsObject[attr]
            });
        }
        return array;
    }
}

module.exports = () => {
    return new QuantityReportService();
};