var mysql = require('mysql')

var pool = mysql.createPool({
	host		: 'stusql.dcs.shef.ac.uk',
	port		: '3306',
	user		: 'aca13prm',
	password	: 'fd2f8cef',
	database	: 'aca13prm',
    connectionLimit: 25,
    queueLimit: 5000
});

module.exports = pool;