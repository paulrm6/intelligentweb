/**
 * Shows and hides the tabs for inital load
 */
function show() {
	$("#tweets").show();
	$("#analysis").hide();	
}

/**
 * Adds a listener to the Analysis tab button 
 */
$(document).on("click", "#analysisTabSelector", function () {
	// removes the not selected class from the button that was clicked and adds it to the other
	$(this).removeClass("notSelected");
	$("#tweetsTabSelector").addClass("notSelected");
	// slides the tweets window out and the analysis window in
	$("#tweets").hide("slide",{direction:"left"},1000);
	$("#analysis").show("slide",{direction:"right"},1000);
});

/**
 * Adds a listener to the Tweets tab button 
 */
$(document).on("click", "#tweetsTabSelector", function () {
	// removes the not selected class from the button that was clicked and adds it to the other
	$(this).removeClass("notSelected");
	$("#analysisTabSelector").addClass("notSelected");
	// slides the analysis window out and the tweets window in
	$("#tweets").show("slide",{direction:"left"},1000);
	$("#analysis").hide("slide",{direction:"right"},1000);
});