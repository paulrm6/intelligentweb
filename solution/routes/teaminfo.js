var express = require('express');
var router = express.Router();
var database = require('../private/sql');

router.get('/', function(req, res, next){
	var type = req.query.type;
	if(type=="team") {
		getTeams(res);
	} else {
		var team = req.query.team;
		//return all players from a team
	}
});

/**
 * Gets all teams from the database and sends them as a JSON response
 * @param: res response
 */
function getTeams(res) {
	database.query('SELECT * FROM teams ORDER BY name ASC;', function(err, results, fields) {
		if(err) {
			res.status(400).send("Database is unreachable");
		} else {
			res.send(results);
		}
	});
}

module.exports = router;