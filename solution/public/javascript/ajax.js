function submitted() {
	var search_comma = $("#search_terms").val()
	var search_and = search_comma.replace(/\,/g,'&');
	$.get('/search',{ user: $("#user").val(), search: search_and}, function(data) {
		//console.log(data);
		$('#results').empty();
		if(data.length > 0) {
			$.each(data, function(i, tweet) {
				var date = tweet.created_at.split(' ');
				$('#results').append("<div id='"+i+"' class='tweet'>"
					+ (tweet.retweeted_status != undefined ? 
						"<div class='retweet'><div class='pictures'>"
						+"<a href='https://twitter.com/"
						+tweet.user.screen_name
						+"'>"
						+"<i class='fa fa-retweet'></i></div><div class='text'>Retweeted by "
						+"<span class='underline'>"+tweet.user.name+"</span>"
						+" @"
						+tweet.user.screen_name
						//+" on "
						//+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
						+"</div></a></div>" : "")
					);
				if(tweet.retweeted_status != undefined) {
					tweet = tweet.retweeted_status;
				}
				$('#'+i).append("<div class='pictures'><img class='profile' src='"
					+tweet.user.profile_image_url
					+"'/></div><div class='text'><div class='user'>"
					+"<a href='https://twitter.com/"
					+tweet.user.screen_name
					+"'><span class='underline'>"
					+tweet.user.name
					+"</span> <span class='handle'>"
					+tweet.user.screen_name
					+"</span></a></div>"
					+"<div class='text'>"
					+tweet.text
					+"</div>");
				if(tweet.entities.media != undefined) {
					$.each(tweet.entities.media, function(j, media) {
						if(media.type == "photo") {
							$('#'+i).append("<img src='"
								+media.media_url_https
								+"'/><div class='clear'></div>")
						}
					})
				}
				var date = (tweet.created_at).split(' ');
				$('#'+i).append("<a class='link' href='https://twitter.com/"
					+tweet.user.screen_name
					+"/status/"
					+tweet.id_str
					+"'><i class='fa fa-twitter'></i> Link to tweet</a>"
					+"<div class='time'>Published on "
					+day(date[0])+" the "+date[2]+" of "+month(date[1])+" "+date[5]+" at "+date[3]
					+"</div>"
					+"</div></div>")
			})
		} else {
			$('#results').append("No such user exists");
		}
	})
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