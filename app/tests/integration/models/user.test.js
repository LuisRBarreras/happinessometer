'use strict';

var assert = require('assert'),
    async = require('async'),
    should = require('should'),
    mongoose = require('mongoose'),
    chalk = require('chalk'),
    moment = require('moment'),
    config = require('../../../../config/config'),
    Company = require('../../../models/company'),
    User = require('../../../models/user');

describe('User', function() {
    var db,
        company;

    before(function(done) {
        db = mongoose.connect(config.db.uri, config.db.options, function(err) {
            var newCompany;

            if (err) {
                console.error(chalk.red('Could not connect to MongoDB!'));
                console.log(chalk.red(err));
                done(err);
            } else {
                newCompany = new Company({
                    name: 'Company Inc',
                    domain: '@company.com'
                });
                newCompany.save(function(err, comp) {
                    if (err || !comp) {
                        done(err);
                    }
                    company = comp;
                    done();
                });
            }
        });
    });

    after(function(done) {
        if (db) {
            async.parallel([
                function(cb) {
                    User.remove({}, cb);
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

    it('#username is required', function(done) {
        var user = new User({
        });

        user.save(function(err) {
            should.exist(err.errors.username);
            err.errors.username.kind.should.be.equal('required');
            done();
        });
    });

    it('#password is required', function(done) {
        var user = new User({
        });

        user.save(function(err) {
            should.exist(err.errors.password);
            err.errors.password.kind.should.be.equal('required');
            done();
        });
    });

    it('#email is required', function(done) {
        var user = new User({
        });

        user.save(function(err) {
            should.exist(err.errors.email);
            err.errors.email.kind.should.be.equal('required');
            done();
        });
    });

    it('#save() should create a new disabled User', function(done) {
        var user = new User({
            username: 'rgutierrez',
            password: 'secret',
            email: 'rgutierrez@email.com',
            name: {
                first: 'Rafael', last: 'Gutierrez'
            },
            createdBy: 'rmartinez',
            company: company._id
        });

        user.save(function(err, newUser) {
            should.not.exist(err);
            newUser.username.should.be.equal(user.username);
            newUser.password.should.be.equal(user.password);
            newUser.email.should.be.equal(user.email);
            newUser.name.first.should.be.equal(user.name.first);
            newUser.name.last.should.be.equal(user.name.last);
            should.exist(newUser.id);
            should.exist(newUser.createdAt);
            newUser.enabled.should.be.false;
            done();
        });
    });
});