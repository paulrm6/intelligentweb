var express = require('express');
var router = express.Router();
var SparqlClient = require('sparql-client');
var util = require('util');
var endpoint = 'http://dbpedia.org/sparql';

router.post('/', function(req, res) {

	var teamA = req.body.teamA;
	var teamB = req.body.teamB;
	var data = {
		success: "SUCCESS",
		teamA: teamA,
		teamB: teamB
	}

	generateData(data,function(err,json){
		if(err){
			res.status(500).send(err);
		}
		else {
			res.send(json);
		}
	});

});

function generateData(data,callback){

	var info = {};

	var teamA = data['teamA'];
	var teamB = data['teamB'];

	genTeamData(teamA, function(err,result){
		if(err){
			callback(err,undefined);
		}
		else{
			info['teamA'] = result;
			genTeamData(teamB, function(err,result){
				if(err){
					callback(err,undefined);
				}
				else {
					info['teamB'] = result;
					callback(undefined,info);
				}
			});
		}
	});

}

function genTeamData(team, callback){

	var teamData = {}

	genClubData(team,function(err,result){
		if(err){
			callback(err,undefined);
		}
		else{
			teamData['club'] = result;
			genPlayerData(team,function(err,result){
				if(err){
					callback(err,undefined);
				}
				else{
					teamData['players'] = result;
					callback(undefined,teamData);
				}
			});
		}
	});

}

function genClubData(team,callback){

	var client = new SparqlClient(endpoint);
	var resource = '<http://dbpedia.org/resource/'.concat(team).concat('> ');

	var query = "PREFIX type: <http://dbpedia.org/class/yago/> PREFIX prop: <http://dbpedia.org/property/>"+
					'SELECT ?team ?fullname ?manager ?managerFName ?managerLName ?abstract ?titlestyle ?ground ?groundName ?groundDescription ?groundThumbnail '+ 
					 	'WHERE {'+
							 '?team '+
							 'prop:fullname ?fullname;'+
							 'prop:manager ?manager;'+
							 'dbo:abstract ?abstract;'+
							 'dbo:ground ?ground .'+
							 'OPTIONAL {?team dbp:titlestyle ?titlestyle}'+
							 'OPTIONAL {?manager foaf:givenName ?managerFName}'+
        					 'OPTIONAL {?manager foaf:surname ?managerLName}'+
							 '?ground foaf:name ?groundName;'+
							 'dbo:thumbnail ?groundThumbnail ;'+
							 'dbo:abstract ?groundDescription .'+
									 'FILTER ( langMatches(lang(?abstract), "EN")) .'+
									 'FILTER ( langMatches(lang(?groundDescription), "EN")) . }';


	client.query(query)
		.bind('team',resource)
		.execute(function(error,results){
			if(error) console.log(error);
			callback(error,results);
		});
}

function genPlayerData(team,callback){

	var client = new SparqlClient(endpoint);
	var resource = '<http://dbpedia.org/resource/'.concat(team).concat('> ');
	var query = 'SELECT ?player (SAMPLE(?name) AS ?playerName) (SAMPLE(?photo) AS ?playerPhoto) (SAMPLE(?position) AS ?playerPosition) (SAMPLE(?dob) AS ?playerdob) '+ 
					 	'WHERE {'+
							 '?team '+
							 'dbp:name ?player . '+
							 '?player dbp:name ?name;'+
							 'dbo:thumbnail ?photo;'+
							 'dbo:position ?pos;'+
							 'dbo:birthDate ?dob . '+
							 '?pos rdfs:label ?position . '+
							 'FILTER ( langMatches(lang(?position), "EN")) .'+
							 '} GROUP BY ?player';
	client.query(query)
		.bind('team',resource)
		.execute(function(error,results){
			if(error) console.log(error);
			callback(error,results);
		});
}




module.exports = router;