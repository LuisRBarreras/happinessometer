'use strict';

const
    base = require('../lib/base'),
    moment = require('moment'),
    validate = require('validate.js'),
    emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService);

module.exports = base.Resource.extend({
    get: function(req, res) {
        let code = req.params.code,
            errors = validate({ code: code }, {
            code: {
                presence: true
            }
        });

        if (errors) {
            return this.dispatchValidationErrors("There are errors", errors);
        }

        userService.findPendingUserByCode(code, (err, user) => {
            if (err) {
                return this.handleError(err);
            }

            if (!user) {
               return this.dispatchNotFoundError('Code not found.'); 
            }

            if (!user.isValid(moment())) {
                return this.dispatchBadRequestError('Code is not valid.');
            }

            return res.json(user.toJSON());
        });
    }
});