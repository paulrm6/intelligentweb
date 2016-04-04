var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var database = require('../private/sql');

router.get('/', function(req, res, next){
	var q = req.query.q;
	var type = req.query.type;
	if(type=="databaseQuery") {
		databaseOnly(q, res);
	} else {
		databaseAndTwitter(q, res);
	}
});

function databaseOnly(q, res) {
	//check if query has been searched before
	//if so return tweets for that query
	//if not return an error
}

function databaseAndTwitter(q, res) {
	//query database
	//query twitter for any new tweets since the most recent tweet
	queryTwitter(q,null,function(data) {
		res.send(data)
	});
	//save any new tweets into the database
	//return combined data and stats
}

function queryTwitter(q, since, callback) {
	twitter.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
			callback(data.statuses);
		}
	);
}

function queryDatabase(q, callback) {
	//check if query has been searched before
	//if so get data from database and find most recent tweet
	//return all info
}

module.exports = router;