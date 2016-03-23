function submitted() {
	$('#cover').fadeIn(500);
	var search = "";
	var user = "";
	var query = ""
	if ($('#keywordSearch').is(':checked')) {
		search += '(';
		$("input[name=search_terms]").each(function () {
			if($(this).val() != "") {
				search += $(this).val()+" "+$("#searchtermsandor").val()+" ";
			}
		});
		search += ')'
	}
	if ($('#userSearch').is(':checked')) {
		var username = $("#username").val();
		user = '(from:@'+username;
		if ($('#mentions').is(':checked')) {
			user += ' OR "@'+username+'"';
		}
		user += ')';
	}
	query = user+" "+$("#userandorsearch").val()+" "+search;
	$.get('/search',{ q: query }, function(data) {
		$('#results').empty();
		$('#results').append("<div class='tweet header'>Tweets</div>");
		if(data.length > 0) {
			$.each(data, function(i, tweet) {
				var date = tweet.created_at.split(' ');
				$('#results').append("<div id='"+i+"' class='tweet'>"
					+ (tweet.retweeted_status != undefined ? 
						"<div class='retweet'><div class='pictures'>"
						+"<a target='_blank' href='https://twitter.com/"
						+tweet.user.screen_name
						+"'>"
						+"<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by "
						+"<span class='underline'>"+tweet.user.name+"</span>"
						+" @"
						+tweet.user.screen_name
						//+" on "
						//+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
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
					+"<div class='text'>"
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
			$('#results').append("<div class='tweet error'>No tweets found! Try changing the search criteria!</div>");
			$('#cover').fadeOut(500);
		}
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