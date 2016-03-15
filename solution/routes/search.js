var express = require('express');
var router = express.Router();
var client = require('../private/twit');

router.get('/', function(req, res, next){
	var user = req.query.user;
	client.get('statuses/user_timeline', { screen_name: user, count: 100 },
            function(err, data, response) {
                //console.log(data);
                res.send(data);
		});

});

module.exports = router;