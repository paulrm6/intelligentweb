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
			var id = data[0].id;
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
	queryDatabase(q, function(status, data) {
		if(status==true) {
			var id = data[0].id;
			var update = data[0].updatelink;
			//res.send(data);
		} //else {
			queryTwitter(q,null,function(status, data) {
				if(status) {
					res.send(data)
				} else {
					res.status(400).send(data);
				}
			});
		//}
	});
	//query database
	//query twitter for any new tweets since the most recent tweet
	//save any new tweets into the database
	//return combined data and stats
}

function queryTwitter(q, since, callback) {
	twitter.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
        	if(err) {
        		callback(false,"There was an error with the twitter query");
        	} else if(data.statuses.length>0) {
        		var meta = data.search_metadata;
        		var encodedQ = encodeURIComponent(q);
        		var searchesInfo = {query: encodedQ, max_id_str:meta.max_id_str, next_results: meta.next_results, refresh_url: meta.refresh_url};
        		database.query('INSERT INTO searches SET ? ON DUPLICATE KEY UPDATE max_id_str=VALUES(max_id_str),next_results=VALUES(next_results),refresh_url=VALUES(refresh_url)',searchesInfo);
        		for(var i=0;i<data.statuses.length;i++) {
        			var tweet = data.statuses[i];
        			var tweetInfo = {id_str: tweet.id_str}
        			if(tweet.retweeted_status != undefined) {
        				tweetInfo.retweeted_user_id_str = insertUser(tweet.user);
        				tweet = tweet.retweeted_status;
        			}
        			tweetInfo.created_at = tweet.created_at;
        			tweetInfo.text = tweet.text;
        			tweetInfo.user_id_str = insertUser(tweet.user);
    				database.query('INSERT INTO tweets SET ? ON DUPLICATE KEY UPDATE id_str=id_str',tweetInfo);
        			database.query('INSERT INTO tweet_search_link (tweet_id_str,searches_query) VALUES ("'
        				+tweetInfo.id_str+'","'+encodedQ+'") ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str');
        			if(tweet.entities.media != undefined) {
        				for(var j=0; j<tweet.entities.media.length;j++) {
        					var media = tweet.entities.media[j];
        					database.query('INSERT INTO media (media_url_https,type,tweet_id_str) VALUES ("'
        						+media.media_url_https+'","'+media.type+'","'+tweetInfo.id_str+'") ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str'
        					);
        				}
        			}
        		}
        		console.log(data.statuses[0].place.bounding_box.coordinates);
				callback(true, data.statuses);
        	} else {
        		callback(false,"Query returned no results, try changing the search options")
        	}
		}
	);
}

function insertUser(user) {
	var userInfo = {id_str: user.id_str, name: user.name, screen_name: user.screen_name, profile_image_url_https:user.profile_image_url_https};
	database.query('INSERT INTO users SET ? ON DUPLICATE KEY UPDATE '
		+'name=VALUES(name),screen_name=VALUES(screen_name),profile_image_url_https=VALUES(profile_image_url_https)',userInfo);
	return user.id_str;
}

function queryDatabase(q, callback) {
	database.query('SELECT * FROM searches WHERE `query` = "'+encodeURIComponent(q)+'"', function(err,results,fields) {
		if(err) {
			console.log(err);
		} else {
			if(results.length==0) {
				callback(false,results);
			} else {
				callback(true,results);
			}
		}
	});
	//if so get data from database and find most recent tweet
	//return all info
}

module.exports = router;