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

$(document).on("click", ".menuBtn, #menuBtn", function () {
    window.location.hash = this.id.substring(0,this.id.length-3);
});

$(document).ready(function() {
	if(window.location.hash == "#twitter" || window.location.hash == "#report") {
		$(window.location.hash).show();
		$('#menu').hide();
	}
})

$(window).on("hashchange", function() {
	if(window.location.hash == "#twitter" || window.location.hash == "#report") {
		$(window.location.hash).delay(150).fadeIn(150);
		$('#menu').fadeOut(150);
	} else {
		$('#twitter, #report').fadeOut(150);
		$('#menu').delay(150).fadeIn(150);
	}
});