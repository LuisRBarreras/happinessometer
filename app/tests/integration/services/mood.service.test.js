'use strict';

var _ = require('lodash'),
    assert = require('assert'),
    should = require('should'),
    async = require('async'),
    mongoose = require('mongoose'),
    chalk = require('chalk'),
    config = require('../../../../config/config'),
    moodEnum = require('../../../models/mood_enum'),
    Mood = require('../../../models/mood'),
    moodService = require('../../../services/mood.service')();

describe('MoodService', function () {
    var db;

    before(function(done) {
        db = mongoose.connect(config.db.uri, config.db.options, function(err) {
            if (err) {
                console.error(chalk.red('Could not connect to MongoDB!'));
                console.error(chalk.red(err));
            }
            done();
        });
    });

    after(function(done) {
        if (db) {
            async.parallel([
                function(cb) {
                    Mood.remove({}, cb);
                }
            ], function() {
                db.disconnect();
                done();
            });
        } else {
            done();
        }
    });
    
    describe('#setMood', function() {
        it('without mood config should fail', function(done) {
            moodService.setMood(null, function(err) {
                should.exist(err);
                err.message.should.be.equal('No mood values provided.');
                done();
            });
        });
    });

    describe('#findAll', function () {
        before(function(done) {
            var moods = [],
                mood,
                total = 35,
                index = 0;
            while (index < total) {
                mood = moodEnum[_.random(0, 7)];
                moods.push({
                    mood: mood,
                    comment: 'Im feeling ' + mood,
                    from: 'web'
                });
                index++;
            }

            async.each(moods, function (mood, callback) {
                moodService.setMood(mood, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            }, function(err) {
                done();
            });
        });

        it('with page=1 should return the correct number of moods', function(done) {
            moodService.findAllWithPage(1, function (err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(30);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(35);
                done();
            });
        });

        it('with page=2 should return the correct number of moods', function(done) {
            moodService.findAllWithPage(2, function(err, moods, pageCount, itemCount) {
                should.not.exist(err);
                moods.length.should.be.equal(5);
                pageCount.should.be.equal(2);
                itemCount.should.be.equal(35);
                done();
            });
        });
    });
});
