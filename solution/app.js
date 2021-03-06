var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Set up the routes
var index = require('./routes/index');
var search = require('./routes/search');
var flickr = require('./routes/flickr');
var report = require('./routes/report');

var app = express();

//Set the favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Set up calls to routes
app.use('/report', report);
app.use('/flickr', flickr);
app.use('/search', search);
app.use('/*', index);

module.exports = app;