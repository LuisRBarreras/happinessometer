'use strict';

const
    base = require('../lib/base'),
    emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService);

module.exports = base.Resource.extend({
    get: function(req, res) {
        let json;

        userService.findPendingUserOrUserByEmail(req.params.email, (err, user) => {
            if (err) {
                return this.handleError(err);
            }

            if (!user) {
               return this.dispatchNotFoundError('No user found with email ' + req.params.email); 
            }

            json = {
                status: user.status,
                email: user.email
            };
            if (user.status === 'user') {
                json.firstName = user.name.first;
                json.lastName = user.name.last;
                json.username = user.username;
            }
            return res.json(json);
        });
    }
});