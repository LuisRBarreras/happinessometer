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

describe("/v1/users", function() {
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

    it('POST-ing a new user without a Company with domain should fail', function (done) {
        superagent.post(baseUrl + '/users')
            .send({ email: 'someone@email.com' })
            .set('Accept', 'application/json')
            .end(function(err, res) {
                should.exist(err);
                done();
            });
    });

    describe('When Company Email Inc. exist', function () {
        before(function (done) {
            superagent.post(baseUrl + '/companies')
                .send({ name: 'Email Inc.', domain: '@email.com' })
                .set('Accept', 'application/json')
                .end(function(err, res) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        describe('POST-ing a new user with Email Inc.', function () {
            var postErr, postRes;

            before(function (done) {
                superagent.post(baseUrl + '/users')
                    .send({ email: 'someone@email.com' })
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        postErr = err;
                        postRes = res;
                        done();
                    });
            });

            it('should succeed', function () {
                should.not.exist(postErr);
                console.log("Res: " + JSON.stringify(postRes));
                postRes.status.should.be.equal(status.CREATED);
                postRes.header.location.should.be.equal('/users/someone@email.com');
                postRes.header["content-type"].should.containEql('application/json');
            });

            it('GET-ing user to verify with correct code should return the pending user', function (done) {
                PendingUser.findOne({ email: 'someone@email.com' }, 'code email', function (err, pendingUser) {
                    should.not.exist(err);

                    pendingUser.code.should.be.ok;
                    pendingUser.email.should.be.equal('someone@email.com');

                    superagent.get(baseUrl + '/users/verify')
                        .query({ code: pendingUser.code })
                        .set('Accept', 'application/json')
                        .end(function(err, res) {
                            should.not.exist(err);

                            console.log(res.text);
                            var userJson = JSON.parse(res.text);
                            userJson.email.should.be.equal('someone@email.com');
                            userJson.company.name.should.be.equal('Email Inc.');
                            userJson.company.domain.should.be.equal('@email.com');
                            done();
                        });
                });
            });

            it('GET-ing user to verify with incorrect code should fail', function (done) {
                superagent.get(baseUrl + '/users/verify')
                    .query({ code: 'XYZ' })
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        should.exist(err);
                        err.status.should.be.equal(status.BAD_REQUEST);
                        done();
                    });
            });

            it('GET-ing user to verify without code should fail', function (done) {
                superagent.get(baseUrl + '/users/verify')
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        should.exist(err);
                        err.status.should.be.equal(status.BAD_REQUEST);
                        done();
                    });
            });

            describe('GET-ing user someone@email.com', function () {
                var postErr, postRes;

                before(function (done) {
                    superagent.get(baseUrl + '/users/someone@email.com')
                        .set('Accept', 'application/json')
                        .end(function(err, res) {
                            postErr = err;
                            postRes = res;
                            done();
                        });
                });

                it('should succeed', function () {
                    should.not.exist(postErr);
                    postRes.status.should.be.equal(status.OK);
                });

                it('should get a pending user', function () {
                    var result = JSON.parse(postRes.text);
                    result.status.should.be.equal("pending");
                    result.email.should.be.equal("someone@email.com");
                });

                describe('POST-ing user someone@email.com to verify', function () {
                    before(function (done) {
                        PendingUser.findOne({ email: 'someone@email.com' }, 'code email',
                            function (err, pendingUser) {
                                if (err) {
                                    return done(err);
                                }
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
                                    .end(function(err, res) {
                                        postErr = err;
                                        postRes = res;
                                        done();
                                    });
                            });
                    });

                    it('should succeed', function () {
                        should.not.exist(postErr);
                        postRes.status.should.be.equal(status.CREATED);
                        postRes.headers.location.should.be.equal('/users/someone@email.com');
                    });

                    it('GET-ing all users should fail because authentication', function (done) {
                        superagent.get(baseUrl + '/users')
                            .set('Authorization', 'Token 123')
                            .set('x', 'application/json')
                            .end(function(err, res) {
                                should.exist(err);
                                err.status.should.be.equal(status.UNAUTHORIZED);
                                done();
                            });
                    });
                });
            });
        });
    });
});