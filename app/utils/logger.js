'use strict';

var chalk = require('chalk');
var winston = require('winston');

var config = {
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'happinessometer.log' })
    ]
};

if (process.env["NODE_ENV"] != "production") {
    config.level = 'debug';
}

var logger = new (winston.Logger)(config);

function _log(level, msg, metadata) {
    if (!metadata) {
        return logger.log(level, msg);
    }
    logger.log(level, msg, metadata);
}

module.exports.info = function(msg, metadata) {
    _log('info', msg, metadata);
};

module.exports.debug = function(msg, metadata) {
    _log('debug', msg, metadata);
};

module.exports.error = function(msg, metadata) {
    _log('error', msg, metadata);
};