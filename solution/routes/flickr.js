/**
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module flickr
 */
var express = require('express');
var router = express.Router();
var flickr = require('../private/flickr');

//If there is a request to get flickr data
router.get('/', function(req,res) {
	//Get the tags from the post data
	var tags = req.query.tags;
	//Request the data from flickr
	flickr.get("photos.search", {
		tags:tags,
		per_page: 30
	}, function(err, data) {
		if(err) {
			//If there is an error, send an error
			res.send(400);
		} else {
			//For each photo
			for(var i=0; i<data.photos.photo.length; i++) {
				var photo = data.photos.photo[i];
				var link = 'https://farm'+photo.farm
					+'.staticflickr.com/'+photo.server
					+'/'+photo.id
					+'_'+photo.secret;
				//Create links to different sizes
				data.photos.photo[i].thumbnail = link+'_t.jpg';
				data.photos.photo[i].medium = link+'.jpg';
				data.photos.photo[i].large = link+'_b.jpg';
				data.photos.photo[i].link =
					'https://www.flickr.com/photos/'
					+photo.owner
					+'/'+photo.id;
			}
			//Send the data
			res.send(data);
		}
	})
});

module.exports = router;