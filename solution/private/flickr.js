var Flickr = require('node-flickr'),
	keys = {
		api_key: "265dc8f569c271b8eaf84411954f0dfc"//,
		//secret: "9b6bd5df9e25f537"
	};

var flickr = new Flickr(keys);

module.exports = flickr;