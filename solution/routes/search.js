/**
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module search
 */
var express = require('express');
var router = express.Router();
var twitter = require('../private/twit');
var pool = require('../private/sql');
var bigInt = require("big-integer");
//If the request is to query twitter and the database (as a cache)
router.post('/twitter', function(req, res) {
	//Parse the post data through queryParser to get sql and twitter strings
	queryParser(req.body, function(sqlQ, twitQ) {
		//Call databaseAndTwitter to retrieve the relevent data
		databaseAndTwitter(sqlQ, twitQ, function(err, data) {
			//If there is an error
			if (err) {
				//Give a server error status and send error text
				res.status(400)
					.send(err);
			} else {
				//Send the data
				res.send(data);
			}
		});
	});
});
//If the request is to query the database
router.post('/database', function(req, res) {
	//Parse the post data through queryParser to get sql and twitter strings
	queryParser(req.body, function(sqlQ, twitQ) {
		//Call databaseOnly to retrieve the relevent data
		databaseOnly(sqlQ, function(err, data) {
			//If there is an error
			if (err) {
				//Give a server error status and send error text
				res.status(400)
					.send(err);
			} else {
				//Send the data
				res.send(data);
			}
		});
	});
});
/**
 * A function to convert the post data into two strings, a where SQL statement and a twitter query
 * @param {object} q The query data from the post form
 * @param {queryParserCallback} callback the callback function
 */
function queryParser(q, callback) {
		//Initialise the variables
		var sqlQ = "",
			twitQ = "";
		//If there is a team specified
		if (q.team) {
			//Add the team handle to each query as author
			sqlQ += '((author.screen_name LIKE "' + q.team.value + '"' + ' OR retweeted_user.screen_name LIKE "' + q.team.value + '")';
			twitQ += "(from:" + q.team.value;
			//If we're searching for mentions to
			if (q.team.mentions == 'true') {
				//Add the team handle to each query as mentions
				sqlQ += ' OR tweets.text LIKE "%@' + q.team.value + '%"';
				twitQ += ' OR "@' + q.team.value + '"';
			}
			//Close the team statement
			sqlQ += ") " + q.andor + " ";
			twitQ += ") " + q.andor + " ";
		}
		//If there is a player(s) specified
		if (q.players) {
			//Open players statement
			sqlQ += "(";
			twitQ += "(";
			//For every player
			for (var int in q.players) {
				var player = q.players[int];
				//Add the player handle to each query as author
				sqlQ += '((author.screen_name LIKE "' + player.value + '"' + ' OR retweeted_user.screen_name LIKE "' + player.value + '")';
				twitQ += "(from:" + player.value;
				//If we're searching for mentions to
				if (player.mentions === true) {
					//Add the player handle to each query as mentions
					sqlQ += ' OR tweets.text LIKE "%@' + player.value + '%"';
					twitQ += ' OR "@' + player.value + '"';
				}
				sqlQ += ") " + q.playersandor + " ";
				twitQ += ") " + q.playersandor + " ";
			}
			//Remove the last and/or from each string
			sqlQ = sqlQ.substring(0, sqlQ.length - q.playersandor.length - 2);
			twitQ = twitQ.substring(0, twitQ.length - q.playersandor.length - 2);
			//Close the players statement
			sqlQ += ") " + q.andor + " ";
			twitQ += ") " + q.andor + " ";
		}
		//If there is a hastag(s) specified
		if (q.hashtags) {
			//Open the hashtags statement
			sqlQ += "(";
			twitQ += "(";
			//For every hashtag
			for (var int in q.hashtags) {
				var hashtag = q.hashtags[int];
				//Add the hashtag to each query
				sqlQ += "tweets.text LIKE '%#" + hashtag.value + "%'";
				twitQ += "\"#" + hashtag.value + "\"";
				sqlQ += " " + q.hashtagsandor + " ";
				twitQ += " " + q.hashtagsandor + " ";
			}
			//Remove the last and/or from each string
			sqlQ = sqlQ.substring(0, sqlQ.length - q.hashtagsandor.length - 2);
			twitQ = twitQ.substring(0, twitQ.length - q.hashtagsandor.length - 2);
			//Close the hashtags statement
			sqlQ += ") " + q.andor + " ";
			twitQ += ") " + q.andor + " ";
		}
		//If there is a keyword(s) specified
		if (q.keywords) {
			//Open the keywords statement
			sqlQ += "(";
			twitQ += "(";
			//For each keyword
			for (var int in q.keywords) {
				var keyword = q.keywords[int];
				//Add the keyword to each query
				sqlQ += 'tweets.text LIKE "%' + keyword.value + '%"';
				twitQ += "\"" + keyword.value + "\"";
				sqlQ += " " + q.keywordsandor + " ";
				twitQ += " " + q.keywordsandor + " ";
			}
			//Remove the last and/or from each string
			sqlQ = sqlQ.substring(0, sqlQ.length - q.keywordsandor.length - 2);
			twitQ = twitQ.substring(0, twitQ.length - q.keywordsandor.length - 2);
			//Close they keywords statement
			sqlQ += ") " + q.andor + " ";
			twitQ += ") " + q.andor + " ";
		}
		//Remove the last and/or from each string
		sqlQ = sqlQ.substring(0, sqlQ.length - q.andor.length - 2);
		twitQ = twitQ.substring(0, twitQ.length - q.andor.length - 2);
		//Check if retweets should be excluded
		if (q.rt === 'exclude') {
			//Exclude retweets
			sqlQ = "(" + sqlQ + ") AND retweeted_user.name IS NULL ";
			twitQ += " exclude:retweets";
		}
		//Callback with each string
		callback(sqlQ, twitQ);
	}
	/**
	 * This global callback is for the funcion queryParser
	 * @callback queryParserCallback
	 * @param {string} mysqlQ mysql WHERE string
	 * @param {string} twitQ twitter query string
	 */
