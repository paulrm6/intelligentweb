function emoji() {
	twemoji.size = '16x16';
	twemoji.parse(document.body);
}
var firstTime = true;
$(document).on("click", ".button", function () {
	var valid = $('#form')[0].checkValidity();
	if(valid) {
		$('#cover').fadeIn(500);
		getVariables(this.id);
		if(firstTime) {
			$("#results").show("slide",{direction:"up"},1000);
		}
	} else {
		$('<input type="submit">').hide().appendTo($('#form')).click().remove();
	}
});
function getVariables(type) {
	var team = "";
	var players = "";
	var hashtag = "";
	var keyword = "";
	var query = "";
	var andor = " "+$("#andOrToggle").val()+" ";;
	if ($('#teamSearch').is(':checked')) {
		var teamname = $("#teamSelect").find(":selected").val();
		if(teamname=="other") {
			teamname = $("#teamInput").val();
		}
		team = '(from:@'+teamname;
		if ($('#mentions').is(':checked')) {
			team += ' OR "@'+teamname+'"';
		}
		team += ')'+andor;
	}
	if ($('#playersSearch').is(':checked')) {
		var andorPlayers = $("#players").find("select[name=andor]").find(":selected").val();
		var orderedList = getListAndOrder("playerBox");
		if(andorPlayers == undefined) {
			andorPlayers = "";
		}
		players = "(";
		$.each(orderedList, function(i,value) {
			players += '(from:"@'+value+'"';
			if($("#players").find("input").filter(function() {
				return this.value == value;
			}).closest(".searchInput").find("#playerMentions").is(":checked")) {
				players += " OR '@"+value+"'";
			};
			players += ") "+andorPlayers+" ";
		});
		players = players.substring(0,players.length - andorPlayers.length-2);
		players += ')'+andor;
	}
	if ($('#hashtagSearch').is(':checked')) {
		var andorHashtag = $("#hashtag").find("select[name=andor]").find(":selected").val();
		var orderedList = getListAndOrder("hashtagBox");
		if(andorHashtag == undefined) {
			andorHashtag = "";
		}
		hashtag = '(';
		$.each(orderedList, function(i,value) {
			hashtag += "#"+value+" "+andorHashtag+" ";
		});
		hashtag = hashtag.substring(0,hashtag.length - andorHashtag.length-2);
		hashtag += ')'+andor;
	}
	if ($('#keywordSearch').is(':checked')) {
		var andorKeyword = $("#keyword").find("select[name=andor]").find(":selected").val();
		var orderedList = getListAndOrder("keywordBox");
		if(andorKeyword == undefined) {
			andorKeyword = "";
		}
		keyword = '(';
		$.each(orderedList, function(i,value) {
			keyword += '"'+value+'" '+andorKeyword+" ";
		});
		keyword = keyword.substring(0,keyword.length - andorKeyword.length-2);
		keyword += ')'+andor
	}
	query = team+players+hashtag+keyword;
	query = query.substring(0,query.length - andor.length);

	callSearch(type, query);
}

function getListAndOrder(name) {
	var unordered = [];
	$("input[name="+name+"]").each(function() {
		unordered.push($(this).val());
	});
	return unordered.sort();
}

function callSearch(type, query) {
	$.get('/search',{ q: query, type: type })
		.done(populateData)
		.fail(error);
}

function error(error) {
	$('#tweets,#analysis').empty();
	$('#tweets,#analysis').append("<div class='error'>"+error.responseText+"</div>");
	$('#cover').fadeOut(500);
}

function populateData(data) {
	$('#tweets,#analysis').empty();
	analysisReset();
	$.each(data, function(i, tweet) {
		addToAnalysis(tweet);
		addTweet(i,tweet);
	});	
	fillAnalysis();
	emoji();
	$('#cover').fadeOut(500);
}

function addToAnalysis(tweet) {
	var text = tweet.text;
	var user = tweet.user.screen_name;
	var queryTerms = [];
	//pass query terms as a parameter to filter out the teamname for example and others if we wish
	var wordCount = countWords(text,queryTerms);
	userWordCount(wordCount, user);
	addWordCountToTotalCount(wordCount, totalCount);
}

function addTweet(i, tweet) {
	var HTML = "";
	HTML+="<div id='"+i+"' class='tweet'>";
	if(tweet.retweeted_status != undefined) {
		HTML+="<div class='retweet'><div class='pictures'>"
			+"<a target='_blank' href='https://twitter.com/"
			+tweet.user.screen_name
			+"'>"
			+"<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by "
			+"<span class='underline'>"+tweet.user.name+"</span>"
			+" @"
			+tweet.user.screen_name
			+"</div></a></div>";
		tweet = tweet.retweeted_status;
	}
	HTML+="<div class='pictures'><img class='profile' src='"
		+tweet.user.profile_image_url
		+"'/></div><div class='text'><div class='user'>"
		+"<a target='_blank' href='https://twitter.com/"
		+tweet.user.screen_name
		+"'><span class='underline'>"
		+tweet.user.name
		+"</span> <span class='handle'>@"
		+tweet.user.screen_name
		+"</span></a></div>"
		+"<div class='tweetContent'>"
		+tweet.text
		+"</div>";
	if(tweet.entities.media != undefined) {
		$.each(tweet.entities.media, function(j, media) {
			if(media.type == "photo") {
				HTML+="<img class='media' src='"
					+media.media_url_https
					+"'/>";
			}
		});
	}
	var date = (tweet.created_at).split(' ');
	HTML+="</div><a target='_blank' class='link' href='https://twitter.com/"
		+tweet.user.screen_name
		+"/status/"
		+tweet.id_str
		+"'><i class='fa fa-twitter'></i> Link to tweet</a>"
		+"<div class='time'>Published on "
		+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
		+"</div>"
		+"</div></div>";
	$("#tweets").append(HTML);
}

function fillAnalysis() {
	var topWords = returnTopWords();
	var topUsers = returnTopUsers();
	var keywordsHTML = "";
	var topUsersHTML = "";
	keywordsHTML += "<div id='keywords'><h2>Top 20 Keywords</h2>";
	for(var keyWord = 0; keyWord<topWords.length;keyWord++){
		keywordsHTML+="<div class='keywordBox'>"
			+"<div class='keyword'>"
			+topWords[keyWord][0]
			+"</div><div class='quantity'>mentioned <span>"
			+topWords[keyWord][1]
			+"</span> times</div></div>";
	}
	$("#analysis").append(keywordsHTML+"</div>");

	topUsersHTML += "<div id='topUsers'><h2>Top 10 Users</h2>";
	for(var topUser = 0; topUser<topUsers.length;topUser++){
		topUsersHTML += "<div class='userBox'>"
			+"<div class='userHandle'>@"
			+topUsers[topUser][0]
			+"</div><div class='noOfTweets'>tweeted <span>"
			+topUsers[topUser][1]
			+"<span> times</div><div>Most frequent words:</div><div class='keywords'>";
		for(var keyword=0;keyword<5;keyword++){
			if(topUsers[topUser][2][keyword] != undefined) {
				topUsersHTML += "<div class='keyword'>"
					+topUsers[topUser][2][keyword][0]
					+" ("
					+topUsers[topUser][2][keyword][1]
					+")</div>";
			}
		}
		topUsersHTML += "</div></div>";
	}
	$('#analysis').append(topUsersHTML+"</div>");	
}

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