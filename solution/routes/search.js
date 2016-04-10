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
	queryTwitter(q,null,function(status, twitterData) {
		if(status) {
			getDataFromDatabase(q, function(data) {
				res.send(data.concat(twitterData));
			});
		} else {
			res.status(400).send(data);
		}
	});
	//query database
	//query twitter for any new tweets since the most recent tweet
	//save any new tweets into the database
	//return combined data and stats
}

function insertData(q, data) {
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
		var time = tweet.created_at.split(' ')
		var datetime = time[5]+"-"+month(time[1])+"-"+time[2]+" "+time[3];
		console.log(datetime);
		tweetInfo.date = datetime;
		tweetInfo.created_at = tweet.created_at;
		tweetInfo.text = tweet.text;
		tweetInfo.user_id_str = insertUser(tweet.user);
		if(tweet.place != undefined) {
			tweetInfo.place_full_name = tweet.place.full_name;
		}
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

}

function queryTwitter(q, since, callback) {
	twitter.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
        	if(err) {
        		callback(false,"There was an error with the twitter query");
        	} else if(data.statuses.length>0) {
        		var newData = [];
				for(var i=0;i<data.statuses.length;i++) {
					var tweet = data.statuses[i];
					newData[i] = {
						tweet_id: tweet.id_str,
						rt_name: null,
						rt_screen_name: null,
						rt_profile_image: null,
						media: null
					}
					if(tweet.retweeted_status != undefined) {
						newData[i].rt_name = tweet.user.name;
						newData[i].rt_screen_name = tweet.user.screen_name;
						newData[i].rt_profile_image = tweet.user.profile_image_url_https;
						tweet = tweet.retweeted_status
					}
					newData[i].name = tweet.user.name;
					newData[i].screen_name = tweet.user.screen_name;
					newData[i].profile_image = tweet.user.profile_image_url_https;
					newData[i].text = tweet.text;
					newData[i].created_at = tweet.created_at;
				}
				callback(true,newData);
        		insertData(q,data);
        	} else {
        		callback(false,"Query returned no results, try changing the search options")
        	}
		}
	);
}

function month(month) {
	console.log(month);
	var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
	for(var i=1; i<13; i++) {
		if (month == months[i]) {
			return i;
		}
	}
}

function getDataFromDatabase(q, callback) {
	var query = database.query('SELECT	tweets.id_str AS tweet_id,'
										+'tweets.created_at AS created_at,'
										+'tweets.text AS text,'
										+'tweets.place_full_name AS place,'
										+'author.`name` AS `name`,'
										+'author.screen_name AS screen_name,'
										+'author.profile_image_url_https AS profile_image,'
										+'retweeted_user.`name` AS rt_name,'
										+'retweeted_user.screen_name AS rt_screen_name,'
										+'retweeted_user.profile_image_url_https AS rt_profile_image,'
										+'GROUP_CONCAT(DISTINCT media.media_url_https) AS media '
								+'FROM 	tweet_search_link '
								+'INNER JOIN tweets ON tweet_search_link.tweet_id_str=tweets.id_str '
								+'INNER JOIN users AS author ON tweets.user_id_str = author.id_str '
								+'LEFT JOIN media ON media.tweet_id_str = tweets.id_str '
								+'LEFT JOIN users AS retweeted_user ON tweets.retweeted_user_id_str = retweeted_user.id_str '
								+'WHERE tweet_search_link.searches_query="'+encodeURIComponent(q)+'" '
								+'GROUP BY tweets.id_str '
								+'ORDER BY tweets.date DESC '
								+'LIMIT 300'
								, function(err, results) {
									if(err) throw err;
									callback(results);
								});
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
				getDataFromDatabase(q, function(data) {
					callback(true,data);
				});
			}
		}
	});
	//if so get data from database and find most recent tweet
	//return all info
}

module.exports = router;