/**
 * A function that provides database results only
 * @param {string} sqlQ the WHERE string for the database
 * @param {err-data} callback the callback function
 */
function databaseOnly(sqlQ, callback) {
		//Check if query is in database
		getDataFromDatabase(sqlQ, 0, function(err, data) {
			//If there was no error
			if (!err) {
				//Send the data
				var results = {
					statuses: data,
					metadata: {
						database_results: data.length,
						twitter_results: 0
					}
				};
				callback(undefined, results);
			} else {
				//Send the error
				callback(err, undefined);
			}
		});
	}
	/**
	 * This global callback provides an error/data response
	 * @callback err-data
	 * @param {string} error an error message or undefined if no error
	 * @param {object|string} data data of successful function
	 */
/**
 * A function that provides twitter and, if available, database results
 * @param {string} sqlQ the WHERE string for the database
 * @param {string} twitQ the twitter query
 * @param {err-data} callback the callback function
 */
function databaseAndTwitter(sqlQ, twitQ, callback) {
		//Get the data from the database
		getDataFromDatabase(sqlQ, 0, function(dberr, databaseData) {
			//If there was a database error
			if (dberr) {
				//Create an initial query from twitter (max 300)
				getDataFromTwitter(twitQ, "0", null, 300, [], function(twiterr, twitterData) {
					//If there is no error
					if (!twiterr) {
						//Send the data
						var results = {
							statuses: twitterData,
							metadata: {
								twitter_results: twitterData.length,
								database_results: 0
							}
						};
						callback(undefined, results);
						//Insert the data into the database
						insertData(twitterData);
					} else {
						//Send both errors
						callback(twiterr + " <br /> " + dberr, undefined);
					}
				});
			} else {
				//Get the maximum twitter id in the tweets from the database
				getMaxID(databaseData, function(max_id) {
					//Get the most recent tweets (since the ones in the db) from twitter (max 300)
					getDataFromTwitter(twitQ, max_id, null, 300, [], function(twiterr, twitterData) {
						//If there is no error
						var results;
						if (!twiterr) {
							//Send the database and twitter data concatenated
							results = {
								statuses: twitterData.concat(databaseData),
								metadata: {
									database_results: databaseData.length,
									twitter_results: twitterData.length
								}
							};
							callback(undefined, results);
							//Insert the new data into the database
							insertData(twitterData);
						} else {
							//Send just the database data
							results = {
								statuses: databaseData,
								metadata: {
									database_results: databaseData.length,
									twitter_results: 0
								}
							};
							callback(undefined, results);
						}
					});
				});
			}
		});
	}
/**
 * A function to insert data into the database
 * @param {object} tweets the data returned by twitter in the database format
 */
