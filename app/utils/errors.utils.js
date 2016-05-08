'use strict';

var logger = require('./logger');

var logError = function (error) {
    if (error && error.message) {
        logger.error(error.message);
    }
}

var error = function (settings) {
    var errSettings = settings || {},
        err = new Error(errSettings.message);
    if (errSettings.type) {
        err.type = errSettings.type;
    }
    logError(err);
    return err;
}

var errorWithType = function (error, type) {
    if (error instanceof Error) {
        error.type = type;
        module.exports.logError(error);
        return error;
    }
    throw new Error('Error is not an error');
}

module.exports.handleMongoDBError = function (err, callback) {
    return callback(errorWithType(err, 'App.Error.MongoDB'));
}

module.exports.handleEmailError = function (err, callback) {
    return callback(errorWithType(err, 'App.Error.Email'));
}

module.exports.handleAppValidationError = function (message, callback) {
    return callback(error({
        message: message,
        type: 'App.Error.Validation'
    }));
}

module.exports.handleAppCommonError = function (message, callback) {
    return callback(error({
        message: message,
        type: 'App.Error.Common'
    }));
}