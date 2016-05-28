'use strict';

var base = require('../lib/base'),
    validate = require('validate.js'),
    emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService),
    companyService = require('../../app/services/company.service')(emailService);

module.exports = base.Resource.extend({

    get: function(req, res) {
        let domain = req.domain;

        companyService.findAllUsersInCompany(domain, (err, users) => {
            if (err) {
                return that.handleError(err);
            }
            return that.response.json(users);
        })
    }
});