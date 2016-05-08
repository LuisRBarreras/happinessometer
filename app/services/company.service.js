'use strict';

var Company = require('../models/company'),
    User = require('../models/user'),
    validate = require('validate.js'),
    errorsUtils = require('../utils/errors.utils');

var CompanyService = function() {
};

CompanyService.prototype.createNewCompany = function(newCompanyConfig, callback) {
    var errors = validate(newCompanyConfig, {
        name: { presence:  true},
        domain: { presence: true }
    });

    if (errors) {
        return callback(errors);
    }

    var newCompany = new Company({
        name: newCompanyConfig.name,
        domain: newCompanyConfig.domain
    });

    newCompany.save(function(err, company) {
        if (err) {
            return callback({
                message: 'Error creating the Company ' + newCompanyConfig.name + '.',
                cause: err
            });
        }

        callback(err, company);
    });
};

CompanyService.prototype.deleteWithDomain = function(domainName, callback) {
    Company.findOne({ domain: domainName }, function(err, company) {
        if (err) {
            return callback({
                message: 'Error finding Company with domain ' + domainName + '.',
                cause: err
            });
        }

        if (!company) {
            return callback({
                message: 'No Company with domain ' + + domainName + ' was found.'                
            });
        }

        Company.remove({ _id: company._id }, function(err) {
            if (err) {
                return callback({
                    message: 'Error deleting Company with domain ' + domainName + '.',
                    cause: err
                });
            }
            callback();
        });
    });
};

CompanyService.prototype.findWithDomain = function(domainName, callback) {
    Company.findOne({ domain: domainName }, function(err, company) {
        if (err) {
            return errorsUtils.handleMongoDBError(err, callback);
        }
        return callback(err, company);
    });
};

CompanyService.prototype.findById = function(id, callback) {
    Company.findOne({ _id: id }, function(err, company) {
        if (err) {
            return errorsUtils.handleMongoDBError(err, callback);
        }
        return callback(err, company);
    });
};

CompanyService.prototype.findAllUsersInCompany = function(domainName, callback) {
    User.find({ email: new RegExp(domainName + "$"), enabled: true }, function(err, users) {
        if (err) {
            return callback({
                message: 'Error finding the users with domain ' + domainName + '.',
                cause: err
            });
        }

        return callback(err, users);
    })
}


module.exports = function() {
    return new CompanyService();
}