function insertData(data) {
		//Iterate through the data
		for (var j = 0; j < data.length; j++) {
			(function(i) {
				var tweet = data[i];
				//Get a connection to the database from the pool
				pool.getConnection(function(err, database) {
					//If there is no error
					if (!err) {
						//Get the datetime in a format YYYY-MM-DD HH:mm:SS to insert into the database
						var time = tweet.created_at_original.split(' ');
						var datetime = time[5] + "-" + month(time[1]) + "-" + time[2] + " " + time[3];
						//Create an object for the tweet data to insert
						var tweetData = {
							id_str: tweet.tweet_id,
							created_at: tweet.created_at,
							text: tweet.text,
							place_full_name: tweet.place_full_name,
							user_id_str: tweet.user_id,
							retweeted_user_id_str: tweet.rt_id,
							date: datetime
						};
						//Create a array for the userdata (as there could be two per tweet)
						var userData = [];
						//Add the data for the normal user
						userData.push([
							tweet.user_id,
							tweet.name,
							tweet.screen_name,
							tweet.profile_image
						]);
						//If the tweet was retweeted, add the retweeted users info
						if (tweet.rt_id) {
							userData.push([
								tweet.rt_id,
								tweet.rt_name,
								tweet.rt_screen_name,
								tweet.rt_profile_image
							]);
						}
						//Create a array for the media (as there could be multiple per tweet)					
						var media = [];
						//If there is media
						if (tweet.media != null) {
							//Split the media (comma seperated)
							tempList = tweet.media.split(",");
							//For the list of media, iterate through it
							for (var k = 0; k < tempList.length; k++) {
								//Push an object to the media array
								media.push([tempList[k], "photo", tweet.tweet_id]);
							}
						}
						//Insert all the data one after the other (as foreign keys are in operation)
						database.query('INSERT INTO users (id_str,name,screen_name,profile_image_url_https) VALUES ? ' + 'ON DUPLICATE KEY UPDATE name=VALUES(name),screen_name=VALUES(screen_name),profile_image_url_https=VALUES(profile_image_url_https)', [
								userData
							], function(err, res1) {
							if (!err) {
								database.query('INSERT INTO tweets SET ? ON DUPLICATE KEY UPDATE id_str=id_str', tweetData, function(err, res2) {
									if (!err) {
										//release this database connection as it may not be needed for media
										database.release();
										if (media.length != 0) {
											//use a new database connection for the media
											pool.query('INSERT INTO media (media_url_https,type,tweet_id_str) VALUES ? ' + 'ON DUPLICATE KEY UPDATE tweet_id_str=tweet_id_str', [media]);
										}
									}
								});
							}
						});
					}
				});
			})(j);
		}
	}
/**
 * A function to get the data from twitter from given params
 * @param {string} query the twitter query string
 * @param {string} since_id the id of the earliest tweet you want
 * @param {string} max_id the id of the most recent tweet you want
 * @param {int} max_no the maximum number of tweets to attempt to find (0 to keep going forever)
 * @param {data} data the data retrieved from previous twitter calls ([] to begin)
 * @param {err-data} callback the callback function
 */
function getDataFromTwitter(q, since_id, max_id, max_no, data, callback) {
		//If the maximum number has not been reached
		if (max_no === 0 || data.length < max_no) {
			//Set up parameters for the twitter query
			var params = {
				q: q,
				count: 100,
				result_type: "recent",
				since_id: since_id
			};
			//If max_id is set then add it to the query
			if (max_id != null) {
				params.max_id = max_id;
			}
			//Query twitter
			twitter.get('search/tweets', params, function(err, twitterData, response) {
				if (err) {
					//If there is an error then callback that there was an error
					console.log(err);
					callback("There was an error with the Twitter query", undefined);
				} else {
					//If there are no new tweets returned
					if (twitterData.statuses.length === 0 || (twitterData.statuses.length === 1 && twitterData.statuses[0].id_str === max_id)) {
						if (data.length > 0) {
							//Data has been returned, but not this time
							convertTwitterData(data, function(newData) {
								callback(undefined, newData);
							});
						} else {
							//No tweets were ever returned
							callback("No tweets were found", undefined);
						}
					} else {
						//New tweets were returned, get the new max_id
						getSinceID(twitterData.statuses, function(newMaxID) {
							//Take one from the max ID
							newMaxID = bigInt(newMaxID)
								.add(-1)
								.toString();
							//Concatenate the old and new data
							newData = data.concat(twitterData.statuses);
							//Call the function again with new params
							getDataFromTwitter(q, since_id, newMaxID, max_no, newData, callback);
						});
					}
				}
			});
		} else { //Max number of tweets reached
			//Convert it to database object format, slicing to the exact amount required
			convertTwitterData(data.slice(0, max_no), function(newData) {
				//Return the tweets
				callback(undefined, newData);
			});
		}
	}
/**
 * A function that gets the lowest ID in a set of tweets
 * @param {object} tweets The tweet data
 * @param {low-id} callback The callback function
 */
function getSinceID(data, callback) {
		//Set the lowest ID to null
		var lowestID = null;
		//For each tweet
		for (var i = 0; i < data.length; i++) {
			//If the ID is lower then replace it
			var id = data[i].id_str;
			if (lowestID === null || lowestID > id) {
				lowestID = id;
			}
			//If the end of the data then callback with lowestID found
			if (i + 1 == data.length) {
				callback(lowestID);
			}
		}
	}
	/**
	 * This global callback is for the funcion getSinceID
	 * @callback low-id
	 * @param {string} lowest_id the lowest ID in the set of tweets
	 */
/**
 * A function that gets the highest ID in a set of tweets
 * @param {object} tweets The tweet data
 * @param {high-id} callback The callback function
 */
