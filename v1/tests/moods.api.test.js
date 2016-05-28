'use strict';

const
    async = require('async'),
    http = require('http'),
    mongoose = require('mongoose'),
    should = require('should'),
    status = require('http-status'),
    superagent = require('superagent');

const
    app = require('../../app'),
    config = require('../../config/config'),
    logger = require('../../app/utils/logger'),
    Company = require('../../app/models/company'),
    User = require('../../app/models/user'),
    PendingUser = require('../../app/models/pendingUser'),
    Mood = require('../../app/models/mood'),
    ApiTestUtils = require('./api.test.utils'),
    IntegrationTestingUtils = require('../../app/tests/integration/utils/test.utils');

describe("/v1/moods", () => {
    let db,
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
        IntegrationTestingUtils.deleteModels([Mood, PendingUser, User, Company], () => {
            if (server) {
                server.close();
            }
            done();
        });
    });

    describe('With a Company Acme Inc.', () => {
        let companyData = {
            name: 'Acme Inc.',
            domain: '@acme.com'
        };

        before((done) => {
            ApiTestUtils.createCompany(companyData, (err) => {
                if (err) {
                    return done(err);
                }
                done();
            });
        });

        describe('With a new logged user', () => {
            var userData = {
                email: 'someone@acme.com',
                firstName: 'Some',
                lastName: 'One',
                username: 'someone',
                password: 'someone123'
            }, userToken;

            before((done) => {
                ApiTestUtils.createUserAndLoginIn(userData, (err, token) => {
                    if (err) {
                        return done(err);
                    }
                    userToken = token;
                    done();
                });
            });

            after((done) => {
                IntegrationTestingUtils.deleteModels([Mood, PendingUser, User], () => {
                    done();
                });
            });

            it('create mood without Token should fail with Bad Request', (done) => {
                superagent.post(baseUrl + '/users/me/moods')
                    .set('Accept', 'application/json')
                    .end((err, res) => {
                        should.exist(err);
                        res.status.should.be.equal(status.BAD_REQUEST);
                        var result = JSON.parse(res.text);
                        result.status.should.be.equal(status.BAD_REQUEST);
                        result.message.should.be.equal('No token provided');
                        done();
                    });
            });

            it('create mood without data should fail with Bad Request', (done) => {
                superagent.post(baseUrl + '/users/me/moods')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userToken)
                    .end((err, res) => {
                        should.exist(err);
                        res.status.should.be.equal(status.BAD_REQUEST);
                        var result = JSON.parse(res.text);
                        result.status.should.be.equal(status.BAD_REQUEST);
                        result.message.should.be.equal('There are errors');
                        done();
                    });
            });

            it('create mood should succeed with Ok', (done) => {
                superagent.post(baseUrl + '/users/me/moods')
                    .send({ mood: 'love', comment: 'love it! it is working!' })
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userToken)
                    .end((err, res) => {
                        should.not.exist(err);
                        // TODO rgutierrez - what should answer this?
                        res.status.should.be.equal(status.OK);
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

        describe('With 10 logged users and 100 random post', () => {
            let userTokens = [];

            before((done) => {
                ApiTestUtils.createUsersAndLoginIn(10, companyData.domain, (err, tokens) => {
                    if (err) {
                        return done(err);
                    }
                    userTokens = tokens;

                    ApiTestUtils.postRandomMoods(100, userTokens, (err) => {
                        done();
                    });
                });
            });

            it('getting company moods should return the correct number of moods', (done) => {
                logger.debug('User Token: ' + userTokens[0]);
                superagent.get(baseUrl + '/users/me/companies/moods')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Token ' + userTokens[0])
                    .end(function(err, res) {
                        var result = JSON.parse(res.text);
                        result.moods.length.should.be.equal(30);
                        logger.debug(JSON.stringify(result.pagination));
                        result.pagination.page.should.be.equal(1);
                        result.pagination.totalItems.should.be.equal(100);
                        done();
                    });
            });
        })
    });
});