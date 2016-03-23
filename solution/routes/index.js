var express = require('express');
var router = express.Router();
var client = require('../private/twit');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.sendfile('solution/views/index.html');
  //res.render('index', { title: 'Search' });
});

module.exports = router;
