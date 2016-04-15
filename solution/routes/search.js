var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var pool = require('../private/sql');

/*
 * @author Paul MacDonald
 */

//Gets the query sent to it
router.get('/', function(req, res, next){
	var q = req.query.q;
	//Checks the type of query
	if(req.query.type=="databaseQuery") {
		//If query is only for database
		databaseOnly(q, res);
	} else {
		//If query is for twitter
		databaseAndTwitter(q, res);
	}
});

/**
 * A function that provides database results only
 * @param q the query for the database
 * @param res the response to the HTTP request
 */
function databaseOnly(q, res) {
	//Check if query is in database
	queryDatabase(q, function(status, data) {
		if(status==true) {
			//If query is in database get the most recent 300 tweets
			getDataFromDatabase(q,300,function(status,data) {
				if(status) {
					//Send the data
					res.send(data);
				} else {
					res.status(400).send(data);
				}
			});
		} else {
			//Query is not in databse, return an error and the reason for the browser to display
			res.status(400).send(data);
		}
	});
}

/**
 * A function that provides twitter and, if available, database results
 * @param q the query for the database
 * @param res the response to the HTTP request
 */
function databaseAndTwitter(q, res) {
	//Checks if the query is in the database
	queryDatabase(q,function(status,meta_data) {
		if(status) { //If it is
			//Query twitter with the max id in the database (so as not to retrieve duplicates)
			queryTwitter(q,meta_data[0].max_id_str,null,function(status, twitterData) {
				//Get the most recent 200 tweets in the database
				getDataFromDatabase(q,200,function(dbStatus,databaseData) {
					if(status&&dbStatus) {
						//If all okay with twitter query and db query, send the data concatenated
						res.send(twitterData.concat(databaseData));
					} else if(status) {
						//Else send just the twitter data
						res.send(twitterData);
					} else if(dbStatus) {
						//Else send just the database data
						res.send(databaseData);
					} else {
						//Else give an error
						res.status(400).send(twitterData+" "+databaseData)
					}
				});
			});
		} else { // If it isn't
			//Start an initial query from twitter
			initialQuery(q,function(status, twitterData) {
				if(status) {
					//If status is okay, send data
					res.send(twitterData);
				} else {
					//Else send error and error response
					res.status(400).send(twitterData);
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
function insertData(q, data, meta_data) {
	//Encode the query
	q = encodeURIComponent(q);
	//Create an object of the data to insert into the searches table
	var searchesData = {query: q, max_id_str:meta_data.max_id_str, next_results: meta_data.next_results, refresh_url: meta_data.refresh_url};
	//Insert the searches data into the searches table, on duplicate keys update the information
	pool.query('INSERT INTO searches SET ? ON DUPLICATE KEY UPDATE max_id_str=GREATEST(max_id_str, VALUES(max_id_str)),next_results=VALUES(next_results),refresh_url=VALUES(refresh_url)',searchesData,
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
}

/**
 * A function that returns, where available, 300 tweets from twitter as this is the first time this search is being made
 * @param q the twitter query
 * @param callback the callback function
 */
function initialQuery(q, callback) {
	//query twitter for the first time, returning the most recent tweets
	queryTwitter(q, null, null, function(status,data1,meta_data1) {
		//If it returned 100 tweets and an okay status
		if(status && data1.length==100) {
			//query twitter for a second time using the min id of the previous search as a max id in the new search
			queryTwitter(q, null, meta_data1.next_results.split("&")[0].split("=")[1], function(status,data2,meta_data2) {
				//If it returned 100 tweets and an okay status
				if(status && data2.length==100) {
					//query twitter for a third time using the min id of the previous search as a max id in the new search
					queryTwitter(q, null, meta_data2.next_results.split("&")[0].split("=")[1], function(status,data3,meta_data3) {
						if(status) {
							//If all okay then return all the data
							var data = data1.concat(data2.concat(data3))
							callback(true,data,meta_data1)
						} else {
							//Else return just the last two datas
							callback(true,data1.concat(data2),meta_data1)
						}
					});
				} else {
					//Else just return data1
					callback(true,data1,meta_data1)
				}
			});
		} else if (status) {
			//Return just data1
			callback(true,data1,meta_data1)
		} else {
			//Return false and error
			callback(false,data1)
		}
	});
}

/**
 * A function that queries twitter and returns only the necersary data
 * @param q the twitter query
 * @param since_id the lowest ID returned in the results
 * @param max_id the highest ID returned in the results
 */
function queryTwitter(q, since_id, max_id, callback) {
	//Set up parameters for the twitter query
	var params = {q: q,count: 100,result_type:"recent"}
	//If since_id is set then add it to the query
	if(since_id != null) {
		params.since_id = since_id;
	}
	//If max_id is set then add it to the query
	if(max_id != null) {
		params.max_id = max_id;
	}
	//Query twitter
	twitter.get('search/tweets', params,
        function(err, data, response) {
        	if(err) {
        		//If there is an error then callback that there was an error
        		callback(false,"There was an error with the twitter query");
        	} else {
        		//If there is one or more tweets returned
        		if(data.statuses.length>0) {
	        		var newData = [];
	        		//For each tweet
					for(var i=0;i<data.statuses.length;i++) {
						//Add an object in the newData list with the relevant info
						var tweet = data.statuses[i];
						newData[i] = {
							tweet_id: tweet.id_str,
							rt_name: null,
							rt_screen_name: null,
							rt_profile_image: null,
							media: null,
							created_at_original: tweet.created_at,
							place_full_name:null
						}
						//If tweet is retweets
						if(tweet.retweeted_status != undefined) {
							//Add retweeted information
							newData[i].rt_id = tweet.user.id_str;
							newData[i].rt_name = tweet.user.name;
							newData[i].rt_screen_name = tweet.user.screen_name;
							newData[i].rt_profile_image = tweet.user.profile_image_url_https;
							//Change tweet variable to the retweeted status
							tweet = tweet.retweeted_status
						}
						//Add the rest of the tweet information
						newData[i].user_id = tweet.user.id_str;
						newData[i].name = tweet.user.name;
						newData[i].screen_name = tweet.user.screen_name;
						newData[i].profile_image = tweet.user.profile_image_url_https;
						newData[i].text = tweet.text;
						newData[i].created_at = tweet.created_at;
						if(tweet.place!=undefined) {
							newData[i].place_full_name = tweet.place.full_name;
						}
						//Check if there is any media in the tweet
						if(tweet.entities.media != undefined) {
							var tempList = []
							//For each bit of media, add it to the temp list
							for(var j=0; j<tweet.entities.media.length; j++) {
								tempList.push(tweet.entities.media[j].media_url_https)
							}
							//Add the list to the object as a comma seperated string
							newData[i].media = tempList.join(",");
						}
					}
					//Callback the data and search metadata
					callback(true,newData,data.search_metadata);
					//Insert the data into the database
	        		insertData(q,newData,data.search_metadata);
        		} else {
        			//No tweets were returned
        			callback(false,"Query returned no results, try changing the search options")
        		}
        	}
		}
	);
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