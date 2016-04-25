var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var pool = require('../private/sql');

/*
 * @author Paul MacDonald
 */

//If the request is to query twitter
router.get('/twitter', function(req,res,next){
	var q = req.query.q;
	databaseAndTwitter(q, function(err,data) {
		if(err) {
			res.status(400).send(err);
		} else {
			res.send(data);
		}
	});
});

//If the request is to query the database
router.get('/database', function(req, res, next){
	var q = req.query.q;
	databaseOnly(q, function(err,data) {
		if(err) {
			res.status(400).send(err);
		} else {
			res.send(data);
		}
	});
});

/**
 * A function that provides database results only
 * @param q the query for the database
 * @param res the response to the HTTP request
 */
function databaseOnly(q, callback) {
	//Check if query is in database
	queryDatabase(q, function(status, data) {
		if(status==true) {
			//If query is in database get the most recent 300 tweets
			getDataFromDatabase(q,0,function(status,data) {
				if(status) {
					//Send the data
					var results = {
						statuses: data,
						metadata: {
							database_results:data.length,
							twitter_results:0
						}
					}
					callback(undefined,results);
				} else {
					callback(data,undefined);
				}
			});
		} else {
			//Query is not in databse, return an error and the reason for the browser to display
			callback(data,undefined);
		}
	});
}

/**
 * A function that provides twitter and, if available, database results
 * @param q the query for the database
 * @param res the response to the HTTP request
 */
function databaseAndTwitter(q, callback) {
	//Checks if the query is in the database
	queryDatabase(q,function(status,meta_data) {
		if(status) { //If it is
			//Query twitter with the max id in the database (so as not to retrieve duplicates)
			recursiveTwitterQuery(q,meta_data[0].max_id_str, null, 300,[], function(twitStatus, twitterData) {
				//Get the most recent 200 tweets in the database
				getDataFromDatabase(q,0,function(dbStatus,databaseData) {
					if(twitStatus&&dbStatus) {
						//If all okay with twitter query and db query, send the data concatenated
						var results = {
							statuses: twitterData.concat(databaseData),
							metadata: {
								database_results:databaseData.length,
								twitter_results:twitterData.length
							}
						}
						callback(undefined,results);
	        			insertData(q,twitterData);
					} else if(twitStatus) {
						//Else send just the twitter data
						var results = {
							statuses: twitterData,
							metadata: {
								database_results:0,
								twitter_results:twitterData.length
							}
						}
						callback(undefined,results);
	        			insertData(q,twitterData);
					} else if(dbStatus) {
						//Else send just the database data
						var results = {
							statuses: databaseData,
							metadata: {
								database_results:databaseData.length,
								twitter_results:0
							}
						}
						callback(undefined,results);
					} else {
						//Else give an error
						callback(twitterData+" "+databaseData,undefined);
					}
				});
			});
		} else { // If it isn't
			//Start an initial query from twitter
			recursiveTwitterQuery(q,"0",null,300,[],function(status,tweets) {
				if(status) {
					var results = {
						statuses: tweets,
						metadata: {
							twitter_results:tweets.length,
							database_results:0
						}
					}
					callback(undefined,results);
	        		insertData(q,tweets);
				} else {
					callback(tweets,undefined);
				}
			});
		}
	});
}

/**
 * A function to insert data into the database
 * @param q the query used to query twitter
 * @param the data returned by twitter (in  reduced format)
 * @param the meta_data returned from the twitter query
 */
