'use strict';

var async = require('async'),
    http = require('http'),
    mongoose = require('mongoose'),
    should = require('should'),
    status = require('http-status'),
    superagent = require('superagent');

var app = require('../../app'),
    ApiTestUtils = require('./api.test.utils'),
    config = require('../../config/config'),
    logger = require('../../app/utils/logger'),
    Company = require('../../app/models/company'),
    User = require('../../app/models/user'),
    PendingUser = require('../../app/models/pendingUser'),
    IntegrationTestUtils = require('../../app/tests/integration/utils/test.utils');

describe("/v1/users", () => {
    var db,
        port = 3000,
        baseUrl = "http://localhost:" + port + "/v1",
        server;

    before((done) => {
        app.set('port', port);
        server = http.createServer(app);
        server.listen(port);
        done();
    });

    after((done) => {
        IntegrationTestUtils.deleteModels([PendingUser, User, Company], () => {
            if (server) {
                server.close();
            }
            done();
        });
    });

    it('POST-ing a new user without a Company with domain should fail', (done) => {
        superagent.post(baseUrl + '/users')
            .send({ email: 'someone@email.com' })
            .set('Accept', 'application/json')
            .end((err, res) => {
                should.exist(err);
                done();
            });
    });

    describe('When Company Email Inc. exist', () => {
        let companyData = { name: 'Email Inc.', domain: '@email.com' };

        before((done) => {
            superagent.post(baseUrl + '/admin/companies')
                .send(companyData)
                .set('Accept', 'application/json')
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        describe('POST-ing a new user with Email Inc.', () => {
            var postErr, postRes;

            before((done) => {
                superagent.post(baseUrl + '/pendingusers')
                    .send({ email: 'someone@email.com' })
                    .set('Accept', 'application/json')
                    .end((err, res) => {
                        postErr = err;
                        postRes = res;
                        done();
                    });
            });

            after((done) => {
                IntegrationTestUtils.deleteModels([PendingUser, User], () => {
                    done();
                });
            });

            it('should succeed', () => {
                should.not.exist(postErr);
                console.log("Res: " + JSON.stringify(postRes));
                postRes.status.should.be.equal(status.CREATED);
                postRes.header.location.should.match(/\/users\/[a-zA-Z0-9]+/);
                postRes.header["content-type"].should.containEql('application/json');
            });

            it('GET-ing user to verify with correct code should return the pending user', (done) => {
                PendingUser.findOne({ email: 'someone@email.com' }, 'code email', (err, pendingUser) => {
                    should.not.exist(err);

                    pendingUser.code.should.be.ok;
                    pendingUser.email.should.be.equal('someone@email.com');

                    superagent.get(baseUrl + '/pendingusers/' + pendingUser.code)
                        .set('Accept', 'application/json')
                        .end((err, res) => {
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

            it('GET-ing user to verify with incorrect code should fail', (done) => {
                superagent.get(baseUrl + '/pendingusers/XYZ')
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                        should.exist(err);
                        err.status.should.be.equal(status.BAD_REQUEST);
                        done();
                    });
            });

            it('GET-ing user to verify without code should fail', (done) => {
                superagent.get(baseUrl + '/pendingusers')
                    .set('Accept', 'application/json')
                    .end((err, res) => {
                        should.exist(err);
                        err.status.should.be.equal(status.METHOD_NOT_ALLOWED);
                        done();
                    });
            });

            describe('GET-ing user someone@email.com', () => {
                var postErr, postRes;

                before(function (done) {
                    superagent.get(baseUrl + '/users/status/someone@email.com')
                        .set('Accept', 'application/json')
                        .end(function(err, res) {
                            postErr = err;
                            postRes = res;
                            done();
                        });
                });

                it('should succeed', () => {
                    should.not.exist(postErr);
                    postRes.status.should.be.equal(status.OK);
                });

                it('should get a pending user', () => {
                    var result = JSON.parse(postRes.text);
                    result.status.should.be.equal("pending");
                    result.email.should.be.equal("someone@email.com");
                });
            });

            describe('POST-ing user someone@email.com to verify', () => {
                before((done) => {
                    PendingUser.findOne({ email: 'someone@email.com' }, 'code email',
                        (err, pendingUser) => {
                            if (err) {
                                return done(err);
                            }
                            superagent.post(baseUrl + '/pendingusers/' + pendingUser.code + '/actions/verify')
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
                                .end((err, res) => {
                                    postErr = err;
                                    postRes = res;
                                    done();
                                });
                        });
                });

                it('should succeed', () => {
                    postRes.status.should.be.equal(status.CREATED);
                    postRes.headers.location.should.be.equal('/users/someone@email.com');
                });
            });
        });

        describe('With 10 users', () => {
            let userTokens = [];

            before((done) => {
                ApiTestUtils.createUsersAndLoginIn(10, companyData.domain, (err, tokens) => {
                    if (err) {
                        return done(err);
                    }
                    userTokens = tokens;
                    done();
                });
            });


            it('GET-ing users in logged user\'s company should return all company users', (done) => {
                superagent.get(baseUrl + '/users/me/companies/users')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userTokens[0])
                    .end((err, res) => {
                        should.not.exist(err);
                        logger.debug(res.text)
                        var result = JSON.parse(res.text);
                        result.length.should.be.equal(10);
                        done();
                    });
            });
        });
    });
});