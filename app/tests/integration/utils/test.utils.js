'use strict';

const
    _ = require('lodash'),
    async = require('async'),
    Chance = require('chance'),
    chance = new Chance();

const 
    Company = require('../../../models/company'),
    moodEnum = require('../../../models/mood_enum'),
    moodService = require('../../../services/mood.service')(),
    User = require('../../../models/user'),
    userService = require('../../../services/user.service')(),
    companyService = require('../../../services/company.service')();

class TestUtils {

    static createRandomUserConfig(company) {
        let email = chance.hash({length: 25}) + company.domain.substring(1);
        //chance.email({ domain: company.domain.substring(1) });
        return {
            company: company.id,
            username: email,
            password: '123',
            name: {
                first: chance.first(),
                last: chance.last()
            },
            email: email,
            enabled: true,
        };
    }

    static generateUsersForCompanies(configs, callback) {
        let functionArray = _.map(configs, (config) => {
            return (callback) => {
                let userConfigs = [];
                for (let i = 0; i < config.total; i++) {
                    userConfigs.push(TestUtils.createRandomUserConfig(config.company));
                }

                TestUtils.createActiveUsers(userConfigs, (err, users) => {
                    callback(err, users);
                });
            };
        });

        async.parallel(functionArray, (err, results) => {
            callback(err, results);
        });
    }

    static createCompanies(companiesConfigArray, callback) {
        let companyCreationFunctionArray = _.map(companiesConfigArray, companyConfig => {
            return callback => {
                companyService.createNewCompany(companyConfig, (err, newCompany) => {
                    callback(err, newCompany);
                });
            };
        });

        async.parallel(companyCreationFunctionArray, (err, results) => {
            callback(err, results);
        });
    }

    static createActiveUsers(userConfigArray, callback) {
        'use strict';

        let userCreationFunctionArray = _.map(userConfigArray, (userConfig) => {
            return callback => {
                User.create(userConfig, (err, newUser) => {
                    if (err) {
                        return callback(err);
                    }
                    userService.findUserByEmail(newUser.email, (err, loadedUser) => {
                        callback(err, loadedUser);
                    });
                });
            };
        });

        async.parallel(userCreationFunctionArray, (err, results) => {
            callback(err, results);
        });
    }

    static findCompanies(companiesConfigArray, callback) {
        var companyCreationFunctionArray;

        companyCreationFunctionArray = _.map(companiesConfigArray, (companyConfig) => {
            return (callback) => {
                companyService.findWithDomain(companyConfig.domain, (err, newCompany) => {
                    callback(err, newCompany);
                });
            }
        });

        async.parallel(companyCreationFunctionArray, (err, results) => {
            callback(err, results);
        });
    }

    // [{company: x, totalMoods: y, fromDate: xx, plusDays: yy}, ...]
    static createMoodsForCompanies(moodsConfig, callback) {
        var moodsToCreate = [];
        _.forEach(moodsConfig, (moodConfig) => {
            if (moodConfig.company && moodConfig.company._id && moodConfig.totalMoods) {
                for (var i = 0; i < moodConfig.totalMoods; ++i) {
                    moodsToCreate.push(
                        createMoodConfig(moodEnum[_.random(0, 7)], moodConfig));
                }
            }
        });

        async.each(moodsToCreate, (mood, innerCallback) => {
            moodService.setMood(mood, function(err, m) {
                if (err) {
                    return innerCallback(err);
                }
                innerCallback();
            });
        }, (err) => {
            callback(err);
        });

        function createMoodConfig(mood, moodConfig) {
            var newMood = {
                mood: mood,
                comment: "I'm feeling " + mood,
                company: moodConfig.company.id,
                user: moodConfig.users[_.random(0, moodConfig.users.length - 1)]
            };

            if (moodConfig.usingDate) {
                newMood.createdAt = moodConfig.usingDate;
            }
            return newMood;
        };
    }

    static deleteModels(models, callback) {
        let functions = _.map(models, (model) => {
            return (callback) => {
                model.remove({}, callback);
            };
        });

        async.parallel(functions, function() {
            callback();
        });
    }
}

module.exports = TestUtils;