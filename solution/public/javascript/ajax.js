function submitted() {
	$.get('/search',{ user: $("#user").val()}, function(data) {
		$('#results').empty();
		$.each(data, function(i, tweet) {
			$('#results').append("<div id='"+i+"' class='tweet'>"
				+ (tweet.retweeted_status != undefined ? 
					"<div class='retweet'>"
					+"<i class='fa fa-retweet'></i> Retweeted by "
					+tweet.user.name
					+" - <a href='https://twitter.com/"
					+tweet.user.screen_name
					+"' class='italic'> @"
					+tweet.user.screen_name
					+"</a></div>" : "")
				);
			if(tweet.retweeted_status != undefined) {
				tweet = tweet.retweeted_status;
			}
			$('#'+i).append("<div class='user'>"
				+tweet.user.name
				+" - <a href='https://twitter.com/"
				+tweet.user.screen_name
				+"' class='italic'> @"
				+tweet.user.screen_name
				+"</a></div>"
				+"<div class='text'>"
				+tweet.text
				+"</div>");
			if(tweet.entities.media != undefined) {
				$.each(tweet.entities.media, function(j, media) {
					if(media.type == "photo") {
						$('#'+i).append("<img src='"
							+media.media_url_https
							+"'/>")
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
				+"</div>")
		})
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