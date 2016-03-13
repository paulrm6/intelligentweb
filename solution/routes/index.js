var express = require('express');
var router = express.Router();
var Twit = require('twit');
var client = new Twit({
	consumer_key: 'nuNlCGGcPF2M5lRJ3niGf2WUf',
	consumer_secret: 'ja3arH3fGuwiU93DCyhDWCVO1oyrfvLU1nOYeYtjXyCangiWc0',
	access_token: '3433284611-dCs1sJWqDynYNjcDlzksKlq4UYFHxZ8zoAhPP75',
	access_token_secret: 'pxxV0DWJOGJvm6ULV12YL8nZIEmK63X6ljidrKBuRI1Ji'
	});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Search' });
});

router.post('/', function(req, res, next){
	var querybox1 = req.body.querybox1
	query = querybox1
	client.get('search/tweets', { q: query, count: 100 },
            function(err, data, response) {
                console.log(data.statuses);
                res.render('results', {
						title: 'results',
						a: req.body.testbox1,
						tweets: data.statuses
						});
		});

});

module.exports = router;
