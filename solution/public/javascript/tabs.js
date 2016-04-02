function show() {
	$("#tweets").show();
	$("#analysis").hide();	
}

$(document).on("click", "#analysisTabSelector", function () {
	$(this).removeClass("notSelected");
	$("#tweetsTabSelector").addClass("notSelected");
	$("#tweets").hide("slide",{direction:"left"},1000);
	$("#analysis").show("slide",{direction:"right"},1000);
});

$(document).on("click", "#tweetsTabSelector", function () {
	$(this).removeClass("notSelected");
	$("#analysisTabSelector").addClass("notSelected");
	$("#tweets").show("slide",{direction:"left"},1000);
	$("#analysis").hide("slide",{direction:"right"},1000);
});