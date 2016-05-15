'use strict';

const
    base = require('../lib/base'),
    validate = require('validate.js'),
    moodsEnum = require('../../app/models/mood_enum'),
    moodService = require('../../app/services/mood.service')();

module.exports = base.Resource.extend({
    needsToken: ['post', 'get'],

    post: function() {
        let self = this,
            errors = validate(self.request.body, { 
            mood: {
                presence: true
            },
            comment: {
                presence: true
            }
        });

        if (errors) {
            return self.dispatchValidationErrors("There are errors", errors);
        } else if (moodsEnum.indexOf(self.request.body.mood) < 0) {
            return self.dispatchValidationErrors("There are errors", {
                mood: ["Mood value is not valid"]
            });
        }

        moodService.setMood({
            user: self.request.user.id,
            company: self.request.user.company.id,
            mood: self.request.body.mood,
            comment: self.request.body.comment
        }, (err, newMood) => {
            if (err) {
                return self.handleError(err);
            }

            return self.response.json(newMood);
        });
    },

    get: function () {
        let self = this,
            page = parseInt(self.request.query.page);

        moodService.findAll(self.request.user.company.id, { page: page ? page : 1 },
            (err, moods, totalPages, moodsCount) => {
            if (err) {
                return self.handleError(err);
            }

            return self.response.json({
                moods: moods,
                pagination: {
                    page: page,
                    totalPages: totalPages,
                    totalItems: moodsCount
                }
            });
        });
    }
});