var express = require('express');
var router = express.Router();
var client = require('../private/twit');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Search' });
});

router.post('/', function(req, res, next){
	var user_name = req.body.user_search;
	client.get('statuses/user_timeline', { screen_name: user_name, count: 100 },
            function(err, data, response) {
                //console.log(data);
                res.render('results', {
						tweets: data
						});
		});

});

module.exports = router;
