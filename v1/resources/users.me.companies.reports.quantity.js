'use strict';

const
    base = require('../lib/base'),
    logger = require('../../app/utils/logger'),
    moodService = require('../../app/services/mood.service')(),
    quantityReport = require('../../app/services/quantityReport.service')();

module.exports = base.Resource.extend({
    needsToken: ['get'],

    get: function() {
        var self = this;

        quantityReport.run(self.request.user.company.id, {}, (err, results) => {
            if (err) {
                return self.dispatchError(err);
            }
            logger.debug(JSON.stringify(results));
            return self.response.json(results);
        });
    }
});