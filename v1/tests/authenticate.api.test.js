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
    PendingUser = require('../../app/models/pendingUser');

describe("/v1/authenticate", function() {
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

    describe('Creating a new active user', function () {
        var jsonUser, postRes;

        before(function (done) {
            superagent.post(baseUrl + '/admin/companies')
                .send({ name: 'Email Inc.', domain: '@email.com' })
                .set('Accept', 'application/json')
                .end(function(err, res) {
                    if (err) {
                        return done(err);
                    }
                    superagent.post(baseUrl + '/users')
                        .send({ email: 'someone@email.com' })
                        .set('Accept', 'application/json')
                        .end(function(err1, res2) {
                            if (err1) {
                                return done(err1);
                            }
                            PendingUser.findOne({ email: 'someone@email.com' }, 'code email', function (err, pendingUser) {
                                superagent.post(baseUrl + '/users/verify')
                                    .query({ code: pendingUser.code })
                                    .send({
                                        code: pendingUser.code,
                                        email: 'someone@email.com',
                                        firstName: 'Some',
                                        lastName: 'One',
                                        username: 'someone',
                                        password: 'someone123'
                                    })
                                    .set('Accept', 'application/json')
                                    .end(function(err2, res2) {
                                        if (err2) {
                                            return done(err2);
                                        }
                                        postRes = res2;
                                        done();
                                    });
                            });
                        });
                });
        });

        it('should succeed', function () {
            postRes.status.should.be.equal(status.CREATED);
            postRes.headers.location.should.be.equal('/users/someone@email.com');
        });

        describe('And loggin in', function () {
            var jsonToken, logginRes;

            before(function (done) {
                superagent.post(baseUrl + '/authenticate')
                    .send({ email: 'someone@email.com', password: 'someone123' })
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        if (err) {
                            return done(err);
                        }
                        logginRes = res;
                        jsonToken = JSON.parse(res.text);
                        done();
                    });
            });

            it('should succeed', function () {
                logginRes.status.should.be.equal(status.OK);
            });

            it('should contain the token', function () {
                jsonToken.message.should.be.equal('Enjoy your token!');
                jsonToken.token.should.be.ok;
            });

            it('GET-ing users info should succeed', function (done) {
                superagent.get(baseUrl + '/users/me')
                    .set('Authorization', 'Token ' + jsonToken.token)
                    .set('x', 'application/json')
                    .end(function(err, res) {
                        should.not.exist(err);
                        var jsonUser = JSON.parse(res.text);
                        jsonUser.email.should.be.equal('someone@email.com');
                        jsonUser.firstName.should.be.equal('Some');
                        jsonUser.lastName.should.be.equal('One');
                        jsonUser.company.name.should.be.equal('Email Inc.');
                        done();
                    });
            })
        });
    });
});