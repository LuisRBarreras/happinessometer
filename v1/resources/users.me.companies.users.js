'use strict';

let base = require('../lib/base'),
    validate = require('validate.js'),
    emailService = require('../../app/services/email.service'),
    companyService = require('../../app/services/company.service')(emailService);

module.exports = base.Resource.extend({
    needsToken: ['get'],

    get: function(req, res) {
        companyService.findAllUsersInCompany(req.user.company.id, (err, users) => {
            if (err) {
                return this.handleError(err);
            }
            return res.json(users);
        })
    }
});