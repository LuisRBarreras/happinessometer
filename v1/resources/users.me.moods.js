'use strict';

const
    base = require('../lib/base'),
    validate = require('validate.js'),
    moodsEnum = require('../../app/models/mood_enum'),
    moodService = require('../../app/services/mood.service')();

module.exports = base.Resource.extend({
    needsToken: ['post'],

    post: function(req, res) {
        let errors = validate(req.body, { 
            mood: {
                presence: true
            },
            comment: {
                presence: true
            }
        });

        if (errors) {
            return this.dispatchValidationErrors("There are errors", errors);
        } else if (moodsEnum.indexOf(req.body.mood) < 0) {
            return this.dispatchValidationErrors("There are errors", {
                mood: ["Mood value is not valid"]
            });
        }

        moodService.setMood({
            user: req.user.id,
            company: req.user.company.id,
            mood: req.body.mood,
            comment: req.body.comment
        }, (err, newMood) => {
            if (err) {
                return this.handleError(err);
            }

            return this.response.json(newMood);
        });
    }
});