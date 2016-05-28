'use strict';

const
    base = require('../lib/base');

module.exports = base.Resource.extend({
    needsToken: ['get'],

    get: function(req, res) {
        let user = req.user;

        if (!user) {
            return this.dispatchNotFoundError('No user found');
        }

        return res.json({
            username: user.username,
            email: user.email,
            firstName: user.name.first,
            lastName: user.name.last,
            company: {
                name: user.company.name,
                domain: user.company.domain
            }
        });
    }
});