/**
 * @author Paul MacDonald
 */

var firstTime = true;

/**
 * A function that listens to clicks of buttons
 */
$(document).on("click", ".button", function () {
	//When a button on the form is clicked to submit, check the validity of the form
	var valid = $('#form')[0].checkValidity();
	if(valid) {
		hideSearch();
		//If it's valid, fade in the loading cover
		$('#cover').fadeIn(500);
		//Initiate the collection of variables
		getVariables(this.id);
		//If it's the first time a search has been run
		if(firstTime) {
			//Slide down the results section ready for the results
			$("#results").show("slide",{direction:"up"},1000);
			firstTime = false;
		}
	} else {
		//Imitate a submit click on the form so the HTML5 valid checker with give errors to the user
		$('<input type="submit">').hide().appendTo($('#form')).click().remove();
	}
});

function getVariables(type) {
	var data = {};
	if ($('#teamSearch').is(':checked')) {
		data.team = {'mentions': 'false'}
		data.team.value = $("#teamSelect").find(":selected").val();
		if(data.team.value=="other") {
			data.team.value = $("#teamInput").val();
		}
		if ($('#mentions').is(':checked')) {
			data.team.mentions = 'true';
		}
	}
	if ($('#playersSearch').is(':checked')) {
		data.players = [];
		$.each($("input[name=playerBox]"), function(i,value) {
			data.players[i] = {
				value: $(this).val()
			}
			if($(this).closest(".searchInput").find("#playerMentions").is(":checked")) {
				data.players[i].mentions = true;
			} else {
				data.players[i].mentions = false;
			}
		});
		data.playersandor = $("#players").find("select[name=andor]").find(":selected").val();
	}
	if ($('#hashtagSearch').is(':checked')) {
		data.hashtags = [];
		$.each($("input[name=hashtagBox]"), function(i,value) {
			data.hashtags[i] = {
				value: $(this).val()
			}
		});
		data.hashtagsandor = $("#hashtag").find("select[name=andor]").find(":selected").val();
	}
	if ($('#keywordSearch').is(':checked')) {
		data.keywords = [];
		$.each($("input[name=keywordBox]"), function(i,value) {
			data.keywords[i] = {
				value: $(this).val()
			}
		});
		data.keywordsandor = $("#keyword").find("select[name=andor]").find(":selected").val();
	}
	data.andor = $("#andOrToggle").val();
	callSearch(type,data);
}

function callSearch(type, data) {
	$.ajax({
		type: "POST",
		url: '/search/'+type,
		dataType: 'json',
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(data) {
			populateData(data);
		},
		error: function(data) {
			error(data);
		}
	})
}

/**
 * A function to display the error from getting the data if there is one
 * @param error the error that occured
 */
function error(error) {
	//Clear the tweets and analysis divs so we don't keep old searches
	$('#tweets,#analysis').empty();
	//Append the error message to both the tweets and analysis divs
	$('#tweets,#analysis').append("<div class='error'>"+error.responseText+"</div>");
	//Fade out the loading cover
	$('#cover').fadeOut(500);
}

/**
 * A function too iterate over the data and perform various functions
 * @param data the data containing tweets
 */
function populateData(data) {
	console.log(data);
	//Empty the tweets and analysis divs so we don't keep old searches
	$('#tweets,#analysis').empty();
	//Reset the analysis variables so old searches don't affect it
	analysisReset();
	//For each tweet
	$.each(data.statuses, function(i, tweet) {
		//Add it to the analysis and to the tweets div
		addToAnalysis(tweet);
		addTweet(i,tweet);
	});	
	//Fill the analysis div
	fillAnalysis();
	//Change any emojis into emojis on the page
	emoji();
	//Add markers to the map
	addMapMarkers(data.statuses);
	//Fade out the loading cover
	$('#cover').fadeOut(500);
	$('#tooltip').text("Database: "+data.metadata.database_results+", Twitter: "+data.metadata.twitter_results);
	$('#tooltip').fadeIn();
	$('#tooltip').delay(5000).fadeOut();
}

