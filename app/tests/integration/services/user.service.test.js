'use strict';

var assert = require('assert'),
    async = require('async'),
    should = require('should'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    chalk = require('chalk'),
    config = require('../../../../config/config'),
    User = require('../../../models/user'),
    PendingUser = require('../../../models/pendingUser'),
    Company = require('../../../models/company'),
    userService = require('../../../services/user.service')({
        sendConfirmationMessage: function(user, continuation) {
            continuation(null, {});
        },
        sendWelcomeMessage: function(user, continuation) {
            continuation(null, {});
        }
    }),
    companyService = require('../../../services/company.service')();

describe('UserService', function() {
    var db,
        nearsoftCompanyConfig = {
           name: 'Nearsoft',
            domain: '@nearsoft.com' 
        },
        newUserBasicConfig = {
            email: 'rgutierrez@nearsoft.com'
        };

    before(function(done) {
        db = mongoose.connect(config.db.uri, config.db.options, function(err) {
            if (err) {
                console.error(chalk.red('Could not connect to MongoDB!'));
                console.log(chalk.red(err));
            }
            done(err);
        });
    });

    after(function(done) {
        if (db) {
            async.parallel([
                function(cb) {
                    User.remove({}, cb);
                },
                function(cb) {
                    PendingUser.remove({}, cb);
                },
                function(cb) {
                    Company.remove({}, cb);
                }
            ], function() {
                db.disconnect();
                done();
            });
        } else {
            done();
        }
    });

    function assertAppValidationErrorWithMessage(message, err) {
        err.message.should.be.equal(message);
        err.type.should.be.equal('App.Error.Validation');
    }

    describe('#requestNewUser', function() {
        it('without new user settings should fail', function(done) {
            userService.requestNewUser(null, function(err, newUser) {
                should.exist(err);
                assertAppValidationErrorWithMessage('New user configuration not provided.', err);
                done();
            });
        });

        it('without email should fail', function(done) {
            userService.requestNewUser({}, function(err, newUser) {
                should.exist(err);
                assertAppValidationErrorWithMessage('New user email is required.', err);
                done();
            });
        });

        it('for an unexisting domain should fail', function(done) {
            
            userService.requestNewUser(newUserBasicConfig, function(err, newUser) {
                should.exist(err);
                err.message.should.be.equal('There is no domain registered for @nearsoft.com.')
                done();
            });
        });

        describe('with a domain @nearsoft.com', function() {
            beforeEach(function(done) {
                companyService.createNewCompany(nearsoftCompanyConfig, function() {
                    done();
                });
            });

            afterEach(function(done) {
                async.parallel([
                    function(cb) {
                        companyService.deleteWithDomain(nearsoftCompanyConfig.domain, cb);
                    },
                    function(cb) {
                        PendingUser.remove({}, cb);
                    }
                ], function() {
                    done();
                });
            });

            it('with a valid user config should create a new pending user', function(done) {
                userService.requestNewUser(newUserBasicConfig, function(err, pendingUser) {
                    should.not.exist(err);
                    pendingUser.email.should.be.equal(newUserBasicConfig.email);
                    pendingUser.code.should.be.valid;
                    should(moment().diff(pendingUser.validUntil, 'seconds') <= 30).be.ok;
                    done();
                });
            });
        });
    });

    describe('#createUserUsingCode', function() {
        describe("when there is no pending user", function() {
            it('should fail', function(done) {
                var code = 'unexistingCode';
                userService.createUserUsingCode(code, null, function(err) {
                    should.exist(err);
                    err.message.should.be.equal('There is no pending user with code.');
                    done();
                });
            });
        });

        describe("when there is pending user", function() {
            beforeEach(function(done) {
                companyService.createNewCompany(nearsoftCompanyConfig, function(err1) {
                    if (err1) return done(err1);
                    userService.requestNewUser(newUserBasicConfig, function(err2, pendingUser) {
                        if (err2) return done(err2);
                        newUserBasicConfig.code = pendingUser.code;
                        done();
                    });
                });
            });

            afterEach(function(done) {
                var emailCondition = { email: newUserBasicConfig.email };
                async.parallel([
                    function(cb) {
                        PendingUser.remove(emailCondition, cb);
                    },
                    function(cb) {
                        User.remove(emailCondition, cb);
                    },
                    function(cb) {
                        companyService.deleteWithDomain(nearsoftCompanyConfig.domain, cb);
                    }
                ], function() {
                    done();
                });
            });

            it('and user config is correctly specified should succeed', function(done) {
                var password = 'P4$$w0rd';
                userService.createUserUsingCode(newUserBasicConfig.code, {
                    username: 'rgutierrez',
                    password: password,
                    firstName: 'Rafael',
                    lastName: 'Gutierrez'
                }, function(err, newUser) {
                    should.not.exist(err);    
                    should.exist(newUser);
                    // password should be different from plain password
                    newUser.password.should.not.be.equal(password);
                    should.exist(newUser.salt);
                    done();
                });
            })

            describe("and #validUntil is not valid", function() {
                beforeEach(function(done) {
                    PendingUser.update({
                        email: newUserBasicConfig.email
                    }, {
                        $set: { validUntil: moment().add(-4, 'days') }
                    }, function(err) {
                        if (err) throw err;
                        done();
                    });
                });

                it('should fail', function(done) {
                    userService.createUserUsingCode(newUserBasicConfig.code, {}, function(err) {
                        should.exist(err);
                        err.message.should.be.equal('There is no valid pending user with code.');
                        done();
                    });
                });
            });
        });
    });
});