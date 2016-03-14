var express = require('express');
var router = express.Router();
var Twit = require('twit');
var client = new Twit({
	consumer_key: '1R5gIb6Nq3Q0CSEaz37bRt2F9',
	consumer_secret: 'xZf90oSYBEBWvdxxzPcs3GBrh6r4XhuvaLF5s9xvTuLE0IW4pf',
	access_token: '705393120402382848-LUTIG8CQyn8jmr3OMhDsRuvf22AC0C0',
	access_token_secret: 'mEDTtSJtcRodO8FHBedwtAcqFTR9Vu16o93HzUrFP12L8'
	});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Search' });
});

router.post('/', function(req, res, next){
	var user_name = req.body.user_search;
	client.get('statuses/user_timeline', { screen_name: user_name, count: 100 },
            function(err, data, response) {
                console.log(data);
                res.render('results', {
						title: user_name,
						tweets: data
						});
		});

});

module.exports = router;
