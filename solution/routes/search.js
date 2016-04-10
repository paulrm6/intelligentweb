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
	queryTwitter(q,null,function(status, data) {
        		console.log("here3");
		if(status) {
        		console.log("here4");
			getDataFromDatabase(q, function(data) {
        		console.log("here5");
				res.send(data);
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
				callback(true,"none");
        	} else {
        		callback(false,"Query returned no results, try changing the search options")
        	}
		}
	);
}

function month(month) {
	console.log(month);
	var months = ["null","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
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
	/*var query = database.query('SELECT * FROM tweet_search_link JOIN tweets ON tweet_id_str=tweets.id_str JOIN users ON tweets.user_id_str=users.id_str WHERE `searches_query`="'+encodeURIComponent(q)+'" ORDER BY id DESC LIMIT 300',
		function(err, results) {
			if(err) throw err;
			for(var i=0; i<results.length;i++) {
				(function(i) {
				var row = results[results.length-i-1];
				console.log(row);
				data.push({});
				var tweet = data[i];
				tweet.id_str = row.tweet_id_str;
				tweet.created_at = row.created_at;
				tweet.text = row.text;
				tweet.place = {full_name:row.place_full_name};
				tweet.user = {id_str: row.user_id_str, name: row.name, screen_name: row.screen_name, profile_image_url_https: row.profile_image_url_https};
				if(row.retweeted_user_id_str != null) {
					database.query('SELECT * FROM users WHERE id_str="'+row.retweeted_user_id_str+'"', function(err,results,fields) {
						if(err) throw err;
						tweet.retweeted_status = {user: results};
					});
				}
				getMedia(row.tweet_id_str, function(media) {
						tweet.entities = {media: media}
						if(i===results.length-1) {
							callback(data);
						}
					}
				);
			})(i);
			}
		});
		*/
}

function getUser(id, callback) {
	var user = {};
	var userquery = database.query('SELECT * FROM users WHERE id_str="'+id+'"')
		.on('error', function(err) {
			throw err;
		})
		.on('result', function(userRow) {
			user.id_str = userRow.id_str;
			user.name = userRow.name;
			user.screen_name = userRow.screen_name;
			user.profile_image_url_https = userRow.profile_image_url_https;
		})
		.on('end',function() {
			callback(user);
		});
}

function getMedia(id, callback) {
	var media = [];
	database.query('SELECT * FROM media WHERE tweet_id_str="'+id+'"')
		.on('error',function(err) {throw err;})
		.on('result', function(mediaRow) {
			media.push({media_url_https: mediaRow.media_url_https, type: mediaRow.type});
		})
		.on('end',function() {
			callback(media);
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