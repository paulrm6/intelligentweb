$(document).on("click", ".button", function () {
	var valid = $('#form')[0].checkValidity();
	if(valid) {
		submitted(this.id);
	} else {
		$('<input type="submit">').hide().appendTo($('#form')).click().remove();
	}
});

function submitted(type) {
	alert(type);
	$('#cover').fadeIn(500);
	var team = "";
	var players = "";
	var hashtag = "";
	var keyword = "";
	var query = "";
	var andor = " "+$("#andOrToggle").val()+" ";;
	if ($('#teamSearch').is(':checked')) {
		var teamname = $("#teamInput").val();
		team = '(from:@'+teamname;
		if ($('#mentions').is(':checked')) {
			team += ' OR "@'+teamname+'"';
		}
		team += ')'+andor;
	}
	if ($('#playersSearch').is(':checked')) {
		players = "(";
		$("input[name=playerBox]").each(function () {
			if($(this).val() != "") {
				players += "(from:@"+$(this).val();
				if($(this).closest(".searchInput").find("#playerMentions").is(":checked")) {
					players += ' OR "@'+$(this).val()+'"';
				}
				players += ") "+$("#playerandor").val()+" ";
			}
		});
		players = players.substring(0,players.length - $("#playerandor").val().length-2);
		players += ')'+andor;
	}
	if ($('#hashtagSearch').is(':checked')) {
		hashtag = '(';
		$("input[name=hashtagBox]").each(function () {
			if($(this).val() != "") {
				hashtag += "#"+$(this).val()+" "+$("#hashtagandor").val()+" ";
			}
		});
		hashtag = hashtag.substring(0,hashtag.length - $("#hashtagandor").val().length-2);
		hashtag += ')'+andor;
	}
	if ($('#keywordSearch').is(':checked')) {
		keyword = '(';
		$("input[name=keywordBox]").each(function () {
			if($(this).val() != "") {
				keyword += '"'+$(this).val()+'" '+$("#keywordandor").val()+" ";
			}
		});
		keyword = keyword.substring(0,keyword.length - $("#keywordandor").val().length-2);
		keyword += ')'+andor
	}
	query = team+players+hashtag+keyword;
	query = query.substring(0,query.length - andor.length);
	$.get('/search',{ q: query }, function(data) {
		$('#tweets').empty();
		if(data.length > 0) {
			$.each(data, function(i, tweet) {

				var text = tweet.text;
				var user = tweet.user.screen_name;
				var wordCount = countWords(text);

				//Should combine these into a single function....probs
				userWordCount(wordCount, user);
				addWordCountToTotalCount(wordCount, totalCount);

				$('#tweets').append("<div id='"+i+"' class='tweet'>"
					+ (tweet.retweeted_status != undefined ? 
						"<div class='retweet'><div class='pictures'>"
						+"<a target='_blank' href='https://twitter.com/"
						+tweet.user.screen_name
						+"'>"
						+"<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by "
						+"<span class='underline'>"+tweet.user.name+"</span>"
						+" @"
						+tweet.user.screen_name
						+"</div></a></div>" : ""
					)
				);
				if(tweet.retweeted_status != undefined) {
					tweet = tweet.retweeted_status;
				}
				$('#'+i).append("<div class='pictures'><img class='profile' src='"
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
					+"</div>");
				if(tweet.entities.media != undefined) {
					$.each(tweet.entities.media, function(j, media) {
						if(media.type == "photo") {
							$('#'+i).append("<img class='media' src='"
								+media.media_url_https
								+"'/><div class='clear'></div>");
						}
					});
				}
				var date = (tweet.created_at).split(' ');
				$('#'+i).append("<a target='_blank' class='link' href='https://twitter.com/"
					+tweet.user.screen_name
					+"/status/"
					+tweet.id_str
					+"'><i class='fa fa-twitter'></i> Link to tweet</a>"
					+"<div class='time'>Published on "
					+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
					+"</div>"
					+"</div></div>");
					$('#cover').fadeOut(500);
			});	
		} else {
			$('#tweets').append("<div class='tweet error'>No tweets found! Try changing the search criteria!</div>");
			$('#cover').fadeOut(500);
		}

		var topWords = returnTopWords();
		var topUsers = returnTopUsers();

		$('#analysis').append("<br>"
			+"<div>"
			+"<h2> Top 20 Keywords </h2>"
			+"<br>"
			+"<ul>")
			;
		for(var keyWord = 0; keyWord<topWords.length;keyWord++){
			$('#analysis').append("<li>"
				+topWords[keyWord][0]
				+" : "
				+topWords[keyWord][1]
				+"</li>"
				);
		}
		$('#analysis').append("</ul></div>");



		$('#analysis').append("<br>"
			+"<div>"
			+"<h2> Top 10 Users:Number of Tweets:Top Keywords</h2>"
			+"<br>"
			+"<ul>")
			;
		for(var topUser = 0; topUser<topUsers.length;topUser++){
			$('#analysis').append("<li>"
				+topUsers[topUser][0]
				+" : "
				+topUsers[topUser][1]
				+"<br>");
			
			for(var keyword=0;keyword<5;keyword++){
				$('#analysis').append(
					topUsers[topUser][2][keyword][0]
					+" , "
					);
			}
			
			$('#analysis').append("<li>");
		}
		$('#analysis').append("</ul></div>");


		console.log(returnTopWords());
		console.log(returnTopUsers());
	});
}

