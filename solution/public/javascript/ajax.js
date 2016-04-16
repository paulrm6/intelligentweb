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
		//If it's valid, fade in the loading cover
		$('#cover').fadeIn(500);
		//Initiate the collection of variables
		getVariables(this.id);
		//If it's the first time a search has been run
		if(firstTime) {
			//Slide down the results section ready for the results
			$("#results").show("slide",{direction:"up"},1000);
		}
	} else {
		//Imitate a submit click on the form so the HTML5 valid checker with give errors to the user
		$('<input type="submit">').hide().appendTo($('#form')).click().remove();
	}
});

/**
 * A function which creates the query from the inputs on the form
 * @param type the type of search
 */
function getVariables(type) {
	//Create strings for each input section
	var team = "";
	var players = "";
	var hashtag = "";
	var keyword = "";
	var query = "";
	//Get the andor value for between each section
	var andor = " "+$("#andOrToggle").val()+" ";;
	//Get the team name (if it's enabled)
	if ($('#teamSearch').is(':checked')) {
		//Get the selected value for the select box
		var teamname = $("#teamSelect").find(":selected").val();
		//If it's other then get the value from the input box
		if(teamname=="other") {
			teamname = $("#teamInput").val();
		}
		//Add the team to the team string
		team = '(from:'+teamname;
		//If including mentions box is checked then include the mentions
		if ($('#mentions').is(':checked')) {
			team += ' OR "@'+teamname+'"';
		}
		team += ')'+andor;
	}
	//Get the players (if enabled)
	if ($('#playersSearch').is(':checked')) {
		//Get the andor value for between each players
		var andorPlayers = $("#players").find("select[name=andor]").find(":selected").val();
		//If it's undefined set it to nothing
		if(andorPlayers == undefined) {
			andorPlayers = "";
		}
		//Get the ordered list of players from the playerBox's
		var orderedList = getListAndOrder("playerBox");
		players = "(";
		//For each ordered player
		$.each(orderedList, function(i,value) {
			//Add the player to the player string
			players += '(from:'+value;
			//Find the box after the input for this value and see if it's checked
			if($("#players").find("input").filter(function() {
				return this.value == value;
			}).closest(".searchInput").find("#playerMentions").is(":checked")) {
				//If so, include mentions
				players += ' OR "@'+value+'"';
			};
			players += ") "+andorPlayers+" ";
		});
		//Remove the extra andor on the end of the string
		players = players.substring(0,players.length - andorPlayers.length-2);
		players += ')'+andor;
	}
	//Get the hashtags (if enabled)
	if ($('#hashtagSearch').is(':checked')) {
		//Get the andor value for between each hashtags
		var andorHashtag = $("#hashtag").find("select[name=andor]").find(":selected").val();
		//If it's undefined set it to nothing
		if(andorHashtag == undefined) {
			andorHashtag = "";
		}
		//Get the ordered list of hashtags from the hashtagBox's
		var orderedList = getListAndOrder("hashtagBox");
		hashtag = '(';
		//For each ordered hashtag, insert the value into the hashtag string
		$.each(orderedList, function(i,value) {
			hashtag += '"#'+value+'" '+andorHashtag+" ";
		});
		//Remove the extra andor on the end of the string		
		hashtag = hashtag.substring(0,hashtag.length - andorHashtag.length-2);
		hashtag += ')'+andor;
	}
	//Get the keywords (if enabled)
	if ($('#keywordSearch').is(':checked')) {
		//Get the andor value for between each keywords
		var andorKeyword = $("#keyword").find("select[name=andor]").find(":selected").val();
		//If it's undefined set it to nothing
		if(andorKeyword == undefined) {
			andorKeyword = "";
		}
		//Get the ordered list of keywords from the keywordBox's
		var orderedList = getListAndOrder("keywordBox");
		keyword = '(';
		//For each ordered keyword, insert the value into the keyword string
		$.each(orderedList, function(i,value) {
			keyword += '"'+value+'" '+andorKeyword+" ";
		});
		//Remove the extra andor on the end of the string	
		keyword = keyword.substring(0,keyword.length - andorKeyword.length-2);
		keyword += ')'+andor;
	}
	//Combine each section string together
	query = team+players+hashtag+keyword;
	query = query.substring(0,query.length - andor.length);
	//Search for the query with the given type
	callSearch(type, query);
}

/**
 * A function to get the input boxes with the same name and order their values alphabetically
 * @param name the name of the input boxes to find
 * @return the sorted list of values
 */
function getListAndOrder(name) {
	var unordered = [];
	//For each input box with the name push the value to our list
	$("input[name="+name+"]").each(function() {
		unordered.push($(this).val());
	});
	return unordered.sort();
}

/**
 * A function to get the data from the /search page
 * @param type the type of query, either database or twitter
 * @param query the sorted query from the form
 */
function callSearch(type, query) {
	//Get the data from the search and either call error if there is an error, or populate the data
	$.get('/search',{ q: query, type: type })
		.done(populateData)
		.fail(error);
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
	//addMapMarkers(data.statuses);
	//Fade out the loading cover
	$('#cover').fadeOut(500);
}

/**
 * A function that adds a given tweet to the analysis
 * @param tweet the tweet object to be added the the analysis
 */
function addToAnalysis(tweet) {
	//Get the tweets text and user screen name
	var text = tweet.text;
	var user = tweet.screen_name;
	//If it was a retweet take that information instead
	if(tweet.rt_screen_name!=null) {
		var user = tweet.rt_screen_name;
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
		topUsersHTML += "<div class='userBox'>"
			+"<div class='userHandle'>@"
			+topUser[0]
			+"</div><div class='noOfTweets'>tweeted <span>"
			+topUser[1]
			+"<span> times</div><div>Most frequent words:</div><div class='keywords'>";
		//For each possible keyword (max 5)
		for(var keyword=0;keyword<5;keyword++){
			//If the keyword exists then add it to the HTML
			if(topUser[2][keyword] != undefined) {
				topUsersHTML += "<div class='keyword'>"
					+topUser[2][keyword][0]
					+" ("
					+topUser[2][keyword][1]
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
	//initMap();
}


/*
* A function to initiate the map show in analysis
*/
function initMap() {
	geocoder = new google.maps.Geocoder();
	var mapDiv = document.getElementById('map');
	map = new google.maps.Map(mapDiv, {
		center: {lat: 52.776186, lng: -1.713867},
		zoom: 5
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