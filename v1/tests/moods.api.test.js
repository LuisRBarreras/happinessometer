'use strict';

var async = require('async'),
    http = require('http'),
    mongoose = require('mongoose'),
    should = require('should'),
    status = require('http-status'),
    superagent = require('superagent');

var app = require('../../app'),
    config = require('../../config/config'),
    logger = require('../../app/utils/logger'),
    Company = require('../../app/models/company'),
    User = require('../../app/models/user'),
    PendingUser = require('../../app/models/pendingUser'),
    Mood = require('../../app/models/mood'),
    utils = require('./utils');

describe("/v1/moods", function() {
    var db,
        port = 3000,
        baseUrl = "http://localhost:" + port + "/v1",
        server;

    before(function (done) {
        app.set('port', port);
        server = http.createServer(app);
        server.listen(port);
        done();
    });

    after(function (done) {
        async.series([
            function (cb) {
                Mood.remove({}, cb);
            },
            function (cb) {
                PendingUser.remove({}, cb);
            },
            function (cb) {
                User.remove({}, cb);
            },
            function (cb) {
                Company.remove({}, cb);
            }
        ], function () {
            if (server) {
                server.close();
            }
            done();
        });
    });

    describe('With a Company Acme Inc.', function () {
        var companyData = {
            name: 'Acme Inc.',
            domain: '@acme.com'
        };

        before(function (done) {
            utils.createCompany(companyData, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });

        describe('With a new logged user', function () {
            var userData = {
                email: 'someone@acme.com',
                firstName: 'Some',
                lastName: 'One',
                username: 'someone',
                password: 'someone123'
            }, userToken;

            before(function (done) {
                utils.createUserAndLoginIn(userData, function (err, token) {
                    if (err) {
                        return done(err);
                    }
                    userToken = token;
                    done();
                });
            });

            it('create mood without Token should fail with Bad Request', function (done) {
                superagent.post(baseUrl + '/moods')
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        should.exist(err);
                        res.status.should.be.equal(status.BAD_REQUEST);
                        var result = JSON.parse(res.text);
                        result.status.should.be.equal(status.BAD_REQUEST);
                        result.message.should.be.equal('No token provided');
                        done();
                    });
            });

            it('create mood without data should fail with Bad Request', function (done) {
                superagent.post(baseUrl + '/moods')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userToken)
                    .end(function(err, res) {
                        should.exist(err);
                        res.status.should.be.equal(status.BAD_REQUEST);
                        var result = JSON.parse(res.text);
                        result.status.should.be.equal(status.BAD_REQUEST);
                        result.message.should.be.equal('There are errors');
                        done();
                    });
            });

            it('create mood should succeed with Ok', function (done) {
                superagent.post(baseUrl + '/moods')
                    .send({ mood: 'love', comment: 'love it! it is working!' })
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userToken)
                    .end(function(err, res) {
                        should.not.exist(err);
                        // TODO rgutierrez - what should answer this?
                        res.status.should.be.equal(status.OK);
                        logger.debug(res.text);
                        var result = JSON.parse(res.text);
                        result.mood.should.be.equal('love');
                        result.comment.should.be.equal('love it! it is working!');
                        result.user.should.be.equal('someone@acme.com');
                        should.not.exist(result.id);
                        should.not.exist(result._id);
                        should.not.exist(result.user.id);
                        should.not.exist(result.user._id);
                        should.not.exist(result.company.id);
                        should.not.exist(result.company._id);
                        done();
                    });
            });
        });
    });
});