/**
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module Ajax Report
 */
/**
 * A function that listens to clicks of buttons
 */
$(document)
	.on("click", "#report .button", function() {
		//When a button on the form is clicked to submit, check the validity of the form
		var valid = $('#reportForm')[0].checkValidity();
		if (valid) {
			//If it's valid, fade in the loading cover
			$('#reportCover')
				.fadeIn(500);
			//Hide any previous errors
			$('#report #results .error')
				.hide();
			//Remove flying classes
			$('#report #results #teamA')
				.hide(0)
				.removeClass('flyInLeft');
			$('#report #results #teamB')
				.hide(0)
				.removeClass('flyInRight');
			//Call the search
			callSearchReport();
		} else {
			//Imitate a submit click on the form so the HTML5 valid checker with give errors to the user
			$('<input type="submit">')
				.hide()
				.appendTo($('#reportForm'))
				.click()
				.remove();
		}
	});
/**
 * A function to get the report data from /report
 */
function callSearchReport() {
		//Create the data object
		var data = {
			teamA: $('#reportForm #teamA')
				.val(),
			teamB: $('#reportForm #teamB')
				.val()
		};
		//Create an ajax http request
		$.ajax({
			type: "POST", //Set type to post
			url: '/report', //Set url depending on search type
			//The datatype and content type should be json
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(data), //Add the data, in a string format
			success: function(data) { //on success (200)
				//Initiate data population
				populateReportData(data, "teamA");
				populateReportData(data, "teamB");
				showReport();
			},
			error: function(error) { //on error
				//Initiate error population
				console.log(error);
				$('#report #results .error')
					.text(error.responseText)
					.show();
				$('#reportCover')
					.fadeOut(500);
			}
		});
	}
/**
 * A function to set the colour of each team
 * @param {object} teamData the data for a team
 * @param {string} teamName the string for a team
 */
function setColour(data, team) {
		//If the colour is there
		if (data.titlestyle) {
			//Get the background colour from the string
			var titlestyle = data.titlestyle.value;
			var index = titlestyle.indexOf("background:");
			var backgroundColour = titlestyle.substring(index + 11, index + 18);
			//Change the backgorund colour
			$('#report #results #' + team)
				.css("backgroundColor", backgroundColour);
			//If the background colour is dark
			if (isDark(backgroundColour)) {
				//Set text colour to white
				$('#report #results #' + team)
					.css("color", "white");
			} else {
				//Set text colour to black
				$('#report #results #' + team)
					.css("color", "black");
			}
		} else {
			//Set the background colour to white and text colour to black
			$('#report #results #' + team)
				.css("backgroundColor", "white");
			$('#report #results #' + team)
				.css("color", "black");
		}
	}
/**
 * A function to populate the report data
 * @param {object} data the data
 * @param {string} teamName the string for a team
 */
