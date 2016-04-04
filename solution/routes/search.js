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
	queryDatabase(q, function(status, data) {
		if(status==true) {
			//database has searched that query return data
			res.send(data);
		} else {
			res.status(400).send("Query not in database, try changing the search options");
		}
	});
	//check if query has been searched before
	//if so return tweets for that query
	//if not return an error
}

function databaseAndTwitter(q, res) {
	//query database
	//query twitter for any new tweets since the most recent tweet
	queryTwitter(q,null,function(status, data) {
		if(status) {
			res.send(data)
		} else {
			res.status(400).send("Query returned no results, try changing the search options");
		}
	});
	//save any new tweets into the database
	//return combined data and stats
}

function queryTwitter(q, since, callback) {
	twitter.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
        	if(data.statuses.length>0) {
				callback(true, data.statuses);
        	} else {
        		callback(false)
        	}
		}
	);
}

function queryDatabase(q, callback) {
	callback(false,"some data");
	//check if query has been searched before
	//if so get data from database and find most recent tweet
	//return all info
}

module.exports = router;