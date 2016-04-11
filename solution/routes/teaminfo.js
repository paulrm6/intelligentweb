var express = require('express');
var router = express.Router();
var pool = require('../private/sql');

router.get('/', function(req, res, next){
	var type = req.query.type;
	if(type=="team") {
		getTeams(res);
	} else {
		var team = req.query.team;
		//Code to return players (not yet implemented)
	}
});

/**
 * Gets all teams from the database and sends them as a JSON response
 * @param: res response
 */
function getTeams(res) {
	pool.query('SELECT * FROM teams ORDER BY name ASC;', function(err, results, fields) {
		if(err) {
			res.status(400).send("Database is unreachable");
		} else {
			res.send(results);
		}
	});
}

module.exports = router;