/**
 * A function that adds a given tweet to the analysis
 * @param tweet the tweet object to be added the the analysis
 */
function addToAnalysis(tweet) {
	//Get the tweets text and user screen name
	var text = tweet.text;
	var username = tweet.screen_name;
	var picture = tweet.profile_image;
	//If it was a retweet take that information instead
	if(tweet.rt_screen_name!=null) {
		var username = tweet.rt_screen_name;
		var picture = tweet.rt_profile_image;
	}
	var user = {
		username: username,
		picture: picture
	}
	//Count the words in the text
	var wordCount = countWords(text);
	//Add the word counts to the analysis for user and total count
	userWordCount(wordCount, user);
	addWordCountToTotalCount(wordCount, totalCount);
}

/**
 * A function which adds an individual tweet to the bottom of the tweets div
 * @param i the relative index of the tweet
 * @tweet an object containing all the info needed for the tweet
 */
function addTweet(i, tweet) {
	//Create a html string for the full tweet
	var HTML = "";
	HTML+="<div id='"+i+"' class='tweet'>";
	//Check if the tweet is a retweet or not
	if(tweet.rt_name != null) {
		//If so include the retweeted authors info
		HTML+="<div class='retweet'><div class='pictures'>"
			+"<a target='_blank' href='https://twitter.com/"
			+tweet.rt_screen_name
			+"'>"
			+"<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by "
			+"<span class='underline'>"+tweet.rt_name+"</span>"
			+" @"
			+tweet.rt_screen_name
			+"</div></a></div>";
	}
	//Add the main tweet body to the html string
	HTML+="<div class='pictures'><img class='profile' src='"
		+tweet.profile_image
		+"'/></div><div class='text'><div class='user'>"
		+"<a target='_blank' href='https://twitter.com/"
		+tweet.screen_name
		+"'><span class='underline'>"
		+tweet.name
		+"</span> <span class='handle'>@"
		+tweet.screen_name
		+"</span></a></div>"
		+"<div class='tweetContent'>"
		+tweet.text
		+"</div>";
	//Check if there is any media in the tweet
	if(tweet.media != null) {
		//If there is and there is more than one
		if(tweet.media.indexOf(',') > -1) {
			//split the urls (they are comma seperated)
			var urls = tweet.media.split(',')
		} else {
			//else create a list with the url in it
			var urls = [tweet.media];
		}
		//iterate through the urls list adding the media
		$.each(urls, function(j, media) {
				HTML+="<img class='media' src='"
					+media
					+"'/>";
		});
	}
	//Split the date to get individual bits of info
	var date = (tweet.created_at).split(' ');
	//Add the footer of the tweet (a link and the timestamp)
	HTML+="</div><a target='_blank' class='link' href='https://twitter.com/"
		+tweet.screen_name
		+"/status/"
		+tweet.tweet_id
		+"'><i class='fa fa-twitter'></i> Link to tweet</a>"
		+"<div class='time'>Published on "
		//Use some inline functions to make the date more readable and reorder
		+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
		+"</div>"
		+"</div></div>";
	//Append the full tweet to the tweets div
	$("#tweets").append(HTML);
}

/**
 * A function which fills the analysis div with information from analysis.js
 */
