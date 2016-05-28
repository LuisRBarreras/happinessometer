'use strict';

const
    base = require('../lib/base'),
    validate = require('validate.js'),
    emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService),
    companyService = require('../../app/services/company.service')(emailService);

module.exports = base.Resource.extend({
    needsToken: [],

    post: function(req, res) {
        let errors = validate(req.body, {
            email: {
                presence: true,
                email: true
            }
        });

        if (errors) {
            return this.dispatchValidationErrors("There are errors", errors);
        }

        let user = {
            email: req.body.email
        }; 

        userService.requestNewUser(user, (err, newUser) => {
            if (err) {
                return this.handleError(err);
            }

            return res.location('/users/' + newUser.code).status(201).send(null);
        });
    }
})