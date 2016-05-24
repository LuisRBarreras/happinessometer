'use strict';

const
    base = require('../lib/base'),
    validate = require('validate.js'),
    moodsEnum = require('../../app/models/mood_enum'),
    moodService = require('../../app/services/mood.service')();

module.exports = base.Resource.extend({
    needsToken: ['get'],

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