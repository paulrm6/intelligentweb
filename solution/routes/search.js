var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var database = require('../private/sql');

router.get('/', function(req, res, next){
	var q = req.query.q;
	var type = req.query.type;
	if(type=="databaseQuery") {
		searchDatabase(q, res);
	} else {
		searchTwitter(q, res);
	}
});

function searchTwitter(q, res) {
	twitter.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
			res.send(data.statuses);
		}
	);
}

function searchDatabase(q, res) {

}

module.exports = router;