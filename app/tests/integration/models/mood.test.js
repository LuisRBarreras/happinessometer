'use strict';

var assert = require('assert'),
    async = require('async'),
    should = require('should'),
    mongoose = require('mongoose'),
    moment = require('moment');

var config = require('../../../../config/config'),
    logger = require('../../../utils/logger'),
    Company = require('../../../models/company'),
    Mood = require('../../../models/mood'),
    User = require('../../../models/user'),
    TestUtils = require('../utils/test.utils');

describe('Mood', function() {
    var db;

    before(function(done) {
        db = mongoose.connect(config.db.uri, config.db.options, function(err) {
            if (err) {
                logger.error(err, 'Could not connect MongoDB');
                return done(err);
            }
            done();
        });
    });

    after(function(done) {
        if (db) {
            TestUtils.deleteModels([Mood, Company, User], () => {
                db.disconnect();
                done();
            });
        } else {
            done();
        }
    });

    describe('When there is no Company', function () {

        it('#create() a new Mood should fail', function (done) {
            Mood.create({
                mood: 'joy',
                comment: 'I dont have anything to add',
                from: 'web'
            }, function(err, newMood) {
                logger.error('When saving without company: ' + err);
                should.exist(err);
                done();
            });
        });
    });

    describe('When a Company exists', function () {
        var company;

        before(function (done) {
            Company.create({
                name: 'Company Inc',
                domain: '@company.com'
            }, function(err, newCompany) {
                if (err) {
                    return done(err);
                }
                company = newCompany;
                done();
            });
        });


        it('#create() with Company should create a new Mood with the company associated', function (done) {
            var moodConfig = {
                mood: 'joy',
                comment: 'I dont have anything to add',
                company: company.id
            };
            Mood.create(moodConfig, function(err, newMood) {
                should.not.exist(err);
                newMood.mood.should.be.equal(moodConfig.mood);
                newMood.comment.should.be.equal(moodConfig.comment);
                should.exist(newMood.createdAt);

                Mood.findOne({_id: newMood._id})
                    .populate('company')
                    .exec(function (err2, createdMood) {
                        should.not.exist(err2);
                        should.exist(createdMood);
                        should.exist(createdMood.company);
                        createdMood.company.id.should.be.equal(company.id);
                        createdMood.company.name.should.be.equal(company.name);
                        createdMood.company.domain.should.be.equal(company.domain);
                        logger.info('The company is %s', createdMood.company.name);
                        done();
                });
            });
        });

        it('#create() with no associated User should not create a new Mood', function (done) {
            Mood.create({
                mood: 'joy',
                comment: 'I dont have anything to add',
                company: company.id
            }, function(err, newMood) {
                should.not.exist(err);
                should.exist(newMood);
                should.exist(newMood.company);
                should.not.exist(newMood.user); 
                done();
            });
        });

        it('#create() with unexisting User should create new Mood without a User', function (done) {
            Mood.create({
                mood: 'joy',
                comment: 'I dont have anything to add',
                company: company.id,
                user_id: mongoose.Types.ObjectId()
            }, function (err, newMood) {
                should.not.exist(err);

                 Mood.findOne({_id: newMood._id})
                    .populate('user')
                    .exec(function (err2, createdMood) {
                        should.not.exist(err2);
                        should.not.exist(createdMood.user);
                        done();
                    });
            });
        });

        describe('When User from the Company exists', function () {
            var user;

            before(function (done) {

                User.create({
                    company: company.id,
                    username: 'rgutierrez',
                    password: 'xyz',
                    name: {
                        first: 'Rafael',
                        last: 'Gutierrez'
                    },
                    email: 'rgutierrez@nearsoft.com'
                }, function(err, newUser) {
                    if (err) {
                        return done(err);
                    }
                    user = newUser;
                    done();
                });
            });

            it('User should exist with Company associated', function (done) {
                User.findOne({_id: user._id})
                    .populate('company')
                    .exec(function (err, createdUser) {
                        should.not.exist(err);
                        should.exist(createdUser);
                        should.exist(createdUser.company);
                        company.id.should.be.equal(createdUser.company.id);
                        company.name.should.be.equal(createdUser.company.name);
                        company.domain.should.be.equal(createdUser.company.domain);
                        logger.info(createdUser.company.id);
                        logger.info(createdUser.company._id);
                        logger.info(typeof createdUser.company.id);
                        logger.info(typeof createdUser.company._id);
                        done();
                    });
            });

            it('#create() with User should create new Mood', function (done) {
                Mood.create({
                    mood: 'joy',
                    comment: 'I dont have anything to add',
                    company: company.id,
                    user: user.id
                }, function (err, newMood) {
                    should.not.exist(err);

                     Mood.findOne({_id: newMood._id})
                        .populate('user', 'company')
                        .exec(function (err2, createdMood) {
                            should.not.exist(err2);
                            should.exist(createdMood.user);
                            should.exist(createdMood.company);
                            done();
                        });
                });
            });
        });
    });
});