function day(day) {
	if(day == "Mon") {
		return "Monday"
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
	if(day == "Fri") {
		return "Friday"
	}
	if(day == "Sat") {
		return "Saturday"
	}
	if(day == "Sun") {
		return "Sunday"
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



/**

Tweet Analysis
Alex Burley

**/


//Each unique word and it's number of appeareances in the collection
var totalCount = {};
//The list of users and their tweets
var users = {};
//Unused but will probably not want to return 20 keywords for each user
var numKeyWords = 20;


//Returns an object for a given a tweet containing each unique word and it's number of occurences within the text
function countWords(text){

	console.log(text);
	var	wordCount = {};
	var tokens = text.match(/\S+/g);
	

	for(var x = 0;x<tokens.length;x++){
		if (wordCount[tokens[x]]){
			wordCount[tokens[x]] += 1;
		}
    	else {
    	wordCount[tokens[x]] = 1;
		} 
	}

	return wordCount
}


//Should probably rename
//Void function to add the wordCount for each tweet to the total count.
function addWordCountToTotalCount(wordCount,totalCount){

	//console.log(wordCount);
	//console.log(totalCount);

	Object.keys(wordCount).forEach(function(key,index) {

		//console.log(key)

	    // key: the name of the object key
	    // index: the ordinal position of the key within the object 

	    if (totalCount[key]){
	    	totalCount[key] += wordCount[key];
	    }
	    else{
	    	totalCount[key] = wordCount[key];
	    }
	});
}


//Sorts a given list of words and values, returning the 20 most common words
function sortWordCount(wordList){

	var sortedCount = []

	for (word in wordList){
		sortedCount.push([word,wordList[word]]);
	}
	return sortedCount.sort(function(a,b) {
								return b[1] - a[1];
							})
								.slice(0,20); //CHECK FOR SIZE HERE
}


//Populates the users variable with each users number of tweets, their total word/value pairs and the username as a string
function userWordCount(wordCount, user){

	if (!users[user]){
		users[user] = {
			numTweets:0,
			wordList:{},
			handle:user //May want to change this to the "@format"
		};
	}

	users[user].numTweets += 1;

	Object.keys(wordCount).forEach(function(key,index) {

		if (users[user].wordList[key]){
			users[user].wordList[key] += wordCount[key];
		}
		else {
			users[user].wordList[key] = wordCount[key];
		}

	});
}



//Returns the top 10 most active users and their 20 most commonly used words as a sorted array
function returnTopUsers(){
	var topUsers = [];
	//console.log(users);

	for (user in users){
		topUsers.push([users[user].handle,users[user].numTweets,users[user].wordList]);
	}

	topUsers = topUsers.sort(function(a,b){
							return b[1]-a[1];
							})
								.slice(0,10); //CHECK FOR SIZE


	for (var i = 0; i<topUsers.length; i++){
		topUsers[i][2] = sortWordCount(topUsers[i][2]);
	}

	return topUsers;

}

function returnTopWords(){
	return sortWordCount(totalCount);
}