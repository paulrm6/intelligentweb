/**
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module ajax
 */

//Initiate some variables for functions
var firstTime = true

/**
 * A function that listens to clicks of buttons
 */
$(document)
	.on("click", ".button", function() {
		//When a button on the form is clicked to submit, check the validity of the form
		var valid = $('#form')[0].checkValidity();
		if (valid) {
			//If it's valid, fade in the loading cover
			$('#cover')
				.fadeIn(500);
			//Initiate the collection of variables
			getVariables(this.id);
			//If it's the first time a search has been run
			if (firstTime) {
				//Slide down the results section ready for the results
				$("#results")
					.show("slide", {
						direction: "up"
					}, 1000);
				firstTime = false;
			}
		} else {
			//Imitate a submit click on the form so the HTML5 valid checker with give errors to the user
			$('<input type="submit">')
				.hide()
				.appendTo($('#form'))
				.click()
				.remove();
		}
	});

/**
 * A function to collect the variables into an object to send to the search
 * @param {string} searchType the type of search
 */
function getVariables(type) {
		//Create the data variable
		var data = {rt:'include'};
		//If the team search section is enabled
		if ($('#teamSearch')
			.is(':checked')) {
			//Create a team object with mentions set to false
			data.team = {
					'mentions': 'false'
				};
				//Set the name of the team from the select box
			data.team.value = $("#teamSelect")
				.find(":selected")
				.val();
			if (data.team.value == "other") { //If the other box is enabled
				//Set the name of the team from the input box
				data.team.value = $("#teamInput")
					.val();
			}
			//If mentions are to be included
			if ($('#mentions')
				.is(':checked')) {
				//Set the mentions field to true
				data.team.mentions = 'true';
			}
		}
		//If the players search section is enabled
		if ($('#playersSearch')
			.is(':checked')) {
			//Create a list for the players
			data.players = [];
			//For each player box
			$.each($("input[name=playerBox]"), function(i, value) {
				//Set the player name
				data.players[i] = {
						value: $(this)
							.val()
					};
					//Set wether mentions are to be included
				if ($(this)
					.closest(".searchInput")
					.find("#playerMentions")
					.is(":checked")) {
					data.players[i].mentions = true;
				} else {
					data.players[i].mentions = false;
				}
			});
			//Set the and or for the players section
			data.playersandor = $("#players")
				.find("select[name=andor]")
				.find(":selected")
				.val() || "null";
		}
		//If the hashtags search section is enabled
		if ($('#hashtagSearch')
			.is(':checked')) {
			//Create a list for the hashtags
			data.hashtags = [];
			//For each hashtag box
			$.each($("input[name=hashtagBox]"), function(i, value) {
				//Set the hashtag value
				data.hashtags[i] = {
					value: $(this)
						.val()
				};
			});
			//Set the and or for the hashtags section
			data.hashtagsandor = $("#hashtag")
				.find("select[name=andor]")
				.find(":selected")
				.val() || "null";
		}
		//If the keywords search section is enabled
		if ($('#keywordSearch')
			.is(':checked')) {
			//Create a list for the keywords
			data.keywords = [];
			//For each keyword box
			$.each($("input[name=keywordBox]"), function(i, value) {
				//Set the keyword value
				data.keywords[i] = {
					value: $(this)
						.val()
				};
			});
			//Set the and or for the keywords section
			data.keywordsandor = $("#keyword")
				.find("select[name=andor]")
				.find(":selected")
				.val() || "null";
		}
		//Set the and/or for the whole search
		data.andor = $("#andOrToggle")
			.val();
		if (!$('#includeRT').is(':checked')) {data.rt = 'exclude';}
		//Initiate the search
		callSearch(type, data);
	}

/**
 * A function to query the search api
 * @param {string} searchType the type of search
 * @param {object} data the variables submitted in the form
 */
function callSearch(type, data) {
		//Create an ajax http request
		$.ajax({
			type: "POST", //Set type to post
			url: '/search/' + type, //Set url depending on search type
			//The datatype and content type should be json
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(data), //Add the data, in a string format
			success: function(data) { //on success (200)
				//Initiate data population
				populateData(data);
			},
			error: function(data) { //on error
				//Initiate error population
				error(data);
			}
		});
	}

/**
 * A function to display the error from getting the data if there is one
 * @param {string} error the error message
 */
function error(error) {
		//Clear the tweets and analysis divs so we don't keep old searches
		$('#tweets, #topUsers, #topKeywords, #topHashtags')
			.empty();
		initMap();
		//Append the error message to both the tweets and analysis divs
		$('#tweets')
			.append("<div class='error'>" + error.responseText + "</div>");
		//Fade out the loading cover
		$('#cover')
			.fadeOut(500);
	}

/**
 * A function to iterate over the data and perform various functions
 * @param {object} data the data containing tweets
 */
