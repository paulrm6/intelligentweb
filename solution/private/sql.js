var mysql = require('mysql')

//Create pooled connection for multiple access
var pool = mysql.createPool({
	host		: 'stusql.dcs.shef.ac.uk',
	port		: '3306',
	user		: 'aca13prm',
	password	: 'fd2f8cef',
	database	: 'aca13prm',
    connectionLimit: 25,
    queueLimit: 5000,
    charset		: 'utf8mb4'
});

module.exports = pool;