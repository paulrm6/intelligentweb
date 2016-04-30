/*
 * @author Paul MacDonald
 */

/**
 * Adds a listener to the Analysis tab button 
 */
$(document).on("click", "#analysisTabSelector", function () {
	// removes the not selected class from the button that was clicked and adds it to the other
	$(this).removeClass("notSelected");
	$("#tweetsTabSelector").addClass("notSelected");
	// slides the tweets window out and the analysis window in
	$("#tweets").hide("slide",{direction:"left"},500);
	$("#analysis").show("slide",{direction:"right"},500);
	google.maps.event.trigger(map, 'resize');
	map.setCenter(new google.maps.LatLng(53.381, -1.470))
});

/**
 * Adds a listener to the Tweets tab button 
 */
$(document).on("click", "#tweetsTabSelector", function () {
	// removes the not selected class from the button that was clicked and adds it to the other
	$(this).removeClass("notSelected");
	$("#analysisTabSelector").addClass("notSelected");
	// slides the analysis window out and the tweets window in
	$("#tweets").show("slide",{direction:"left"},500);
	$("#analysis").hide("slide",{direction:"right"},500);
	google.maps.event.trigger(map, 'resize');
	map.setCenter(new google.maps.LatLng(53.381, -1.470))
});

$(document).on("click", "#twitterBtn", function () {
	$('#menu').fadeOut(100);
	$('#searchTwitter').delay(100).fadeIn(100);
});

$(document).on("click", "#reportBtn", function () {
	$('#menu').fadeOut(100);
	$('#report').delay(100).fadeIn(100);
});

$(document).on("click", "#menuBtn", function () {
	$('#searchTwitter, #report').fadeOut(100);
	$('#menu').delay(100).fadeIn(100);
});