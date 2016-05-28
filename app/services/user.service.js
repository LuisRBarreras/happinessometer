'use strict';

var moment = require('moment'),
    chalk = require('chalk'),
    randomstring = require('randomstring'),
    PendingUser = require('../models/pendingUser'),
    Company = require('../models/company'),
    User = require('../models/user'),
    emailService = require('../services/email.service'),
    errorsUtils = require('../utils/errors.utils'),
    logger = require('../utils/logger');

var UserService = function(emailService) {
    this._emailService = emailService;
};

/**
 * Create a new request to create a user into the application
 *
 * @param {newUser}
 * @param {callback}
 */
UserService.prototype.requestNewUser = function(newUserSettings, callback) {
    var self = this,
        newPendingUser,
        emailDomain;

    if (!newUserSettings) {
        return errorsUtils.handleAppValidationError('New user configuration not provided.', callback);
    }

    if (newUserSettings && !newUserSettings.email) {
        return errorsUtils.handleAppValidationError('New user email is required.', callback);
    }

    emailDomain = newUserSettings.email.substring(newUserSettings.email.indexOf('@'));
    Company.findOne({ domain: emailDomain }, function(err, company) {
        if (err) {
            return errorsUtils.handleMongoDBError(err, callback);
        }

        if (!company) {
            return errorsUtils.handleAppValidationError(
                'There is no domain registered for ' + emailDomain + '.', callback);
        }

        PendingUser.findOne({ email: newUserSettings.email }, function(err, npu) {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            if (npu) {
                return errorsUtils.handleAppValidationError(
                    'There is a pending user with ' + newUserSettings.email + ' email', callback);
            }

            newPendingUser = new PendingUser({
                email: newUserSettings.email,
                code: randomstring.generate(35),
                company: company._id
            });

            newPendingUser.save(function(err, pendingUser) {
                if (err) {
                    return errorsUtils.handleMongoDBError(err, callback);
                }

                if (process.env["NODE_ENV"] === "production") {
                    // TODO rgutierrez send email as a domain event
                    self._emailService.sendConfirmationMessage(pendingUser, function(err) {
                        if (err) {
                            return errorsUtils.handleEmailError('Error sending the confirmation email.', callback);
                        }

                        callback(err, pendingUser);
                    });
                } else {
                    callback(err, pendingUser);
                }
            });
        });
    });
};

/**
 * Takes an {code} that was created when a new user was requested and creates a user 
 * into the application.
 *
 * @param {code} Code to create a user from a pending user entry
 * @param {callback}
 */
UserService.prototype.createUserUsingCode = function(code, userConfig, callback) {
    var self = this,
        user;

    PendingUser
        .findOne({ code: code })
        .populate('company')
        .exec(function (err, pendingUser) {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            if (!pendingUser) {
                return errorsUtils.handleAppValidationError('There is no pending user with code.', callback);
            }

            if (moment().diff(pendingUser.validUntil, 'days') > 3) {
                return errorsUtils.handleAppValidationError('There is no valid pending user with code.', callback);
            }

            user = new User({
                email: pendingUser.email,
                username: userConfig.username,
                password: userConfig.password,
                name: {
                    first: userConfig.firstName,
                    last: userConfig.lastName
                },
                enabled: true,
                company: pendingUser.company._id
            })

            user.save(function(err, userSaved) {
                if (err) {
                    return errorsUtils.handleMongoDBError(err, callback);
                }

                if (process.env["NODE_ENV"] === "production") {
                    self._emailService.sendWelcomeMessage(userSaved.email, function(err) {
                        if (err) {
                            return errorsUtils.handleEmailError('Error sending welcome email.', callback);
                        }
                        callback(err, userSaved);
                    });
                } else {
                    callback(err, userSaved);
                }
            });
        });
};

UserService.prototype.findPendingUserOrUserByEmail = function(email, callback) {
    User
        .findOne({ email: email })
        .populate('company')
        .exec(function(err, user) {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            if (user) {
                user.status = 'user';
                return callback(err, user);
            } else {
                PendingUser.findOne({ email: email }, function(err, user) {
                    if (err) {
                        return errorsUtils.handleMongoDBError(err, callback);
                    }

                    if (user) {
                        user.status = 'pending';
                    }
                    return callback(err, user);
                });
            }
        });
};

UserService.prototype.findUserByEmail = function(email, callback) {
    User
        .findOne({ email: email })
        .populate('company')
        .exec(function(err, user) {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            logger.debug('User company: ' + user.company);
            return callback(err, user);
        });
};

UserService.prototype.findPendingUserByCode = function(code, callback) {
    PendingUser
        .findOne({ code: code })
        .populate('company')
        .exec(function(err, pendingUser) {
            if (err) {
                return errorsUtils.handleMongoDBError(err, callback);
            }

            if (!pendingUser) {
                return errorsUtils.handleAppValidationError('There is no pending user with that code.', callback);
            }

            return callback(err, pendingUser);
        });
};

module.exports = function(emailService) {
    return new UserService(emailService);
};