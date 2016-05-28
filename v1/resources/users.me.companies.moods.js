'use strict';

const
    base = require('../lib/base'),
    validate = require('validate.js'),
    moodsEnum = require('../../app/models/mood_enum'),
    moodService = require('../../app/services/mood.service')();

module.exports = base.Resource.extend({
    needsToken: ['get'],

    get: function (req, res) {
        let pageParam = parseInt(req.query.page),
            page = pageParam ? pageParam : 1;

        moodService.findAll(req.user.company.id, { page: page },
            (err, moods, totalPages, moodsCount) => {
            if (err) {
                return this.handleError(err);
            }

            return res.json({
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