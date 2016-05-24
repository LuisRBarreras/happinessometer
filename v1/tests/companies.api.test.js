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
    Company = require('../../app/models/company');

describe("/v1/admin/companies", function() {
    var db,
        port = 3000,
        baseUrl = "http://localhost:" + port + "/v1",
        server;

    before(function (done) {
        app.set('port', port);
        server = http.createServer(app);
        server.listen(port);

        done();
    });

    after(function (done) {
        async.series([
            function (cb) {
                Company.remove({}, cb);
            }
        ], function () {
            if (server) {
                server.close();
            }
            done();
        });
    });

    it('GET without existing domain', function (done) {
        superagent.get(baseUrl + '/admin/companies/@gmail.com').end(function(err, res) {
            should.exist(err);
            res.status.should.be.equal(status.NOT_FOUND);
            var result = JSON.parse(res.text);
            result.message.should.be.equal("No Company with domain @gmail.com");
            done();
        });
    });

    describe('When POST a new company', function () {
        var postResult;
        before(function (done) {
            superagent.post(baseUrl + '/admin/companies')
                .send({ name: 'Acme', domain: '@acme.com' })
                .set('Accept', 'application/json')
                .end(function(err, res) {
                    if (err || res.status != status.CREATED) {
                        return done(err);
                    }
                    postResult = res;
                    done();
                });
        });

        it('POST result should be ok', function () {
            postResult.status.should.be.equal(status.CREATED);
            postResult.header.location.should.be.equal('http://algo/@acme.com');
        });

        it('GET company acme', function (done) {
            superagent.get(baseUrl + '/admin/companies/@acme.com').end(function(err, res) {
                should.not.exist(err);
                res.status.should.be.equal(status.OK);
                var result = JSON.parse(res.text);
                result.name.should.be.equal("Acme");
                result.domain.should.be.equal("@acme.com");
                done();
            });
        });
    });
});