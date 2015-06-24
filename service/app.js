'use strict';

var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors({
	exposeHeaders: ['Location', 'Content-Length', 'Date']
}));


// api v1 router mounting
var api_v1 = require('./v1');
app.use('/v1/', api_v1);

// catch 404 and forward to error handler
app.use(function(request, response, continuation) {
	var error = new Error('Not Found');
	error.status = 404;
	continuation(error);
});

// error handlers

// development error handler will print stacktrace
if(app.get('env') === 'development') {
	app.use(function(error, request, response, continuation) {
		response.status(error.status || 500);
		response.render('error', {
			message: error.message,
			error: error
		});
	});
}

// production error handler no stacktraces leaked to user
app.use(function(error, request, response, continuation) {
	response.status(error.status || 500);
	response.render('error', { message: error.message });
});


module.exports = app;