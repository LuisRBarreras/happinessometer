'use strict';

const 
    _ = require('lodash'),
    assert = require('assert'),
    async = require('async'),
    chalk = require('chalk'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    should = require('should');

const 
    Company = require('../../../models/company'),
    companyService = require('../../../services/company.service')(),
    config = require('../../../../config/config'),
    logger = require('../../../utils/logger'),
    Mood = require('../../../models/mood'),
    moodEnum = require('../../../models/mood_enum'),
    moodService = require('../../../services/mood.service')(),
    User = require('../../../models/user'),
    userService = require('../../../services/user.service')();

const nearsoftCompanyConfig = {
        name: 'Nearsoft',
        domain: '@nearsoft.com' 
    },
    acmeCompanyConfig = {
        name: 'Acme',
        domain: '@acme.org'
    };

describe('MoodService', () => {
    let db,
        nearsoftCompany,
        acmeCompany;

    before(done => {
        db = mongoose.connect(config.db.uri, config.db.options, err => {
            if (err) {
                logger.error(err, 'Could not connect MongoDB.');
                return done(err);
            }

            createCompanies([nearsoftCompanyConfig, acmeCompanyConfig], (err, results) => {
                if (err) {
                    return done(err);
                }

                nearsoftCompany = results[0];
                acmeCompany = results[1];

                done();
            });
        });
    });

    after(done => {
        if (db) {
            async.parallel([
                cb => {
                    Mood.remove({}, cb);
                },
                cb => {
                    Company.remove({}, cb);
                },
                cb => {
                    User.remove({}, cb);
                }
            ], () => {
                db.disconnect();
                done();
            });
        } else {
            done();
        }
    });
    
    describe('#setMood', () => {
        it('without mood config should fail', done => {
            moodService.setMood(null, err => {
                should.exist(err);
                err.message.should.be.equal('No mood values provided');
                done();
            });
        });

        it('with mood data and existing company and without user should succeed', done => {
            let moodConfig = {
                mood: 'love',
                comment: 'Im feeling in love!',
                company: nearsoftCompany.id
            };

            moodService.setMood(moodConfig, (err, newMood) => {
                should.not.exist(err);
                should.exist(newMood);
                newMood.mood.should.be.equal(moodConfig.mood);
                newMood.comment.should.be.equal(moodConfig.comment);
                newMood.company.id.should.be.equal(nearsoftCompany.id);
                newMood.company.name.should.be.equal(nearsoftCompany.name);
                newMood.company.domain.should.be.equal(nearsoftCompany.domain);
                should.not.exist(newMood.user);
                done();
            });
        });

        it('with mood data and non-existing company should fail', done => {
            moodService.setMood({
                mood: 'love',
                comment: 'Im feeling in love!',
                company: mongoose.Types.ObjectId()
            }, err => {
                should.exist(err);
                err.message.should.be.equal('No Company exists with that id');
                done();
            });
        });

        describe('when 2 users exists', () => {
            let userFromNearsoft, userFromAcme;

            before(done => {
                const userFromNearsoftConfig = {
                    company: nearsoftCompany.id,
                    username: 'user1',
                    password: '123',
                    name: {
                        first: 'User',
                        last: 'One'
                    },
                    email: 'user1@nearsoft.com',
                    enabled: true,
                }, userFromAcmeConfig = {
                    company: acmeCompany.id,
                    username: 'user2',
                    password: '123',
                    name: {
                        first: 'User',
                        last: 'Two'
                    },
                    email: 'user2@acme.com',
                    enabled: true,
                };

                createActiveUsers([userFromNearsoftConfig, userFromAcmeConfig], (err, results) => {
                    if (err) {
                        return done(err);
                    }
                    userFromNearsoft = results[0];
                    userFromAcme = results[1];

                    done();
                });
            });

            after(done => {
                if (db) {
                    async.parallel([
                        cb => {
                            Mood.remove({}, cb);
                        }
                    ], () => {
                        done();
                    });
                } else {
                    done();
                }
            });

            it('with mood data and existing company and user should succeed', done => {
                let moodConfig = {
                    mood: 'love',
                    comment: 'Im feeling in love!',
                    company: nearsoftCompany.id,
                    user: userFromNearsoft.id
                };

                moodService.setMood(moodConfig, (err, newMood) => {
                    should.not.exist(err);
                    should.exist(newMood);
                    newMood.mood.should.be.equal(moodConfig.mood);
                    newMood.comment.should.be.equal(moodConfig.comment);
                    newMood.company.id.should.be.equal(nearsoftCompany.id);
                    newMood.company.name.should.be.equal(nearsoftCompany.name);
                    newMood.company.domain.should.be.equal(nearsoftCompany.domain);
                    newMood.user.email.should.be.equal(userFromNearsoft.email);
                    done();
                });
            });

            // TODO 'with mood data but with user from another company should fail'
        });
    });

    describe('#findAllWithPage', () => {
        before(function(done) {
            createMoodsForCompanies([{
                    company: nearsoftCompany,
                    totalMoods: 35
                }, {
                    company: acmeCompany,
                    totalMoods: 5
                }], () => {
                    done();
                })
        });

        after(function(done) {
            async.parallel([
                callback => {
                    Mood.remove({}, callback);
                }
            ], () => {
                done();
            });
        });

        it('with page=1 should return the correct number of moods', function(done) {
            moodService.findAllWithPage(nearsoftCompany.id, 1, function(err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(30);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(40);
                done();
            });
        });

        it('with page=2 should return the correct number of moods', function(done) {
            moodService.findAllWithPage(nearsoftCompany.id, 2, function(err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(5);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(40);
                done();
            });
        });
    });

    describe('#findAllByCompanyWithPage', () => {
        before(done => {
            createMoodsForCompanies([{
                company: nearsoftCompany,
                totalMoods: 20,
                fromDate: moment().subtract(10, 'days').utc()
            }, {
                company: nearsoftCompany,
                totalMoods: 15,
                fromDate: moment().subtract(4, 'days').utc(),
                plusDays: 3
            }, {
                company: nearsoftCompany,
                totalMoods: 1
            }, {
                company: acmeCompany,
                totalMoods: 5
            }], err => {
                done();
            });
        });

        after(done => {
            done();
        });

        it('with page=1 should return the correct number of moods', done => {
            moodService.findAllByCompanyWithPage(1, nearsoftCompanyConfig.domain, null, function(err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(30);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(36);
                done();
            });
        });

        it('with page=2 should return the correct number of moods', done => {
            moodService.findAllByCompanyWithPage(2, nearsoftCompanyConfig.domain, null, function(err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(6);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(36);
                done();
            });
        });

        it('with date rage', done => {
            var fromDate = moment().subtract(4, 'days'),
                toDate = fromDate.clone().add(3, 'days'),
                dateRange = {from: fromDate, to: toDate};

            moodService.findAllByCompanyWithPage(1, nearsoftCompanyConfig.domain, dateRange,
                function(err, moods, pageCount, itemCount) {
                    should.not.exist(err);
                    moods.length.should.be.equal(15);
                    pageCount.should.be.equal(1);
                    itemCount.should.be.equal(15);
                    done();
                });
        });
    });
});

function createCompanies(companiesConfigArray, callback) {
    'use strict';

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

function createActiveUsers(userConfigArray, callback) {
    'use strict';

    let userCreationFunctionArray = _.map(userConfigArray, userConfig => {
        return callback => {
            User.create(userConfig, (err, newUser) => {
                if (err) {
                    logger.error(err.message);
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

function findCompanies(companiesConfigArray, callback) {
    var companyCreationFunctionArray;

    if (companiesConfigArray) {
        companyCreationFunctionArray = _.map(companiesConfigArray, function(companyConfig) {
            return function(callback) {
                companyService.findWithDomain(companyConfig.domain, function (err, newCompany) {
                    callback(err, newCompany);
                });
            }
        });

        async.parallel(companyCreationFunctionArray, function (err, results) {
            callback(err, results);
        });
    } else {
        callback(new Error('No companiesConfigArray provided.'));
    }
}

// [{company: x, totalMoods: y, fromDate: xx, plusDays: yy}, ...]
function createMoodsForCompanies(moodsConfig, callback) {
    var moodsToCreate = new Array();
    if (moodsConfig) {
        _.forEach(moodsConfig, function (moodConfig) {
            if (moodConfig.company && moodConfig.company._id && moodConfig.totalMoods) {
                for (var i = 0; i < moodConfig.totalMoods; ++i) {
                    moodsToCreate.push(
                        createMoodConfig(moodEnum[_.random(0, 7)], moodConfig));
                }
            }
        });

        async.each(moodsToCreate, function (mood, innerCallback) {
            moodService.setMood(mood, function(err, m) {
                if (err) {
                    return innerCallback(err);
                }
                innerCallback();
            });
        }, function (err) {
            callback(err);
        });
    } else {
        callback(new Error('No moodsConfig provided.'));
    }

    function createMoodConfig(mood, moodConfig) {
        var newMood = {
            mood: mood,
            comment: "I'm feeling " + mood,
            company: moodConfig.company._id
        };

        if (moodConfig.fromDate) {
            if (moodConfig.plusDays) {
                newMood.createdAt = moodConfig.fromDate.clone().add(_.random(0, moodConfig.plusDays), 'days').utc().toDate();
            } else {
                newMood.createdAt = moodConfig.fromDate.toDate();
            }
        }
        return newMood;
    };
}

function deleteCompaniesAndMoods(done) {
    async.parallel([
        function(callback) {
            companyService.deleteWithDomain(nearsoftCompanyConfig.domain, callback);
        },
        function(callback) {
            companyService.deleteWithDomain('@acme.org', callback);
        },
        function(callback) {
            Mood.remove({}, callback);
        }
    ], function() {
        done();
    });
}