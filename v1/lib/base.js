'use strict';
var _ = require('lodash'),
    extend = require('bextend'),
    config = require('../../config/config'),
    logger = require('../../app/utils/logger'),
    jwt = require('jsonwebtoken');

var emailService = require('../../app/services/email.service'),
    userService = require('../../app/services/user.service')(emailService);


var errors = {
    BadRequestError: function(message) {
        this.message = message;
        this.status = 400;
    },

    ValidationBadRequestError: function(message, fieldErrors) {
        this.message = message;
        this.errors = fieldErrors;
        this.status = 400;
    },

    NotFoundError: function(message) {
        this.message = message;
        this.status = 404;
    },

    ConflictError: function(message) {
        this.message = message;
        this.status = 409;
    },

    InternalError: function(message) {
        this.message = message;
        this.status = 500;
    },

    UnauthorizedError: function(message) {
        this.message = message;
        this.status = 401;
    },

    NotAllowedError: function(message) {
        this.message = message;
        this.status = 405;
    }
};

_.each(_.keys(errors), function(key) {
    errors[key].prototype = new Error();
});

var Resource = function(request, response, continuation) {
    this.request = request;
    this.response = response;
    this.continuation = continuation;
};

_.extend(Resource.prototype, {
    methods: ['get', 'head', 'post', 'put', 'patch', 'delete', 'options', 'trace'],
    needsToken: [],

    dispatch: function() {
        logger.info('New Request', {
            request: {
                path: this.request.path,
                method: this.request.method,
                remoteIp: this.request.id,
                baseUrl: this.request.baseUrl,
                query: JSON.stringify(this.request.query)
            }
        });

        this.response.set('Content-Type', 'application/json; charset=utf-8');
        /**
         * we should dispatch the incoming request based on the used method, if the method
         * is not implemented by the resource we will send a "Method not allowed" response
         * with the "Allow" headers containing the list of implemented methods for that
         * resource
         */
        var that = this;
        var method = this.request.method.toLowerCase();

        if(this[method] && this[method].constructor === Function) {
            if (this.needsToken.indexOf(method) >= 0) {
                this.validateToken(function(decodedToken) {
                    userService.findUserByEmail(decodedToken.email, function (err, user) {
                        if (err) {
                            return that.dispatchError(new errors.InternalError('No user'));
                        }

                        that.request.user = user;

                        that[method].apply(that, [
                            that.request,
                            that.response,
                            that.continuation
                        ]);
                    });
                });
            } else {
                this[method].apply(this, [
                    this.request,
                    this.response,
                    this.continuation
                ]);
            }
        }
        else {
            var implemented_methods = [];
            _.each(this.methods, function(test_method) {
                if(that[test_method] && that[test_method].constructor === Function)
                    implemented_methods.push(test_method.toUpperCase());
            });
            this.response.set('Allow', implemented_methods.join(', '));
            this.dispatchError(new errors.NotAllowedError());
        }
    },

    validateToken: function(next) {
        var self = this;

        var token =
            self.request.body.token ||
            self.request.query.token ||
            self.request.headers['x-access-token'];

        if (!token) {
            var authorization = this.request.get('Authorization');
            if (authorization) {
                authorization = authorization.split(' ');
                var scheme = authorization[0];
                if(scheme != 'Token') {
                    return self.dispatchBadRequestError('No token provided');
                }
                token = authorization[1];
            }
        }

        if (token) {
            jwt.verify(token, config.secretKey, function(err, decoded) {
                if (err) {
                    return self.dispatchUnauthorizedError('Failed to authenticate token');
                } else {
                    self.request.decoded = decoded['_doc'];
                    if (process.env["NODE_ENV"] != "production") {
                        logger.debug("Token decoded: " + JSON.stringify(self.request.decoded));
                    }
                    next(self.request.decoded);
                }
            });
        } else {
            return self.dispatchBadRequestError('No token provided');
        }
    },

    dispatchError: function(error) {
        var status = error.status || 500;
        logger.error('Dispatching Error { status: ' + status + ', message: ' +(error.message || '') + ' }');
        this.response.status(status).send(error);
    },

    abort: function(error) {
        this.dispatchError(error);
    },

    dispatchInternalServerError: function(error) {
        var newError = new errors.InternalError(error.message);
        if (error.cause) {
            newError.casue = error.cause;
        }
        this.dispatchError(newError);
    },

    dispatchNotFoundError: function(error) {
        this.dispatchError(new errors.NotFoundError(error.message || error));
    },

    dispatchSuccessfulResourceCreation: function(resourceIdentifier) {
        this.response.setHeader('Location', 'http://algo/' + resourceIdentifier);
        this.response.status(201).send(null);
    },

    dispatchBadRequestError: function(error) {
        this.dispatchError(new errors.BadRequestError(error.message || error));
    },

    dispatchValidationErrors: function(message, fieldErrors) {
        this.dispatchError(new errors.ValidationBadRequestError(message, fieldErrors));
    },

    dispatchConflictError: function(error) {
        this.dispatchError(new errors.ConflictError(error.message));
    },

    dispatchUnauthorizedError: function(error) {
        this.dispatchError(new errors.UnauthorizedError(error.message));
    },

    handleError: function(error) {
        logger.debug('Handling Error: ' + JSON.stringify(error));
        if (!error instanceof Error) {
            throw new Error("handleError: error is not an Error.");
        }
        if (error.type) {
            if (error.type === 'App.Validation' || error.type === 'App.Error.Validation') {
                return this.dispatchBadRequestError(error);
            }
        }
        return this.dispatchError(error);
    }
});


// assigning the extend function to every resource class in the base library
Resource.extend = extend;

// module exports
module.exports.Resource = Resource;
module.exports.errors = errors;