function populateData(data) {
		//Hides the search bar
		hideSearch();
		//Empty the tweets and analysis divs so we don't keep old searches
		$('#tweets')
			.empty().append("<h2 class='resultBox'>Tweets</h2>");
		//Reset the analysis variables so old searches don't affect it
		analysisReset();
		//For each tweet
		initMap();
		$.each(data.statuses, function(i, tweet) {
			//Add it to the analysis and to the tweets div
			addToAnalysis(tweet);
			addTweet(i, tweet);
			addMapMarkers(i, tweet);
		});
		//Fill the analysis div
		fillAnalysis();
		//Change any emojis into emojis on the page
		emoji();
		//Add markers to the map
		//Fade out the loading cover
		$('#cover')
			.fadeOut(500);
		//Fade in and out a tooltip giving meta-data
		$('#tooltip')
			.text("Database: " + data.metadata.database_results + ", Twitter: " + data.metadata
				.twitter_results)
			.fadeIn()
			.delay(5000)
			.fadeOut();
	}

/**
 * A function that adds a given tweet to the analysis
 * @param {object} tweet the tweet object to be added the the analysis
 */
function addToAnalysis(tweet) {
		//Get the user info
		var user = {
				username: tweet.screen_name,
				picture: tweet.profile_image
			};
			//Count the words in the text
		var wordCount = countWords(tweet.text);
		//Add the word counts to the analysis for user and total count
		userWordCount(wordCount, user);
		addWordCountToTotalCount(wordCount, totalCount);
	}

/**
 * A function which adds an individual tweet to the bottom of the tweets div
 * @param {int} i the relative index of the tweet
 * @tweet {object} tweet the tweet to be added
 */
function addTweet(i, tweet) {
		var author= tweet.screen_name; 
		//Create a html string for the full tweet
		var HTML = "";
		HTML += "<div id='" + i + "' class='resultBox' author='"+author+"'>";
		//Check if the tweet is a retweet or not
		if (tweet.rt_name !== null) {
			//If so include the retweeted authors info
			HTML += "<div class='retweet'><div class='pictures'>" +
				"<a target='_blank' href='https://twitter.com/" + tweet.rt_screen_name +
				"'>" + "<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by " +
				"<span class='underline'>" + tweet.rt_name + "</span>" + " @" + tweet.rt_screen_name +
				"</div></a></div>";
		}
		//Add the main tweet body to the html string
		HTML += "<div class='pictures'><img class='profile' src='" + tweet.profile_image +
			"'/></div><div class='text'><div class='user'>" +
			"<a target='_blank' href='https://twitter.com/" + tweet.screen_name +
			"'><span class='underline'>" + tweet.name + "</span> <span class='handle'>@" +
			tweet.screen_name + "</span></a></div>" + "<div class='tweetContent'>" +
			tweet.text + "</div>";
		//Check if there is any media in the tweet
		if (tweet.media !== null) {
			var urls;
			//If there is and there is more than one
			if (tweet.media.indexOf(',') > -1) {
				//split the urls (they are comma seperated)
				urls = tweet.media.split(',');
			} else {
				//else create a list with the url in it
				urls = [tweet.media];
			}
			//iterate through the urls list adding the media
			$.each(urls, function(j, media) {
				HTML += "<img class='media' src='" + media + "'/>";
			});
		}
		//Split the date to get individual bits of info
		var date = (tweet.created_at)
			.split(' ');
		//Add the footer of the tweet (a link and the timestamp)
		HTML += "</div><a target='_blank' class='link' href='https://twitter.com/" +
			tweet.screen_name + "/status/" + tweet.tweet_id +
			"'><i class='fa fa-twitter'></i> Link to tweet</a>" +
			"<div class='time'>Published on "
			//Use some inline functions to make the date more readable and reorder
			+ day(date[0]) + " the " + date[2] + " of " + month(date[1]) + " " + date[5] +
			" at " + date[3] + "</div>" + "</div></div>";
		//Append the full tweet to the tweets div
		$("#tweets")
			.append(HTML);
	}

/**
 * A function which fills the analysis div
 */
