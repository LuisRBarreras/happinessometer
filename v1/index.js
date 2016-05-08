'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    express = require('express'),
    logger = require('../app/utils/logger'),
    modules_to_mount = [],
    resourcesToIgnore = ['_users.js'];

_.each(fs.readdirSync(process.cwd() + '/v1/resources'), function(file) {
    if (resourcesToIgnore.indexOf(file) >= 0) return;

    if (_.last(file.split('.')) === 'js') {
        var module_name = _.initial(file.split('.')).join('.');
        modules_to_mount.push(module_name);
    }
});

var router = express.Router();

_.each(modules_to_mount.sort().reverse(), function(module_name) {
    /* get the class module of the module to mount */
    var resource_class = require(process.cwd() + '/v1/resources/' + module_name);
    /* map the resource according to simple rules */
    var path = '';

    _.each(module_name.split('.'), function(fragment) {
        if (fragment.charAt(0) === '_' && fragment.charAt(fragment.length - 1) === '_') {
            var param = fragment.substring(1, fragment.length - 1);
            if (param === 'id') {
                throw new Error('The :id param is reserved for resource identifier.');
            }
            path += '/:' + param;
        }
        else {
            path += '/' + fragment;
        }
    });

    path += '/:id?';

    router.all(path, function(request, response, continuation) {
        var resource_instance = new resource_class(request, response, continuation);
        resource_instance.dispatch();
    });

    logger.info('v1' + path + ' resource mounted', path);
});

module.exports = router;