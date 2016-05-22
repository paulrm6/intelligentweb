/**
 * @author Alex Burley
 * @module Tweet Analysis
 */
//Each unique word and it's number of appeareances in the collection
var totalCount = {};
//The list of users and their tweets
var users = {};
var numKeyWordsPerUser = 5;
var numHashtags = 5;
	//The dictionary of hashtags and their occurences
var totalHashtags = {};
/**
 * Function to reset the variables if a new search is made
 */
function analysisReset() {
		totalCount = {};
		users = {};
		totalHashtags = {};
	}
/**
 * Store all the words encountered in a text in an object with corresponding value for the times the word has occured
 * @param {string} text a tweet consisting of soley text
 * @returns {object} a javascript object in the format of {word:occurences}
 */
function countWords(text) {
		var wordCount = {};
		//Common not descriptive words that we want to filter out
		var stopList = ["rt", "the", "to", "and", "for", "of", "have", "your", "at",
			"in", "on"];
		//To avoid duplciate words we want the whole text to be in lower case and seperated by spaces
		var tokens = text.toLowerCase()
			.match(/\S+/g);
		for (var x = 0; x < tokens.length; x++) {
			var word = tokens[x].toLowerCase();
			//If the word is not present in the stopList and is greater than a single character
			if (stopList.indexOf(word) == -1 && word.length > 1) {
				//If the word is a hastag add to totalHashtags aswell
				if (/#+\w+/.test(word)) {
					if (totalHashtags[word]) {
						totalHashtags[word] += 1;
					} else {
						totalHashtags[word] = 1;
					}
				}
				//if a word ends in punctuation return substring of word.length-1
				if (word.charAt(word.length - 1)
					.match(/[^\w\s]/)) {
					word = word.substring(0, word.length - 1);
				}
				//If the tweet starts with a dot (commonly used to avoid direct tweets), remove the dot.
				if (word.charAt(0) == ".") {
					word = word.substring(1, word.length);
				}
				//If word has been counted before increment ELSE create new entry
				if (wordCount[word]) {
					wordCount[word] += 1;
				} else {
					wordCount[word] = 1;
				}
			}
		}
		return wordCount;
	}
/**
 * Populate a global variable containing words and their occurences in the collection
 * @param {object} words A javascript object of words and their occurences in a text
 * @param {object} everyWord Global variable that contains every word encountered thus far when analysing tweets and their counts
 */
function addWordCountToTotalCount(wordCount, totalCount) {
		Object.keys(wordCount)
			.forEach(function(key, index) {
				if (totalCount[key]) {
					totalCount[key] += wordCount[key];
				} else {
					totalCount[key] = wordCount[key];
				}
			});
	}
/**
 * Sorts a given list of words and values in descending order of value,	returning a specifed number.
 * @param {[string]} wordList - A list of words and their occurences
 * @param {integer} maxSize - How many of the top values we want to return
 * @returns {[[string]]} A list of [[word:occurences]] of maximum size maxSize
 */
function sortWordCount(wordList, maxSize) {
		var sortedCount = [];
		//If our wordList is not long enough use the list length
		var size;
		if (wordList.length < maxSize) {
			size = wordList.length;
		} else {
			size = maxSize;
		}
		//Push into an array from the object
		for (var word in wordList) {
			sortedCount.push([word, wordList[word]]);
		}
		//Sort into descending order of value and return the specifed size
		return sortedCount.sort(function(a, b) {
				return b[1] - a[1];
			})
			.slice(0, size);
	}
/**
 * Populates the users variable with each users number of tweets, their total word/value pairs and the username as a string.
 * @param {object} wordCount javaScript object containing the word:count for the current tweet
 * @param {string} user The user whose tweet is being analysed
 */
function userWordCount(wordCount, user) {
		//If the user is not present in users, initialise 
		if (!users[user.username]) {
			users[user.username] = {
				numTweets: 0,
				wordList: {},
				handle: user.username,
				picture: user.picture
			};
		}
		users[user.username].numTweets += 1;
		Object.keys(wordCount)
			.forEach(function(key, index) {
				if (users[user.username].wordList[key]) {
					users[user.username].wordList[key] += wordCount[key];
				} else {
					users[user.username].wordList[key] = wordCount[key];
				}
			});
	}
/**
 * Returns the top 10 most active users and a numnber of their most commonly used words as a sorted array
 * @returns {[object]} topUsers The sorted array of the top users, their number of tweets and their wordCount
 */
function returnTopUsers() {
		var topUsers = [];
		for (var user in users) {
			topUsers.push(users[user]);
		}
		topUsers = topUsers.sort(function(a, b) {
				return b.numTweets - a.numTweets;
			})
			.slice(0, 10);
		for (var i = 0; i < topUsers.length; i++) {
			topUsers[i].wordList = sortWordCount(topUsers[i].wordList,
				numKeyWordsPerUser);
		}
		//If a user tweets only once then do not include them
		for (var user = topUsers.length - 1; user > -1; user--) {
			if (topUsers[user].numTweets == 1) {
				topUsers.pop();
			}
		}
		return topUsers;
	}
/**
 * Returns 20 most common words
 * @returns {[object]} topwords The 20 most commond words
 */
function returnTopWords() {
		var totWords = sortWordCount(totalCount, 20);
		return totWords;
	}
/**
 * Returns most common hashtags
 * @returns {[object]} tophashtags The most commond hashtags
 */
function returnTopHashtags() {
	var hashtags = sortWordCount(totalHashtags, numHashtags);
	return hashtags;
}