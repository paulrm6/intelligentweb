var express = require('express');
var router = express.Router();
var client = require('../private/twit');
var path = require('path');

/* GET home page. */
<<<<<<< HEAD
router.get('/*', function(req, res, next) {
  res.render('index', { title: 'Express' });
=======
router.get('/', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../views', '/queryInterface.html'));
>>>>>>> paul-test
});

module.exports = router;
