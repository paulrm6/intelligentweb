$(document)
	.on("click", "#report .button", function() {
		//When a button on the form is clicked to submit, check the validity of the form
		var valid = $('#reportForm')[0].checkValidity();
		if (valid) {
			//If it's valid, fade in the loading cover
			$('#reportCover').fadeIn(500);
			$('#football').hide(0);
			$('#report #results #teamA').hide(0).removeClass('flyInLeft');
			$('#report #results #teamB').hide(0).removeClass('flyInRight');
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


function callSearchReport() {
		var data = {
			teamA: $('#reportForm #teamA').val(),
			teamB: $('#reportForm #teamB').val()
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
				console.log(data);
				populateReportData(data,"teamA");
				populateReportData(data,"teamB");
				showReport();
			},
			error: function(data) { //on error
				//Initiate error population
				console.log(data);
				$('#cover').fadeOut(500);
			}
		});
	}

function setColour(data, team) {
	if(data.titlestyle) {
		var titlestyle = data.titlestyle.value;
		var index = titlestyle.indexOf("background:");
		var backgroundColour = titlestyle.substring(index+11,index+18)
		$('#report #results #'+team).css("backgroundColor",backgroundColour);
		if(isDark(backgroundColour)) {
			$('#report #results #'+team).css("color","white");
		} else {
			$('#report #results #'+team).css("color","black");
		}
	} else {
		$('#report #results #'+team).css("backgroundColor","white");
	}
}

function populateReportData(data, team) {
	var teamData = data[team].club.results.bindings[0];
	setColour(teamData,team);
	$('#report #results #'+team+' h3').html("<a target='_blank' href='"
		+teamData['callret-0'].value
		+" property='dbp:fullname'>"+teamData.fullname.value+"</a>");
	var teamInfo = "<div class='abstract readMore' property='dbo:abstract'>"+teamData.abstract.value+"</div>"
		+"<a property='dbo:ground' href='"+teamData.ground.value+"'></a>"
		+"<a property='dbo:manager' href='"+teamData.manager.value+"'></a>";
	var stadiumInfo = "<a target='_blank' href='"
		+teamData.ground.value
		+"' class='stadiumName'><span property='dbp:name'>Stadium: "+teamData.groundName.value+"</span></a>"
		+"<img src='"+teamData.groundThumbnail.value+"' property='dbo:thumbnail'/>"
		+"<div class='abstract readMore' property='dbo:abstract'>"+teamData.groundDescription.value+"</div>";
	var managerInfo = "<a target='_blank' href='"
		+teamData.manager.value
		+"' class='managerName' property='dbp:name'>Manager: "+teamData.managerName.value+"</a>"
		+"<img src='"+teamData.managerThumbnail.value+"' property='dbo:thumbnail' />";
	var playerInfo = ""
	$.each(data[team].players.results.bindings, function(i, player) {
		teamInfo += "<a property='dbp:name' href='"+player.player.value+"'></a>"
		playerInfo += "<a target='_blank' href='"
			+player.player.value
			+"' class='player' about='"+player.player.value+"'><div class='playerName' property='dbp:name'>"
			+player.playerName.value
			+"</div><img src='"
			+player.playerPhoto.value
			+"' property='dbo:thumbnail'/><div class='playerPosition' property='dbo:position'>"
			+player.playerPosition.value.replace(" (association football)","")
			+"</div><div class='playerDOB'>DOB: <span property='dbp:birthDate'>"
			+player.playerdob.value
			+"</span></div></a>"
	});
	$('#report #results #'+team+' .teamInfo').empty().append(teamInfo)
		.attr('about',teamData['callret-0'].value)
	$('#report #results #'+team+' .stadiumInfo').empty().append(stadiumInfo)
		.attr('about',teamData.ground.value);
	$('#report #results #'+team+' .managerInfo').empty().append(managerInfo)
		.attr('about',teamData.manager.value);
	$('#report #results #'+team+' .playerInfo').empty().append(playerInfo);
}

function isDark(colour) {
	var red = parseInt(colour.substring(1,3),16);
	var green = parseInt(colour.substring(3,5),16);
	var blue = parseInt(colour.substring(5,7),16);
	var luminance = 0.2126*red + 0.7152*green + 0.0722*blue;
	if(luminance>50) {
		return false;
	} else {
		return true;
	}
}

function showReport() {
	$('#reportCover').delay(830).fadeOut(0);
	$('#football').delay(830).fadeIn(0);
	$('#report #results #teamA').show(0).addClass('flyInLeft');
	$('#report #results #teamB').show(0).addClass('flyInRight');
}