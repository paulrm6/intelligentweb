var express = require('express');
var router = express.Router();
var client = require('../private/twit');
var q;

router.get('/', function(req, res, next){
	q = req.query.q;
	searchtweets(res);
});

function searchtweets(res) {
	client.get('search/tweets', { q: q, count: 100 },
        function(err, data, response) {
            console.log(data.statuses.length);
			res.send(data.statuses);
		}
	);
}

module.exports = router;