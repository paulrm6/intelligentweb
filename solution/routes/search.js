var express = require('express');
var router = express.Router();
var client = require('../private/twit');

router.get('/', function(req, res, next){
	var user = req.query.user;
	var search = req.query.search;
	var all_data = []
	client.get('statuses/user_timeline', { screen_name: user, count: 100 },
		function(err, data, response) {
            //console.log(data);
            //res.send(data);
            all_data = all_data.concat(data);
			client.get('search/tweets', { q: search, count: 100 },
	            function(err, data, response) {
	                //console.log(data);
	                //res.send(data.statuses);
	                all_data = all_data.concat(data.statuses);
	                all_data.sort(sortfunction());
	                //console.log(all_data);
					res.send(all_data);
				}
			);
		}
	);
});

function sortfunction() {
	return function(a,b) {
		var split_a = a.created_at.split(' ');
		var split_b = b.created_at.split(' ');
		var time_a = split_a[3].split(':');
		var time_b = split_b[3].split(':');
		var date_a = new Date(split_a[5],month(split_a[1]),split_a[2],time_a[0],time_a[1],time_a[2],0);
		var date_b = new Date(split_b[5],month(split_b[1]),split_b[2],time_b[0],time_b[1],time_b[2],0);
		return (date_a>date_b ? -1 : date_a<date_b ? 1 : 0);
	}
}

function month(month) {
	if(month == "Jan") {
		return 1
	}
	if(month == "Feb") {
		return 2
	}
	if(month == "Mar") {
		return 3
	}
	if(month == "Apr") {
		return 4
	}
	if(month == "May") {
		return 5
	}
	if(month == "Jun") {
		return 6
	}
	if(month == "Jul") {
		return 7
	}
	if(month == "Aug") {
		return 8
	}
	if(month == "Sep") {
		return 9
	}
	if(month == "Oct") {
		return 10
	}
	if(month == "Nov") {
		return 11
	}
	if(month == "Dec") {
		return 12
	}
}
module.exports = router;