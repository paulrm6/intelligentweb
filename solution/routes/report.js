/**
 * @author Alex Burley <aburley1@sheffield.ac.uk>
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module report
 */
var express = require('express');
var router = express.Router();
var SparqlClient = require('sparql-client');
var util = require('util');
var endpoint = 'http://dbpedia.org/sparql';
//Expect only one type of post request
router.post('/', function(req, res) {
	//Generate the JSON that we want to send back through AJAX
	generateData(req.body, function(err, json) {
		if (err) {
			res.status(500)
				.send(err);
		} else {
			res.send(json);
		}
	});
});
/**
 * Function to generate a json containing club and player data for two given teams
 * @param {object} teams The json object containing names for the two teams
 * @param {err-data} callback The callback method used to send finish the AJAX data transfer
 */
function generateData(data, callback) {
		//Empty json object and team variables
		var info = {};
		var teamA = data.teamA;
		var teamB = data.teamB;
		//Begin by generating the team data for a single team
		genTeamData(teamA, function(err, result) {
			if (err) {
				callback(err, undefined);
			} else {
				//Insert the data for team A into our info object then generate data for teamB
				info.teamA = result;
				genTeamData(teamB, function(err, result) {
					if (err) {
						callback(err, undefined);
					} else {
						info.teamB = result;
						callback(undefined, info);
					}
				});
			}
		});
	}
	/**
	 * This global callback provides an error/data response
	 * @callback err-data
	 * @param {string} error an error message or undefined if no error
	 * @param {object|string} data data of successful function
	 */
/**
 * Function to generate team data for a given team
 * @param {object} teams The team whose data we want to collect
 * @param {err-data} callback The callback method used to return to the request
 */
function genTeamData(team, callback) {
		//collect team data into one object
		var teamData = {};
		//generate the club data first (club info, stadium and manager info)
		genClubData(team, function(err, result) {
			if (err) {
				callback(err, undefined);
			} else {
				//If we the query fails
				if (result.results.bindings.length === 0) {
					callback("No data returned for " + team, undefined);
				} else {
					//Store data and generate player data for the team given
					teamData.club = result;
					genPlayerData(team, function(err, result) {
						if (err) {
							callback(err, undefined);
						} else {
							teamData.players = result;
							callback(undefined, teamData);
						}
					});
				}
			}
		});
	}
/**
 * Function to generate club data for a given team using SPARQL
 * @param {object} teams The team whose data we want to collect
 * @param {err-data} callback The callback method used to return to the request
 */
function genClubData(team, callback) {
		var client = new SparqlClient(endpoint);
		var resource = '<http://dbpedia.org/resource/'.concat(team)
			.concat('> ');
		var query = "PREFIX prop: <http://dbpedia.org/property/>" +
			'SELECT ?team ?fullname ?manager ?managerName ?managerThumbnail ?abstract ?titlestyle ?ground ?groundName ?stadiumName ?groundDescription ?groundThumbnail ' +
			'WHERE {' + '?team ' + 'prop:fullname ?fullname;' + 'prop:manager ?manager;' +
			'dbo:abstract ?abstract .' + 'OPTIONAL {?team dbo:ground ?ground}' +
			'OPTIONAL {?team dbo:ground ?ground . ?ground foaf:name ?groundName}' +
			'OPTIONAL {?team dbo:ground ?ground . ?ground dbp:stadiumName ?stadiumName}' +
			'OPTIONAL {?team dbo:ground ?ground . ?ground dbo:thumbnail ?groundThumbnail}' +
			'OPTIONAL {?team dbo:ground ?ground . ?ground dbo:abstract ?groundDescription}' +
			'OPTIONAL {?team dbp:titlestyle ?titlestyle}' +
			'OPTIONAL {?manager foaf:name ?managerName}' +
			'OPTIONAL {?manager dbo:thumbnail ?managerThumbnail}' +
			'FILTER ( langMatches(lang(?abstract), "EN")) .' +
			'FILTER(LANG(?groundDescription) = "" || LANGMATCHES(LANG(?groundDescription), "en")) }';
		//Use SPARQL to make our 'query' to dbpedia while binding the given team to ?team
		client.query(query)
			.bind('team', resource)
			.execute(function(error, results) {
				if (error) console.log(error);
				callback(error, results);
			});
	}
/**
 * Function to generate player data for a given team using SPARQL
 * @param {string} team The team whose data we want to collect
 * @param {err-data} callback The callback method used to return to the request
 */
function genPlayerData(team, callback) {
	var client = new SparqlClient(endpoint);
	var resource = '<http://dbpedia.org/resource/'.concat(team)
		.concat('> ');
	var query =
		'SELECT ?player (SAMPLE(?name) AS ?playerName) (SAMPLE(?photo) AS ?playerPhoto)' +
		'(SAMPLE(?position) AS ?playerPosition) (SAMPLE(?dob) AS ?playerdob) (SAMPLE(?abstract) AS ?playerAbstract)' +
		'WHERE {' + '?team ' + 'dbp:name ?player . ' + '?player dbp:name ?name;' +
		'dbo:position ?pos;' + 'dbo:birthDate ?dob . ' +
		'OPTIONAL {?player dbo:thumbnail ?photo}' +
		'OPTIONAL {?player dbo:abstract ?abstract}' + '?pos rdfs:label ?position . ' +
		'FILTER ( langMatches(lang(?abstract), "EN")) .' +
		'FILTER ( langMatches(lang(?position), "EN")) .' + '} GROUP BY ?player';
	//Use SPARQL to make our 'query' to dbpedia while binding the given team to ?team
	client.query(query)
		.bind('team', resource)
		.execute(function(error, results) {
			if (error) console.log(error);
			callback(error, results);
		});
}
module.exports = router;