$(document).on("click", ".button", function () {
	var valid = $('#form')[0].checkValidity();
	if(valid) {
		$('#cover').fadeIn(500);
		getVariables(this.id);
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
	callSearch(type, query);
}

function callSearch(type, query) {
	$.get('/search',{ q: query, type: type }, fillTweets);
}

function fillTweets(data) {
	$('#tweets').empty();
	if(data.length > 0) {
		$.each(data, function(i, tweet) {
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