function insertData(q, data) {
	//Encode the query
	q = encodeURIComponent(q);
	//Create an object of the data to insert into the searches table
	getMaxID(data,function(max_id) {
		var searchesData = {query: q, max_id_str:max_id};
		//Insert the searches data into the searches table, on duplicate keys update the information
		pool.query('INSERT INTO searches SET ? ON DUPLICATE KEY UPDATE max_id_str=VALUES(max_id_str)',searchesData,
			function(err,res1) {
				//If there is an error, throw it
				if(!err) {
					//Iterate through the data
					for(var j = 0;j<data.length;j++) {
						(function(i) {
						var tweet = data[i];
						//Get a connection to the database from the pool
						pool.getConnection(function(err,database) {
							//If there is an error, throw it
							if(!err) {
								//Get the datetime in a format YYYY-MM-DD HH:mm:SS to insert into the database
								var time = tweet.created_at_original.split(' ');
								var datetime = time[5]+"-"+month(time[1])+"-"+time[2]+" "+time[3];
								//Create an object for the tweet data to insert
								var tweetData = {
									id_str: tweet.tweet_id,
									created_at: tweet.created_at,
									text: tweet.text,
									place_full_name: tweet.place_full_name,
									user_id_str: tweet.user_id,
									retweeted_user_id_str: tweet.rt_id,
									date: datetime
								}
								//Create a array for the userdata (as there could be two per tweet)
								var userData = []
								//Add the data for the normal user
								userData.push([
									tweet.user_id,
									tweet.name,
									tweet.screen_name,
									tweet.profile_image
								]);
								//If the tweet was retweeted, add the retweeted users info
								if(tweet.rt_id) {
									userData.push([
										tweet.rt_id,
										tweet.rt_name,
										tweet.rt_screen_name,
										tweet.rt_profile_image
									]);
								}
								//Create a array for the media (as there could be multiple per tweet)					
								var media = []
								//If there is media
								if(tweet.media != null) {
									//Split the media (comma seperated)
									tempList = tweet.media.split(",");
									//For the list of media, iterate through it
									for(var k=0;k<tempList.length;k++) {
										//Push an object to the media array
										media.push([tempList[k],"photo",tweet.tweet_id]);
									}
								}
								//Create an object for the data to be inserted into tweet_search_link
								var tweetLinkData = {
									tweet_id_str: tweet.tweet_id,
									searches_query: q
								}
								//Insert all the data one after the other (as foreign keys are in operation)
								database.query('INSERT INTO users (id_str,name,screen_name,profile_image_url_https) VALUES ? '
									+'ON DUPLICATE KEY UPDATE name=VALUES(name),screen_name=VALUES(screen_name),profile_image_url_https=VALUES(profile_image_url_https)',[userData],
									function(err, res2) {
										if(!err) {
											database.query('INSERT INTO tweets SET ? ON DUPLICATE KEY UPDATE id_str=id_str',tweetData,
												function(err, res3) {
													if(!err) {
														database.query('INSERT INTO tweet_search_link SET ? ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str', tweetLinkData,
															function(err,res4) {
																//release this database connection as it may not be needed for media
																database.release();
																if(!err) {
																	if(media.length != 0) {
																		//use a new database connection for the media
																		pool.query('INSERT INTO media (media_url_https,type,tweet_id_str) VALUES ? '
																			+'ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str',[media]);
																	}
																}
															});
													}
												});
										}
									});
							}
						});})(j);
					}
				}
			}
		);

	});
}


function recursiveTwitterQuery(q, since_id, max_id, max_no, data, callback) {
	if(max_no==0 || data.length < max_no) {
		//Set up parameters for the twitter query
		var params = {
			q: q,
			count: 100,
			result_type:"recent",
			since_id:since_id
		}
		//If max_id is set then add it to the query
		if(max_id != null) {
			params.max_id = max_id;
		}
		//Query twitter
		twitter.get('search/tweets', params,
	        function(err, twitterData, response) {
	        	if(err) {
	        		//If there is an error then callback that there was an error
	        		console.log(err);
	        		callback(false,"There was an error with the Twitter query");
	        	} else {
	        		//If there is one or more tweets returned
	        		if(twitterData.statuses.length==0 || (twitterData.statuses.length==1 && twitterData.statuses[0].id_str==max_id)) {
	        			if(data.length>0) {
	        				//Data has been returned, but not this time
	        				convertTwitterData(data,function(newData) {
	        					callback(true,newData);
	        				});
	        			} else {
	        				callback(false,"No tweets were found");
	        			}
	        		} else {
	        			getSinceID(twitterData.statuses, function(newMaxID) {
	        				newData = data.concat(twitterData.statuses);
	        				recursiveTwitterQuery(q,since_id,newMaxID,max_no,newData,callback);

	        			});
	        		}
	        	}
			}
		);
	} else {
		convertTwitterData(data.slice(0,max_no),function(newData) {
			callback(true,newData);
		});
	}
}

