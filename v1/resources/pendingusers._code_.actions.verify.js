'use strict';

const
    base = require('../lib/base'),
    moment = require('moment'),
    validate = require('validate.js'),
    emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService);

module.exports = base.Resource.extend({
    post: function(req, res) {
        let code = req.params.code,
            errors = validate(req.body, {
            email: {
                presence: true,
                email: true,
            },
            firstName: {
                presence: true
            },
            lastName: {
                presence: true
            },
            username: {
                presence: true
            },
            password: {
                presence: true
            }
        });

        if (errors) {
            return this.dispatchValidationErrors("There are errors", errors);
        }

        userService.createUserUsingCode(code, req.body, (err, newUser) => {
            if (err) {
                return this.dispatchError(err);
            }

            return res.location('/users/' + newUser.email).status(201).send(null);
        });
    }
});