function getMaxID(data, callback) {
		//Set the greatest ID to 0
		var greatestID = 0;
		//For each tweet
		for (var i = 0; i < data.length; i++) {
			//If the ID is higher then replace it
			var id = data[i].tweet_id;
			if (greatestID < id) {
				greatestID = id;
			}
			//If the end of the data then callback with highestID found
			if (i + 1 == data.length) {
				callback(greatestID);
			}
		}
	}
	/**
	 * This global callback is for the funcion getMaxID
	 * @callback high-id
	 * @param {string} highest_id the highest ID in the set of tweets
	 */
/**
 * A function which converts data recieved from twitter to the database friendly version
 * @param {object} tweets The tweets to convert
 * @param {database-tweets} callback The callback function
 */
function convertTwitterData(tweets, callback) {
		var newData = [];
		//For each tweet
		for (var i = 0; i < tweets.length; i++) {
			//Add an object in the newData list with the relevant info
			var tweet = tweets[i];
			var newTweet = {
				tweet_id: tweet.id_str,
				rt_name: null,
				rt_screen_name: null,
				rt_profile_image: null,
				media: null,
				created_at_original: tweet.created_at,
				place_full_name: null
			};
			//If tweet is retweeted
			if (tweet.retweeted_status != undefined) {
				//Add retweeted information
				newTweet.rt_id = tweet.user.id_str;
				newTweet.rt_name = tweet.user.name;
				newTweet.rt_screen_name = tweet.user.screen_name;
				newTweet.rt_profile_image = tweet.user.profile_image_url_https;
				//Change tweet variable to the retweeted status
				tweet = tweet.retweeted_status;
			}
			//Add the rest of the tweet information
			newTweet.user_id = tweet.user.id_str;
			newTweet.name = tweet.user.name;
			newTweet.screen_name = tweet.user.screen_name;
			newTweet.profile_image = tweet.user.profile_image_url_https;
			newTweet.text = tweet.text;
			newTweet.created_at = tweet.created_at;
			if (tweet.place != undefined) {
				newTweet.place_full_name = tweet.place.full_name;
			}
			//Check if there is any media in the tweet
			if (tweet.entities.media != undefined) {
				var tempList = [];
				//For each bit of media, add it to the temp list
				for (var j = 0; j < tweet.entities.media.length; j++) {
					tempList.push(tweet.entities.media[j].media_url_https);
				}
				//Add the list to the object as a comma seperated string
				newTweet.media = tempList.join(",");
			}
			newData[i] = newTweet;
		}
		callback(newData);
	}
	/**
	 * This global callback is for the funcion convertTwitterData
	 * @callback database-tweets
	 * @param {object[]} tweets the new set of tweets which have been converted
	 */
/**
 * A function which when given a month returns it's number
 * @param {string} month The short month
 * @returns {int} the month number
 */
function month(month) {
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
			"Oct", "Nov", "Dec"
		];
		for (var i = 0; i < months.length; i++) {
			if (month == months[i]) {
				return i + 1;
			}
		}
	}
/**
 * A function that gets the data from the database
 * @param {string} q The twitter query
 * @param {int} count The number of tweets to return
 * @param {err-data} callback The callback function
 */
function getDataFromDatabase(q, count, callback) {
	//Query the database returning only relevant info for each tweet
	pool.query('SELECT	tweets.id_str AS tweet_id,' + 'tweets.created_at AS created_at,' + 'tweets.text AS text,' + 'tweets.place_full_name AS place_full_name,' + 'author.`name` AS `name`,' + 'author.screen_name AS screen_name,' + 'author.profile_image_url_https AS profile_image,' + 'retweeted_user.`name` AS rt_name,' + 'retweeted_user.screen_name AS rt_screen_name,' + 'retweeted_user.profile_image_url_https AS rt_profile_image,' + 'GROUP_CONCAT(DISTINCT media.media_url_https) AS media ' + 'FROM tweets ' + 'INNER JOIN users AS author ON tweets.user_id_str = author.id_str ' + 'LEFT JOIN media ON media.tweet_id_str = tweets.id_str ' + 'LEFT JOIN users AS retweeted_user ON tweets.retweeted_user_id_str = retweeted_user.id_str ' + ((q.length > 0) ? 'WHERE ' + q : 'WHERE "true"="false"') + 'GROUP BY tweets.id_str ' + 'ORDER BY tweets.date DESC ' + ((count != 0) ? 'LIMIT ' + count : ''), function(err, results) {
		//If there is an error
		if (err) {
			//Log and return the error
			console.log(err);
			callback("There was an error connecting to the Database", undefined);
		} else if (results.length != 0) {
			//Callback the results of the database query
			callback(undefined, results);
		} else {
			//Return the error as no tweets were found
			callback("No tweets were found in the database", undefined);
		}
	});
}
module.exports = router;