function getSinceID(data, callback) {
	var lowestID = null;
	for(var i=0;i<data.length;i++) {
		var id = data[i].id_str;
		if(lowestID==null || lowestID>id) {
			lowestID=id;
		}
		if(i+1==data.length) {
			callback(lowestID);
		}
	}
}

function getMaxID(data, callback) {
	var greatestID = 0;
	for(var i=0;i<data.length;i++) {
		var id = data[i].tweet_id;
		if(greatestID<id) {
			greatestID=id;
		}
		if(i+1==data.length) {
			callback(greatestID);
		}
	}
}

function convertTwitterData(tweets, callback) {
	var newData = [];
	//For each tweet
	for(var i=0;i<tweets.length;i++) {
		//Add an object in the newData list with the relevant info
		var tweet = tweets[i];
		var newTweet = {
			tweet_id: tweet.id_str,
			rt_name: null,
			rt_screen_name: null,
			rt_profile_image: null,
			media: null,
			created_at_original: tweet.created_at,
			place_full_name:null
		};
		//If tweet is retweeted
		if(tweet.retweeted_status != undefined) {
			//Add retweeted information
			newTweet.rt_id = tweet.user.id_str;
			newTweet.rt_name = tweet.user.name;
			newTweet.rt_screen_name = tweet.user.screen_name;
			newTweet.rt_profile_image = tweet.user.profile_image_url_https;
			//Change tweet variable to the retweeted status
			tweet = tweet.retweeted_status
		}
		//Add the rest of the tweet information
		newTweet.user_id = tweet.user.id_str;
		newTweet.name = tweet.user.name;
		newTweet.screen_name = tweet.user.screen_name;
		newTweet.profile_image = tweet.user.profile_image_url_https;
		newTweet.text = tweet.text;
		newTweet.created_at = tweet.created_at;
		if(tweet.place!=undefined) {
			newTweet.place_full_name = tweet.place.full_name;
		}
		//Check if there is any media in the tweet
		if(tweet.entities.media != undefined) {
			var tempList = []
			//For each bit of media, add it to the temp list
			for(var j=0; j<tweet.entities.media.length; j++) {
				tempList.push(tweet.entities.media[j].media_url_https)
			}
			//Add the list to the object as a comma seperated string
			newTweet.media = tempList.join(",");
		}
		newData[i] = newTweet;
	}
	
	callback(newData);
}

/**
 * A function which when given a month returns it's number
 * @param month The short month
 * @return the month number
 */
function month(month) {
	var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
	for(var i=0; i<months.length; i++) {
		if (month == months[i]) {
			return i+1;
		}
	}
}

/**
 * A function that gets the data from the database
 * @param q the twitter query
 * @param count the number of tweets to return
 */
function getDataFromDatabase(q, count, callback) {
	//Encode the query
	q = encodeURIComponent(q);
	//Query the database returning only relevant info for each tweet
	pool.query('SELECT	tweets.id_str AS tweet_id,'
				+'tweets.created_at AS created_at,'
				+'tweets.text AS text,'
				+'tweets.place_full_name AS place_full_name,'
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
				+((count!=0) ? 'LIMIT '+count : '')
				, function(err, results) {
					//If there is an error
					if(err) {
						callback(false,results)
					} else {
						//Callback the results of the database query
						callback(true,results);
					}
				});
}

/**
 * A function that checks to see if a query has been stored in the database before
 */
function queryDatabase(q, callback) {
	//Query the searches table in the database for any results with the right query
	pool.query('SELECT * FROM searches WHERE `query` = "'+encodeURIComponent(q)+'"', function(err,result,fields) {
		if(err) {
			//If error, callback error
			callback(false,"Error accessing the database");
		} else if(result.length==0) {
			//If no results then query is not in database
			callback(false,"Query not in database, try changing the search options");
		} else {
			//Query is in database - return the metadata
			callback(true,result);
		}
	});
}

module.exports = router;