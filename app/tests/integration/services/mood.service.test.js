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
    TestUtils = require('../utils/test.utils'),
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

            TestUtils.createCompanies([nearsoftCompanyConfig, acmeCompanyConfig], (err, results) => {
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
            TestUtils.deleteModels([Mood, Company, User], () => {
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

        describe('when 2 users exists from different Companies', () => {
            let userFromNearsoft, userFromAcme;

            before(done => {
                if (!nearsoftCompany || !acmeCompany) {
                    return done(new Error('No nearsoftCompany nor acmeCompany'));
                }

                TestUtils.generateUsersForCompanies([{
                    company: nearsoftCompany,
                    total: 1
                }, {
                    company: acmeCompany,
                    total: 1
                }], (err, users) => {
                    if (err) {
                        return done(err);
                    }
                    userFromNearsoft = users[0][0];
                    userFromAcme = users[1][0];

                    done();
                });
            });

            after(done => {
                TestUtils.deleteModels([Mood, User], () => {
                    done();
                });
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

    describe('With 10 users from Nearsoft and 10 users from Acme', () => {
        let usersFromNearsoft, usersFromAcme;

        before((done) => {
            if (!nearsoftCompany || !acmeCompany) {
                return done(new Error('No nearsoftCompany nor acmeCompany'));
            }

            TestUtils.generateUsersForCompanies([{
                company: nearsoftCompany,
                total: 10
            }, {
                company: acmeCompany,
                total: 10
            }], (err, users) => {
                if (err) {
                    return done(err);
                }
                usersFromNearsoft = users[0];
                usersFromAcme = users[1];

                User.count({}, (err, count) => {
                    logger.debug('Total users: ' + count);
                    done();
                });
            });
        });

        after((done) => {
            TestUtils.deleteModels([Mood, User], () => {
                done();
            });
        });

        describe('#findAll with page', () => {
            before((done) => {
                TestUtils.createMoodsForCompanies([{
                    company: nearsoftCompany,
                    totalMoods: 35,
                    users: usersFromNearsoft
                }, {
                    company: acmeCompany,
                    totalMoods: 5,
                    users: usersFromAcme
                }], () => {
                    done();
                });
            });

            after((done) => {
                async.parallel([
                    callback => {
                        Mood.remove({}, callback);
                    }
                ], () => {
                    done();
                });
            });

            it('with page=1 should return the correct number of moods', function(done) {
                moodService.findAll(nearsoftCompany.id, { page: 1 }, function(err, moods, pageCount, itemCount) {
                    should.not.exist(err);
                    moods.length.should.be.equal(30);
                    pageCount.should.be.equal(2);
                    itemCount.should.be.equal(35);
                    done();
                });
            });

            it('with page=2 should return the correct number of moods', function(done) {
                moodService.findAll(nearsoftCompany.id, { page: 2 }, function(err, moods, pageCount, itemCount) {
                    should.not.exist(err);
                    moods.length.should.be.equal(5);
                    pageCount.should.be.equal(2);
                    itemCount.should.be.equal(35);
                    done();
                });
            });
        });

        describe('#findAll with page and date range', () => {
            before(done => {
                TestUtils.createMoodsForCompanies([{
                    company: nearsoftCompany,
                    totalMoods: 10,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(10, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    totalMoods: 10,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(7, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    totalMoods: 15,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(5, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    users: usersFromNearsoft,
                    totalMoods: 1
                }, {
                    company: acmeCompany,
                    users: usersFromAcme,
                    totalMoods: 5
                }], err => {

                    logger.debug('----------');
                    Mood.find({ company: nearsoftCompany.id })
                        .sort({ createdAt: -1 })
                        .exec((err, moods) => {
                            for (let i = 0; i < moods.length; ++i) {
                                let createdAt = moment(moods[i].createdAt),
                                    daysDiff = moment().diff(createdAt, 'days');
                                logger.debug(createdAt.utc().format('YYYY MM DD') + "-" + daysDiff);
                            }

                            done();
                        });
                });
            });

            after(done => {
                TestUtils.deleteModels([Mood, User], () => {
                    done();
                });
            });

            it('with page=1 should return the correct number of moods', done => {
                moodService.findAll(nearsoftCompany.id, { page: 1 }, 
                    (err, moods, pageCount, itemCount) => {
                    should.not.exist(err);
                    moods.length.should.be.equal(30);
                    pageCount.should.be.equal(2);
                    itemCount.should.be.equal(36);
                    done();
                });
            });

            it('with page=2 should return the correct number of moods', done => {
                moodService.findAll(nearsoftCompany.id, { page: 2 }, 
                    (err, moods, pageCount, itemCount) => {
                    should.not.exist(err);
                    moods.length.should.be.equal(6);
                    pageCount.should.be.equal(2);
                    itemCount.should.be.equal(36);
                    done();
                });
            });

            it('without page but with date rage', done => {
                var fromDate = moment().utc().subtract(10, 'days').toDate(),
                    toDate = moment().utc().subtract(5, 'days').toDate(),
                    dateRange = {from: fromDate, to: toDate};

                moodService.findAll(nearsoftCompany.id, { dateRange: dateRange },
                    (err, moods, pageCount, itemCount) => {
                    should.not.exist(err);
                    moods.length.should.be.equal(30);
                    pageCount.should.be.equal(2);
                    itemCount.should.be.equal(35);
                    done();
                });
            });
        });

    });
});