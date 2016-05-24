'use strict';

const
    base = require('../lib/base'),
    companyService = require('../../app/services/company.service')();

module.exports = base.Resource.extend({
    post: function(req, res) {
        companyService.createNewCompany({
            name: req.body.name,
            domain: req.body.domain
        }, (err, company) => {
            if (err) {
                return this.dispatchInternalServerError(err);
            }
            return this.dispatchSuccessfulResourceCreation(company.domain);
        });
    }
});