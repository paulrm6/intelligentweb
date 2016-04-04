var mysql = require('mysql')

var connection = mysql.createConnection({
	host		: 'stusql.dcs.shef.ac.uk',
	port		: '3306',
	user		: 'aca13prm',
	password	: 'fd2f8cef',
	database	: 'aca13prm',
});

module.exports = connection;