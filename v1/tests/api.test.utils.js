'use strict';

const
    _ = require('lodash'),
    async = require('async'),
    status = require('http-status'),
    superagent = require('superagent'),
    Chance = require('chance'),
    chance = new Chance();

const
    logger = require('../../app/utils/logger'),
    User = require('../../app/models/user'),
    PendingUser = require('../../app/models/pendingUser');

const
    port = 3000,
    baseUrl = "http://localhost:" + port + "/v1";

function createCompany(companyData, callback) {
    superagent.post(baseUrl + '/admin/companies')
        .send(companyData)
        .set('Accept', 'application/json')
        .end((err, res) => {
            callback(err, res);
        });
};

function createNewActiveUser(userData, callback) {
    var r1;
    superagent.post(baseUrl + '/pendingusers')
        .send({ email: userData.email })
        .set('Accept', 'application/json')
        .end((err1, res1) => {
            if (err1) {
                logger.error('Failed posting user');
                return callback(err1);
            }
            r1 = res1;
            PendingUser.findOne({ email: userData.email }, 'code email', (err, pendingUser) => {
                if (err) {
                    logger.error('Failed finding PendingUser');
                    return callback(err);
                }
                if (!pendingUser) {
                    return callback(new Error('No pendingUser'));
                }
                userData.code = pendingUser.code;
                superagent.post(baseUrl + '/pendingusers/' + pendingUser.code + '/actions/verify')
                    .query({ code: userData.code })
                    .send(userData)
                    .set('Accept', 'application/json')
                    .end((err2, res2) => {
                        if (err2) {
                            logger.error('Failed verifying new user');
                            return callback(err2);
                        }

                        User
                            .findOne({ email: userData.email })
                            .populate("company")
                            .exec((err, newUser) => {
                                callback(null, [r1, res2]);
                            });
                    });
            });
        });
};

function loginUser(userData, callback) {
    superagent.post(baseUrl + '/authenticate')
        .send({ email: userData.email, password: userData.password })
        .set('Accept', 'application/json')
        .end(function(err, res) {
            var jsonToken;

            if (err) {
                return callback(err);
            }
            jsonToken = JSON.parse(res.text);
            callback(null, jsonToken.token);
        });
};

function createUserAndLoginIn(userData, callback) {
    createNewActiveUser(userData, function (err, res) {
        loginUser(userData, function (err, token) {
            callback(err, token);
        });
    });
};

function createUsersAndLoginIn(totalUser, companyDomain, callback) {
    let functions = [];
    _.range(totalUser).forEach((item) => {
        functions.push((cb) => {
            let email = chance.hash({length: 25}) + companyDomain;
            createUserAndLoginIn({
                email: email,
                firstName: chance.first(),
                lastName: chance.last(),
                username: email,
                password: '123'
            }, cb);
        });
    });

    async.parallel(functions, (err, tokens) => {
        callback(err, tokens);
    });
}

function postRandomMood(mood, comment, userToken, callback) {
    // TODO rgutierrez - make it random
    superagent.post(baseUrl + '/users/me/moods')
        .send({ mood: 'love', comment: 'love it! it is working!' })
        .set('Accept', 'application/json')
        .set('Authorization', 'Token ' + userToken)
        .end(function(err, res) {
            callback(err, res);
        });
}

function postRandomMoods(totalMoods, tokens, callback) {
    let functions = [];
    _.range(totalMoods).forEach((item) => {
        functions.push((cb) => {
            postRandomMood(null, null, tokens[_.random(0, tokens.length - 1)], cb);
        });
    });

    async.parallel(functions, (err, results) => {
        callback(err, results);
    });
}

module.exports.port = port;
module.exports.baseUrl = baseUrl;
module.exports.createCompany = createCompany;
module.exports.createNewActiveUser = createNewActiveUser;
module.exports.loginUser = loginUser;
module.exports.createUserAndLoginIn = createUserAndLoginIn;
module.exports.createUsersAndLoginIn = createUsersAndLoginIn;
module.exports.postRandomMoods = postRandomMoods;