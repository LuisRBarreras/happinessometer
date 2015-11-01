'use strict';

var assert = require('assert'),
    async = require('async'),
    should = require('should'),
    mongoose = require('mongoose'),
    chalk = require('chalk'),
    moment = require('moment'),
    config = require('../../../../config/config'),
    Mood = require('../../../models/mood');

describe('Mood', function() {
    var db;

    before(function(done) {
        db = mongoose.connect(config.db.uri, config.db.options, function(err) {
            if (err) {
                console.error(chalk.red('Could not connect to MongoDB!'));
                console.log(chalk.red(err));
            }
            done(err);
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

    it('#save() should create a new Mood', function(done) {
        var mood = new Mood({
            mood: 'joy',
            comment: 'I dont have anything to add',
            from: 'web'
        });

        mood.save(function(err, newMood) {
            should.not.exist(err);
            newMood.mood.should.be.equal(mood.mood);
            newMood.comment.should.be.equal(mood.comment);
            should.exist(newMood.createdAt);
            done();
        });
    });
});