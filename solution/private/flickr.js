/*
 * @author Paul MacDonald
 */

var Flickr = require('node-flickr'),
	keys = {
		api_key: "265dc8f569c271b8eaf84411954f0dfc"
	};

var flickr = new Flickr(keys);

module.exports = flickr;