function populateReportData(data, team) {
		//Get the team data
		var teamData = data[team].club.results.bindings[0];
		//Set the colour for that team
		setColour(teamData, team);
		//Add the title to each team
		$('#report #results #' + team + ' h3')
			.html("<a target='_blank' href='" + teamData['callret-0'].value +
				" property='dbp:fullname'>" + teamData.fullname.value + "</a>");
		//Create variables for each html string
		var teamInfo = "",
			stadiumInfo = "",
			managerInfo = "",
			playerInfo = "";
		//If the teams abstract is set
		if (teamData.abstract) {
			//Add the abstract to the team info
			teamInfo += "<div class='abstract readMore' property='dbo:abstract'>" +
				teamData.abstract.value + "</div>";
			//Show the label for read more
			$('label[for=teamInfoReadMore_' + team + ']')
				.show();
		} else {
			//Hide the label for read more
			$('label[for=teamInfoReadMore_' + team + ']')
				.hide();
		}
		//If the teams ground and teams ground name is set
		if (teamData.ground && teamData.groundName) {
			//Add the stadium info
			stadiumInfo = "<a target='_blank' href='" + teamData.ground.value +
				"' class='stadiumName'>Stadium: <span property='dbp:name'>" + teamData.groundName
				.value + "</span></a>" + "<img src='" + ((teamData.groundThumbnail) ?
					teamData.groundThumbnail.value : "/images/generic_photo.png") +
				"' property='dbo:thumbnail'/>" + ((teamData.groundDescription.value) ?
					"<div class='abstract readMore' property='dbo:abstract'>" + teamData.groundDescription
					.value + "</div>" : "");
			teamInfo += "<a property='dbo:ground' href='" + teamData.ground.value +
				"'></a>";
			$('#report #results #' + team + ' .stadiumInfo')
				.attr('about', teamData.ground.value);
			//Show the label for read more
			$('label[for=stadiumInfoReadMore_' + team + ']')
				.show();
		} else {
			//Hide the label for read more
			$('label[for=stadiumInfoReadMore_' + team + ']')
				.hide();
		}
		//If the teams manager is set and the manager name
		if (teamData.manager && teamData.managerName) {
			//Add the manager info
			managerInfo = "<a target='_blank' href='" + teamData.manager.value +
				"' class='managerName'>Manager: <span property='dbp:name'>" + teamData.managerName
				.value + "</span></a>" + "<img src='" + ((teamData.managerThumbnail) ?
					teamData.managerThumbnail.value : "/images/generic_photo.png") +
				"' property='dbo:thumbnail' />";
			teamInfo += "<a property='dbo:manager' href='" + teamData.manager.value +
				"'></a>";
			$('#report #results #' + team + ' .managerInfo')
				.attr('about', teamData.manager.value);
		}
		//For each player
		$.each(data[team].players.results.bindings, function(i, player) {
			//If the player name is set
			if (player.playerName) {
				//Add the player to team info
				teamInfo += "<a property='dbp:name' href='" + player.player.value +
					"'></a>";
				//Add the player info
				playerInfo += "<div class='player' about='" + player.player.value + "'" +
					((player.playerAbstract) ? " abstract='" + player.playerAbstract.value +
						"'>" : ">") + "<div class='playerName' property='dbp:name'>" + player.playerName
					.value + "</div><img src='" + ((player.playerPhoto) ? player.playerPhoto
						.value : "/images/generic_photo.png") + "' property='dbo:thumbnail'/>" +
					((player.playerPosition) ?
						"<div class='playerPosition' property='dbo:position'>" + player.playerPosition
						.value.replace(" (association football)", "") + "</div>" : "") + ((
							player.playerdob) ?
						"<div class='playerDOB'>DOB: <span property='dbp:birthDate'>" + player.playerdob
						.value + "</span></div>" : "") + "</div>";
			}
		});
		//Add all the sections to the report
		$('#report #results #' + team + ' .teamInfo')
			.empty()
			.append(teamInfo)
			.attr('about', teamData['callret-0'].value);
		$('#report #results #' + team + ' .stadiumInfo')
			.empty()
			.append(stadiumInfo);
		$('#report #results #' + team + ' .managerInfo')
			.empty()
			.append(managerInfo);
		$('#report #results #' + team + ' .playerInfo')
			.empty()
			.append(playerInfo);
	}
/**
 * A function to populate the report data
 * @param {string} colour the colour to test
 * @returns {boolean} isDark true if the colour is dark
 */
function isDark(colour) {
		//Get rgb compoments
		var red = parseInt(colour.substring(1, 3), 16);
		var green = parseInt(colour.substring(3, 5), 16);
		var blue = parseInt(colour.substring(5, 7), 16);
		//Calculate the luminance of the colour
		var luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
		//If luminance is greater than 50
		if (luminance > 50) {
			return false;
		} else {
			return true;
		}
	}
/**
 * A function to show the report
 */
function showReport() {
		//Hide the cover
		$('#reportCover')
			.delay(830)
			.fadeOut(0);
		//Fly in the teams
		$('#report #results #teamA')
			.show(0)
			.addClass('flyInLeft');
		$('#report #results #teamB')
			.show(0)
			.addClass('flyInRight');
	}
/**
 * A function to listen to clicks on each player
 */
$(document)
	.on("click", ".player", function() {
		//If the player has an abstract
		if ($(this)
			.attr("abstract")) {
			//Open the abstract in the gallery as extra, with a link to the dbpedia page
			$('#innerGallery')
				.empty()
				.append("<div class='abstract'>" + $(this)
					.attr("abstract") + "<a href='" + $(this)
					.attr("about") +
					"' target='_blank'> Click here to view their profile.</a></div>");
			//Show the gallery
			$('#gallery')
				.show();
		} else {
			//Open a new tab linking to the dbpedia link
			window.open($(this)
				.attr("about"), '_blank');
		}
	});