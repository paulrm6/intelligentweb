var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var pool = require('../private/sql');

router.get('/', function(req, res, next){
	var q = req.query.q;
	if(req.query.type=="databaseQuery") {
		databaseOnly(q, res);
	} else {
		databaseAndTwitter(q, res);
	}
});

function databaseOnly(q, res) {
	queryDatabase(q, function(status, data) {
		if(status==true) {
			getDataFromDatabase(q,300,function(data) {
				res.send(data);
			});
		} else {
			res.status(400).send("Query not in database, try changing the search options");
		}
	});
}

function databaseAndTwitter(q, res) {
	queryDatabase(q,function(status,meta_data) {
		if(status) {
			queryTwitter(q,meta_data[0].max_id_str,null,function(status, twitterData) {
				getDataFromDatabase(q,200,function(databaseData) {
					if(status) {
						res.send(twitterData.concat(databaseData));
					} else {
						res.send(databaseData);
					}
				});
			});
		} else {
			initialQuery(q,function(status, twitterData) {
				if(status) {
					res.send(twitterData);
				} else {
					res.status(400).send(twitterData);
				}
			});
		}
	});
}

function insertData(q, data, meta_data) {
	q = encodeURIComponent(q);
	var searchesData = {query: q, max_id_str:meta_data.max_id_str, next_results: meta_data.next_results, refresh_url: meta_data.refresh_url};
	pool.query('INSERT INTO searches SET ? ON DUPLICATE KEY UPDATE max_id_str=GREATEST(max_id_str, VALUES(max_id_str)),next_results=VALUES(next_results),refresh_url=VALUES(refresh_url)',searchesData,
		function(err,res1) {
			if(err) throw err;
			for(var j = 0;j<data.length;j++) {
				(function(i) {
				var tweet = data[i];
				pool.getConnection(function(err,database) {
					if(err) throw err;
					var time = tweet.created_at_original.split(' ');
					var datetime = time[5]+"-"+month(time[1])+"-"+time[2]+" "+time[3];
					var tweetData = {
						id_str: tweet.tweet_id,
						created_at: tweet.created_at,
						text: tweet.text,
						place_full_name: tweet.place,
						user_id_str: tweet.user_id,
						retweeted_user_id_str: tweet.rt_id,
						date: datetime
					}
					var userData = []
					userData.push([
						tweet.user_id,
						tweet.name,
						tweet.screen_name,
						tweet.profile_image
					]);
					if(tweet.rt_id) {
						userData.push([
							tweet.rt_id,
							tweet.rt_name,
							tweet.rt_screen_name,
							tweet.rt_profile_image
						]);
					}
					var media = []
					if(tweet.media != null) {
						tempList = tweet.media.split(",");
						for(var k=0;k<tempList.length;k++) {
							media.push([tempList[k],"photo",tweet.tweet_id]);
						}
					}
					var tweetLinkData = {
						tweet_id_str: tweet.tweet_id,
						searches_query: q
					}
					database.query('INSERT INTO users (id_str,name,screen_name,profile_image_url_https) VALUES ? '
						+'ON DUPLICATE KEY UPDATE name=VALUES(name),screen_name=VALUES(screen_name),profile_image_url_https=VALUES(profile_image_url_https)',[userData],
						function(err, res2) {
							if(err) throw err;
							database.query('INSERT INTO tweets SET ? ON DUPLICATE KEY UPDATE id_str=id_str',tweetData,
								function(err, res3) {
									if(err) throw err;
									database.query('INSERT INTO tweet_search_link SET ? ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str', tweetLinkData,
										function(err,res4) {
											database.release();
											if(media.length != 0) {
												pool.query('INSERT INTO media (media_url_https,type,tweet_id_str) VALUES ? '
													+'ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str',[media],
													function(err,res5) {
														if(err) throw err;
													}
												);
											}
										});
								});
						});
				});})(j);
			}
		}
	);
}

function initialQuery(q, callback) {
	queryTwitter(q, null, null, function(status,data1,meta_data1) {
		if(status) {
			queryTwitter(q, null, meta_data1.next_results.split("&")[0].split("=")[1], function(status,data2,meta_data2) {
				if(status) {
					queryTwitter(q, null, meta_data2.next_results.split("&")[0].split("=")[1], function(status,data3,meta_data3) {
						if(status) {
							var data = data1.concat(data2.concat(data3))
							callback(true,data,meta_data1)
						} else {
							callback(true,data1.concat(data2),meta_data1)
						}
					});
				} else {
					callback(true,data1,meta_data1)
				}
			});
		} else {
			callback(false,data1)
		}
	});
}

function queryTwitter(q, since_id, max_id, callback) {
	var params = {q: q,count: 100,result_type:"recent"}
	if(since_id != null) {
		params.since_id = since_id;
	}
	if(max_id != null) {
		params.max_id = max_id;
	}
	twitter.get('search/tweets', params,
        function(err, data, response) {
        	if(err) {
        		callback(false,"There was an error with the twitter query");
        	} else {
        		if(data.statuses.length>0) {
	        		var newData = [];
					for(var i=0;i<data.statuses.length;i++) {
						var tweet = data.statuses[i];
						newData[i] = {
							tweet_id: tweet.id_str,
							rt_name: null,
							rt_screen_name: null,
							rt_profile_image: null,
							media: null,
							created_at_original: tweet.created_at
						}
						if(tweet.retweeted_status != undefined) {
							newData[i].rt_id = tweet.user.id_str;
							newData[i].rt_name = tweet.user.name;
							newData[i].rt_screen_name = tweet.user.screen_name;
							newData[i].rt_profile_image = tweet.user.profile_image_url_https;
							tweet = tweet.retweeted_status
						}
						newData[i].user_id = tweet.user.id_str;
						newData[i].name = tweet.user.name;
						newData[i].screen_name = tweet.user.screen_name;
						newData[i].profile_image = tweet.user.profile_image_url_https;
						newData[i].text = tweet.text;
						newData[i].created_at = tweet.created_at;
						if(tweet.entities.media != undefined) {
							var tempList = []
							for(var j=0; j<tweet.entities.media.length; j++) {
								tempList.push(tweet.entities.media[j].media_url_https)
							}
							newData[i].media = tempList.join(",");
						}
					}
					callback(true,newData,data.search_metadata);
	        		insertData(q,newData,data.search_metadata);
        		} else {
        			callback(false,"Query returned no results, try changing the search options")
        		}
        	}
		}
	);
}

function month(month) {
	var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
	for(var i=1; i<13; i++) {
		if (month == months[i]) {
			return i;
		}
	}
}

function getDataFromDatabase(q, count, callback) {
	q = encodeURIComponent(q);
	pool.query('SELECT	tweets.id_str AS tweet_id,'
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
				+'WHERE tweet_search_link.searches_query="'+q+'" '
				+'GROUP BY tweets.id_str '
				+'ORDER BY tweets.date DESC '
				+'LIMIT '+count
				, function(err, results) {
					if(err) throw err;
					callback(results);
				});
}

function queryDatabase(q, callback) {
	var query = pool.query('SELECT * FROM searches WHERE `query` = "'+encodeURIComponent(q)+'"', function(err,result,fields) {
		if(err) {
			callback(false,"Error accessing the database");
		} else if(result.length==0) {
			callback(false,"Query not in database, try changing the search options");
		} else {
			callback(true,result);
		}
	});
}

module.exports = router;