function fillAnalysis() {
		//Get the keywords and top users from the analysis
		var keywords = returnTopWords();
		var topUsers = returnTopUsers();
		var topHashtags = returnTopHashtags();
		//Create a HTML string for the top users
		var topUsersHTML = "<h2 class='resultBox'>Top 10 Users</h2>";
		//For each top user
		$.each(topUsers, function(i, topUser) {
			//Fill the string with each top user and their info
			topUsersHTML += "<div class='resultBox'>"
				+"<div class='pictures'><img src='"
					+topUser.picture
				+ "'/></div>"
				+"<div class='text'>"
					+"<div class='userHandle'><a target='_blank' href='https://twitter.com/"+topUser.handle+"'>@" + topUser.handle + "</a>"
					+"<span class='noOfTweets'>tweeted <strong>" + topUser.numTweets +"</strong> times</span></div>"
					+"<div>Most frequent words:</div>"
					+"<div class='topUserKeywords'>";
			//For each possible keyword (max 5)
			for (var keyword = 0; keyword < 5; keyword++) {
				//If the keyword exists then add it to the HTML
				if (topUser.wordList[keyword] !== undefined) {
					topUsersHTML += "<div class='topUserkeyword'>" + topUser.wordList[keyword][0] +
						" (" + topUser.wordList[keyword][1] + ")</div>";
				}
			}
			topUsersHTML += "</div></div>"
				+"<div author='"+topUser.handle+"' class='link'><i class='fa fa-filter' aria-hidden='true'></i> See the Tweets</div>"
				+"</div>";
		});
		//Create a HTML string for keywords
		var keywordsHTML = "<h2 class='resultBox'>Top 20 Keywords</h2>";
		//For each top keyword
		$.each(keywords, function(i, keyword) {
			//Fill the string with each keyword
			keywordsHTML += "<div class='resultBox'>" + "<div class='keyword'>" +
				keyword[0] + "</div><div class='quantity'>mentioned <strong>" + keyword[1] +
				"</strong> times</div></div>";
		});
		//Create a HTML string for the top hashtags
		topHashtagsHTML = "<h2 class='resultBox'>Trending Hashtags</h2>";
		//For each top hashtag
		$.each(topHashtags, function(i, topHashtag) {
			//Fill the string with each top hashtag and it's info
			topHashtagsHTML += "<div class='resultBox'>" + "<div class='keyword'>" +
				topHashtag[0] + "</div><div class='quantity'>mentioned <strong>" +
				topHashtag[1] + "</strong> times</div></div>";
				//If all the top hashtags have been processed then append the html to the analysis div
			if (i == topHashtags.length - 1) {
			}
		});
		$('#topHashtags').empty().append(topHashtagsHTML);
		$('#topKeywords').empty().append(keywordsHTML);
		$('#topUsers').empty().append(topUsersHTML);
	}

$(document).on('click','#topUsers .link',function() {
	var author = $(this).attr('author');
	filterTweets(author);
})

function filterTweets(userHandle, id) {
	$('#tweets h2').html("Tweets <span>(<i class='fa fa-filter' aria-hidden='true'></i> Filtered - click to reset)");
	$('#tweets div.resultBox').hide();
	if(userHandle) {
		$('#tweets div.resultBox[author='+userHandle+']').show();
	} else {
		$('#tweets div.resultBox#'+id).show();
	}
}

/*
 * A function to initiate the map to show in analysis
 */
function initMap() {
		geocoder = new google.maps.Geocoder();
		var mapDiv = document.getElementById('map');
		//Create a map
		map = new google.maps.Map(mapDiv, {
			zoom: 4
		});
		google.maps.event.trigger(map, 'resize');
		map.setCenter(new google.maps.LatLng(53.381, -1.470))
	}

/**
 * A function to add markers to the map shown in analysis
 * @param {object} data the tweets to add to the map
 */
function addMapMarkers(i, tweet) {
	//If the tweet has a location
	if (tweet.place_full_name != null) {
		//Retrieve location based on place name & add marker to map
		geocoder.geocode({
			'address': tweet.place_full_name
		}, function(results, status) {
			//If that got the address
			if (status == google.maps.GeocoderStatus.OK) {
				//Add the marker to the map
				var marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location,
					title: tweet.place_full_name
				});
				//Create a listener for when the marker is clicked to filter the tweets
				marker.addListener('click', function() {
					filterTweets(undefined,i);
				});
			}
		});
	}
}
$(document).on('click','h2 span',function() {
	$(this).remove();
	$('#tweets div.resultBox').show();
})

/**
 * A function to change any emoji's in the text into actual emoji's
 */
function emoji() {
		twemoji.size = '16x16';
		twemoji.parse(document.body);
	}

/**
 * A function to change short day names into full day names
 * @param {string} day short day name
 * @returns {string} full day name
 */
function day(day) {
		if (day == "Mon" || day == "Fri" || day == "Sun") {
			return day + "day";
		}
		if (day == "Tue") {
			return "Tuesday";
		}
		if (day == "Wed") {
			return "Wednesday";
		}
		if (day == "Thu") {
			return "Thursday";
		}
		if (day == "Sat") {
			return "Saturday";
		}
	}

/**
 * A function to change shorts month names into full month names
 * @param {string} month short month name
 * @returns {string} full month name
 */
function month(month) {
	if (month == "Jan") {
		return "January";
	}
	if (month == "Feb") {
		return "February";
	}
	if (month == "Mar") {
		return "March";
	}
	if (month == "Apr") {
		return "April";
	}
	if (month == "May") {
		return "May";
	}
	if (month == "Jun") {
		return "June";
	}
	if (month == "Jul") {
		return "July";
	}
	if (month == "Aug") {
		return "August";
	}
	if (month == "Sep") {
		return "September";
	}
	if (month == "Oct") {
		return "October";
	}
	if (month == "Nov") {
		return "November";
	}
	if (month == "Dec") {
		return "December";
	}
}