'use strict';

const
    base = require('../lib/base'),
    companyService = require('../../app/services/company.service')();

module.exports = base.Resource.extend({
    get: function(req, res) {
        companyService.findWithDomain(req.params.domain, (err, company) => {
            if (err) {
                return this.dispatchInternalServerError(err);
            }

            if (!company) {
                return this.dispatchNotFoundError('No Company with domain ' + req.params.domain);
            }

            return res.json(company.toJSON());
        });
    }
});