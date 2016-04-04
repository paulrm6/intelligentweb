/**

Tweet Analysis
Alex Burley

**/


//Each unique word and it's number of appeareances in the collection
var totalCount = {};
//The list of users and their tweets
var users = {};
//Unused but will probably not want to return 20 keywords for each user
var numKeyWords = 20;

function analysisReset() {
	totalCount = {};
	users = {};
	numKeyWords = 20;
}

//Returns an object for a given a tweet containing each unique word and it's number of occurences within the text
function countWords(text){

	console.log(text);
	var	wordCount = {};
	var tokens = text.match(/\S+/g);
	

	for(var x = 0;x<tokens.length;x++){
		if (wordCount[tokens[x]]){
			wordCount[tokens[x]] += 1;
		}
    	else {
    	wordCount[tokens[x]] = 1;
		} 
	}

	return wordCount
}


//Should probably rename
//Void function to add the wordCount for each tweet to the total count.
function addWordCountToTotalCount(wordCount,totalCount){

	//console.log(wordCount);
	//console.log(totalCount);

	Object.keys(wordCount).forEach(function(key,index) {

		//console.log(key)

	    // key: the name of the object key
	    // index: the ordinal position of the key within the object 

	    if (totalCount[key]){
	    	totalCount[key] += wordCount[key];
	    }
	    else{
	    	totalCount[key] = wordCount[key];
	    }
	});
}


//Sorts a given list of words and values, returning the 20 most common words
function sortWordCount(wordList){

	var sortedCount = []

	for (word in wordList){
		sortedCount.push([word,wordList[word]]);
	}
	return sortedCount.sort(function(a,b) {
								return b[1] - a[1];
							})
								.slice(0,20); //CHECK FOR SIZE HERE
}


//Populates the users variable with each users number of tweets, their total word/value pairs and the username as a string
function userWordCount(wordCount, user){

	if (!users[user]){
		users[user] = {
			numTweets:0,
			wordList:{},
			handle:user //May want to change this to the "@format"
		};
	}

	users[user].numTweets += 1;

	Object.keys(wordCount).forEach(function(key,index) {

		if (users[user].wordList[key]){
			users[user].wordList[key] += wordCount[key];
		}
		else {
			users[user].wordList[key] = wordCount[key];
		}

	});
}



//Returns the top 10 most active users and their 20 most commonly used words as a sorted array
function returnTopUsers(){
	var topUsers = [];
	//console.log(users);

	for (user in users){
		topUsers.push([users[user].handle,users[user].numTweets,users[user].wordList]);
	}

	topUsers = topUsers.sort(function(a,b){
							return b[1]-a[1];
							})
								.slice(0,10); //CHECK FOR SIZE


	for (var i = 0; i<topUsers.length; i++){
		topUsers[i][2] = sortWordCount(topUsers[i][2]);
	}

	return topUsers;

}

function returnTopWords(){
	return sortWordCount(totalCount);
}