var express = require('express');
var router = express.Router();
var flickr = require('../private/flickr');

router.get('/', function(req,res) {
	var tags = req.query.tags;
	flickr.get("photos.search", {
		tags:tags,
		per_page: 10
	}, function(err, data) {
		for(var i=0; i<data.photos.photo.length; i++) {
			var photo = data.photos.photo[i];
			data.photos.photo[i].https =
				'https://farm'+photo.farm
				+'.staticflickr.com/'+photo.server
				+'/'+photo.id
				+'_'+photo.secret
				+'_b.jpg';
		}
		res.send(data);
	})
});

module.exports = router;