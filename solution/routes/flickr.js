var express = require('express');
var router = express.Router();
var flickr = require('../private/flickr');

router.get('/', function(req,res) {
	var tags = req.query.tags;
	flickr.get("photos.search", {
		tags:tags,
		per_page: 30
	}, function(err, data) {
		if(err) {
			res.send(400);
		}
		for(var i=0; i<data.photos.photo.length; i++) {
			var photo = data.photos.photo[i];
			var link = 'https://farm'+photo.farm
				+'.staticflickr.com/'+photo.server
				+'/'+photo.id
				+'_'+photo.secret;
			data.photos.photo[i].thumbnail = link+'_t.jpg';
			data.photos.photo[i].medium = link+'.jpg';
			data.photos.photo[i].large = link+'_b.jpg';
			data.photos.photo[i].link =
				'https://www.flickr.com/photos/'
				+photo.owner
				+'/'+photo.id;
		}
		res.send(data);
	})
});

module.exports = router;