var express = require('express');
var router = express.Router();
var path = require('path');

/* Get the home page. */
router.get('/', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../views', '/queryInterface.html'));
});

module.exports = router;
