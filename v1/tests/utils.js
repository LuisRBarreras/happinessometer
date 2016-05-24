'use strict';

var status = require('http-status'),
    superagent = require('superagent');

var logger = require('../../app/utils/logger'),
    PendingUser = require('../../app/models/pendingUser');

var port = 3000,
    baseUrl = "http://localhost:" + port + "/v1";

function createCompany(companyData, callback) {
    superagent.post(baseUrl + '/admin/companies')
        .send(companyData)
        .set('Accept', 'application/json')
        .end(function(err, res) {
            callback(err, res);
        });
};

function createNewActiveUser(userData, callback) {
    var r1;
    superagent.post(baseUrl + '/pendingusers')
        .send({ email: userData.email })
        .set('Accept', 'application/json')
        .end(function(err1, res1) {
            if (err1) {
                logger.error('Failed posting user');
                return callback(err1);
            }
            r1 = res1;
            PendingUser.findOne({ email: userData.email }, 'code email', function (err, pendingUser) {
                if (err) {
                    logger.error('Failed finding PendingUser');
                    return callback(err);
                }
                if (!pendingUser) {
                    return callback(new Error('No pendingUser'));
                }
                userData.code = pendingUser.code;
                superagent.post(baseUrl + '/users/verify')
                    .query({ code: userData.code })
                    .send(userData)
                    .set('Accept', 'application/json')
                    .end(function(err2, res2) {
                        if (err2) {
                            logger.error('Failed verifying new user');
                            return callback(err2);
                        }
                        callback(null, [r1, res2]);
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
        })
    });
};

module.exports.port = port;
module.exports.baseUrl = baseUrl;
module.exports.createCompany = createCompany;
module.exports.createNewActiveUser = createNewActiveUser;
module.exports.loginUser = loginUser;
module.exports.createUserAndLoginIn = createUserAndLoginIn;