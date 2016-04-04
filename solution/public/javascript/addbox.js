/**
 * Adds a listener for a click to everything with id addBtn 
 */
$(document).on("click", "#addBtn", function () {
	//Checks to see if the search section is currently enabled
	if($(this).closest(".searchSection").find(".enabler").is(':checked')) {
		//If it is then it copies the search box to the bottom of the search container
		$(this).closest('.searchInput').clone().appendTo(this.closest(".searchContainer"));
		//It replaces the button on the new search box to a delete, rather than an add
		$(this).closest(".searchContainer").find(".searchInput:last").find("i").replaceWith("<i class='fa fa-minus fa-lg' id='dltBtn'></i>");
		//It adds an indicator to wether the search is and/or
		$(this).closest(".searchContainer").find(".searchInput:last").prepend("<label name='andor'></label><br />");
		//It clears any values already in the new search box
		$(this).closest(".searchContainer").find(".searchInput:last").find("input").val("");
		//It then calls updateAndOr
		updateAndOr();
	}
});
$(document).on("click", "#dltBtn", function () {
	if($(this).closest(".searchSection").find(".enabler").is(':checked')) {
		$(this).parent().remove();
	}
});
$(document).on("change", ".enabler", function() {
	var parent = this.id.replace("Search","");
	if ($(this).is(':checked')) {
		$(this).parent().parent().find('input,select').prop('disabled',false);
		$("#"+parent).css("color","inherit")
	} else {
		$(this).parent().parent().find('input,select').prop('disabled','disabled');
		$(this).removeAttr("disabled");
		$("#"+parent).css("color","#939393")
	}
})
$(document).on("change", ".andor", function() {
	updateAndOr();
});
function updateAndOr() {
	$("label[name=andor]").each(function() {
		var option = $(this).closest(".searchSection").find(".andor").find(":selected").text();
		$(this).text(option);
	});
}