function fillAnalysis() {
	//Get the keywords and top users from the analysis
	var keywords = returnTopWords();
	var topUsers = returnTopUsers();
	var topHashtags = returnTopHashtags();
	//HTML for map
	var mapHTML = "<div id='map'></div>";
	//Create a HTML string for keywords
	var keywordsHTML = "<div id='keywords'><h2>Top 20 Keywords</h2>";
	$.each(keywords, function(i, keyword) {
		//Fill the string with each keyword
		keywordsHTML+="<div class='keywordBox'>"
			+"<div class='keyword'>"
			+keyword[0]
			+"</div><div class='quantity'>mentioned <span>"
			+keyword[1]
			+"</span> times</div></div>";
		//If all keywords have been processed then append the html to the analysis div
		if(i==keywords.length-1) {
			$("#analysis").append(keywordsHTML+"</div>");
		}
	});
	//Create a HTML string for the top users
	var topUsersHTML = "<div id='topUsers'><h2>Top 10 Users</h2>";
	$.each(topUsers, function(i, topUser) {
		//Fill the string with each top user and their info
		topUsersHTML += "<div class='userBox'><img class='profile' src='"
			+topUser.picture
			+"'/>"
			+"<div class='userHandle'>@"
			+topUser.handle
			+"</div><div class='noOfTweets'>tweeted <span>"
			+topUser.numTweets
			+"<span> times</div><div>Most frequent words:</div><div class='keywords'>";
		//For each possible keyword (max 5)
		for(var keyword=0;keyword<5;keyword++){
			//If the keyword exists then add it to the HTML
			if(topUser.wordList[keyword] != undefined) {
				topUsersHTML += "<div class='keyword'>"
					+topUser.wordList[keyword][0]
					+" ("
					+topUser.wordList[keyword][1]
					+")</div>";
			}
		}
		topUsersHTML += "</div></div>";	
		//If all the top users have been processed then append the html to the analysis div
		if(i==topUsers.length-1) {
			$('#analysis').append(topUsersHTML+"</div>");
		}
	});
	topHashtagsHTML = "<div id='topHashtags'><h2>Trending Hashtags</h2>";
	$.each(topHashtags, function(i, topHashtag) {
		topHashtagsHTML+= "<div class='keywordBox'>"
			+"<div class='keyword'>"
			+topHashtag[0]
			+"</div><div class='quantity'>mentioned <span>"
			+topHashtag[1]
			+"</span> times</div></div>"
		if(i==topHashtags.length-1) {
			$('#analysis').append(topHashtagsHTML+"</div>"+mapHTML);
		}
	});	
	initMap();
}


/*
* A function to initiate the map show in analysis
*/
function initMap() {
	geocoder = new google.maps.Geocoder();
	var mapDiv = document.getElementById('map');
	map = new google.maps.Map(mapDiv, {
		zoom: 4
	});
	google.maps.event.trigger(map, 'resize');
}

/*
* A function to add markers to the map shown in analysis
* @param data json containing tweets returned by query
*/
function addMapMarkers(data){
	$.each(data, function(i, tweet) {
		if (tweet.place_full_name != null){
			//Retrieve location based on place name & add marker to map
			geocoder.geocode( { 'address': tweet.place_full_name}, function(results, status) {
     				if (status == google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);
					var marker = new google.maps.Marker({
						map: map,
						position: results[0].geometry.location,
						title: tweet.text
					});
				}
			});
		}
	});
}
/**
 * A function to change any emoji's in the text into actual emoji's
 */
function emoji() {
	twemoji.size = '16x16';
	twemoji.parse(document.body);
}

/**
 * A function to change short day names into full day names
 * @param day short day name
 * @return full day name
 */
function day(day) {
	if(day == "Mon" || day == "Fri" || day == "Sun") {
		return day+"day"
	}
	if(day == "Tue") {
		return "Tuesday"
	}
	if(day == "Wed") {
		return "Wednesday"
	}
	if(day == "Thu") {
		return "Thursday"
	}
	if(day == "Sat") {
		return "Saturday"
	}
}

/**
 * A function to change shorts month names into full month names
 * @param month short month name
 * @return full month name
 */
function month(month) {
	if(month == "Jan") {
		return "January"
	}
	if(month == "Feb") {
		return "February"
	}
	if(month == "Mar") {
		return "March"
	}
	if(month == "Apr") {
		return "April"
	}
	if(month == "May") {
		return "May"
	}
	if(month == "Jun") {
		return "June"
	}
	if(month == "Jul") {
		return "July"
	}
	if(month == "Aug") {
		return "August"
	}
	if(month == "Sep") {
		return "September"
	}
	if(month == "Oct") {
		return "October"
	}
	if(month == "Nov") {
		return "November"
	}
	if(month == "Dec") {
		return "December"
	}
}