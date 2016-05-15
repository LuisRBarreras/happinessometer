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
    quantityReportService = require('../../../services/quantityReport.service')();

const nearsoftCompanyConfig = {
        name: 'Nearsoft',
        domain: '@nearsoft.com' 
    },
    acmeCompanyConfig = {
        name: 'Acme',
        domain: '@acme.org'
    };

describe.only('QuantityReportService', () => {
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

    describe('With 50 users from Nearsoft and 50 users from Acme', () => {
        let usersFromNearsoft, usersFromAcme;

        before((done) => {
            if (!nearsoftCompany || !acmeCompany) {
                return done(new Error('No nearsoftCompany nor acmeCompany'));
            }

            TestUtils.generateUsersForCompanies([{
                company: nearsoftCompany,
                total: 50
            }, {
                company: acmeCompany,
                total: 50
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


        describe('_', () => {
            before(done => {
                TestUtils.createMoodsForCompanies([{
                    company: nearsoftCompany,
                    totalMoods: 1000,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(10, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    totalMoods: 1000,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(7, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    totalMoods: 1500,
                    users: usersFromNearsoft,
                    usingDate: moment().utc().subtract(5, 'days').toDate()
                }, {
                    company: nearsoftCompany,
                    users: usersFromNearsoft,
                    totalMoods: 100
                }, {
                    company: acmeCompany,
                    users: usersFromAcme,
                    totalMoods: 50
                }], () => {
                    done();
                });
            });

            it('XX', (done) => {
                quantityReportService.run(nearsoftCompany.id, null, (err, results) => {
                    console.log('-------');
                    console.log(results);
                    done();
                });
            });
        });
    });
});