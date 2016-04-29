
/**
Tweet Analysis
Alex Burley
**/


//Each unique word and it's number of appeareances in the collection
var totalCount = {};
//The list of users and their tweets
var users = {};


var numKeyWordsPerUser = 5;
var numHashtags = 5

//The dictionary of hashtags and their occurences
var totalHashtags = {}


//Function to reset the variables if a new search is made
function analysisReset() {
	totalCount = {};
	users = {};
}

/*
Purpose: Store all the words encountered in a text in an object with
	corresponding value for the times the word has occured
Parameters:
	text - A tweet consisting of soley text
Returns:
	A javascript object in the format of {word:occurences}
*/
function countWords(text){

	var	wordCount = {};
	//Common not descriptive words that we want to filter out
	var stopList = ["rt","the","to","and","for","of","have","your","at","in","on"];

	//To avoid duplciate words we want the whole text to be in lower case and seperated by spaces
	var tokens = text.toLowerCase().match(/\S+/g);

	for(var x = 0;x<tokens.length;x++){

		var word = tokens[x].toLowerCase();

		//If the word is not present in the stopList and is greater than a single character
		if (stopList.indexOf(word) == -1 && word.length>1) {

			//If the word is a hastag add to totalHashtags aswell
			if (/#+\w+/.test(word)){
				if(totalHashtags[word]){
					totalHashtags[word] += 1;
				}
				else{
					totalHashtags[word] = 1;
				}
			}

			//if a word ends in punctuation return substring of word.length-1
			if (word.charAt(word.length-1).match(/[^\w\s]/)){
				word = word.substring(0,word.length-1);
			}

			//If the tweet starts with a dot (commonly used to avoid direct tweets), remove the dot.
			if (word.charAt(0) == "."){
				word = word.substring(1,word.length);
			}

			//If word has been counted before increment ELSE create new entry
			if (wordCount[word]){
				wordCount[word] += 1;
			}
	    	else {
	    		wordCount[word] = 1;
			} 
		}
	}
	return wordCount
}

/*
Purpose: Populate a global variable containing words and their occurences in the collection
Parameters: 
	wordCount - A javascript object of words and their occurences in a text
	totalCount - Global variable that contains every word encountered thus far when analysing tweets and their counts
Returns:
	VOID - For each word in the wordCount we add the word and it's total to totalCount
*/
function addWordCountToTotalCount(wordCount,totalCount){

	Object.keys(wordCount).forEach(function(key,index) {

	    if (totalCount[key]){
	    	totalCount[key] += wordCount[key];
	    }
	    else{
	    	totalCount[key] = wordCount[key];
	    }
	});
}



/*
Purpose: Sorts a given list of words and values in descending order of value,
	returning a specifed number.
Parameters:
	wordList - A list of words and their occurences
	maxSize - How many of the top values we want to return
Returns:
	A list of [[word:occurences]] of maximum size maxSize
*/
function sortWordCount(wordList,maxSize){

	var sortedCount = [];
	//If our wordList is not long enough use the list length
	if (wordList.length < maxSize){
		var size = wordList.length;
	}
	else {
		var size = maxSize;
	}

	//Push into an array from the object
	for (word in wordList){
		sortedCount.push([word,wordList[word]]);
	}

	//Sort into descending order of value and return the specifed size
	return sortedCount.sort(function(a,b) {
								return b[1] - a[1];
							})
								.slice(0,size);
}


/*
Purpose: Populates the users variable with each users number of tweets,
	 their total word/value pairs and the username as a string.
Parameters: 
	wordCount - javaScript object containing the word:count for the current tweet
	user - The user whose tweet is being analysed
Returns:
	VOID - For the key 'tweet.user.screen_name' update the number of tweets, the 
		current wordCount for that user and the users username as a string.
*/
function userWordCount(wordCount, user){

	//If the user is not present in users, initialise 
	if (!users[user.username]){
		users[user.username] = {
			numTweets:0,
			wordList:{},
			handle:user.username, //May want to change this to the "@format"
			picture:user.picture
		};
	}

	users[user.username].numTweets += 1;

	Object.keys(wordCount).forEach(function(key,index) {

		if (users[user.username].wordList[key]){
			users[user.username].wordList[key] += wordCount[key];
		}
		else {
			users[user.username].wordList[key] = wordCount[key];
		}

	});
}



/*
Purpose: Returns the top 10 most active users and a numnber of their most commonly used words as a sorted array
Parameters:
	NONE
Returns:
	The sorted array of the top users, their number of tweets and their wordCount
*/
function returnTopUsers(){
	var topUsers = [];

	for (user in users){
		topUsers.push(users[user]);
	}

	topUsers = topUsers.sort(function(a,b){
							return b.numTweets-a.numTweets;
							})
								.slice(0,10);


	for (var i = 0; i<topUsers.length; i++){
		topUsers[i].wordList = sortWordCount(topUsers[i].wordList,numKeyWordsPerUser);
	}


	//If a user tweets only once then do not include them
	for (var user = topUsers.length-1; user>-1;user--){
		if (topUsers[user].numTweets == 1){
			topUsers.pop();
		}
	}
	return topUsers;
}

//Returns 20 most common words 
function returnTopWords(){
	var totWords = sortWordCount(totalCount,20);
	return totWords;
}

//Returns the most common hashtags
function returnTopHashtags(){
	var hashtags = sortWordCount(totalHashtags,numHashtags);
	return hashtags;
}
