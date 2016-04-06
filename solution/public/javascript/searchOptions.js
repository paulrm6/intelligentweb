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
		$(this).closest(".searchContainer").find(".searchInput:last").prepend("<select name='andor' class='andor'><option value='AND'>AND</option><option value='OR'>OR</option></select><br/>");
		//It clears any values already in the new search box
		$(this).closest(".searchContainer").find(".searchInput:last").find("input").val("");
		//It then calls updateAndOr
		updateAndOr($(this).closest(".searchContainer").find("select:first"));
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
	updateAndOr(this);
});
function updateAndOr(object) {
	var option = $(object).find(":selected").val();
	$(object).closest(".searchContainer").find("select[name=andor]").each(function() {
		$(this).val(option);
	});
}
$(document).on("change", "#teamSelect", function() {
	if($(this).find(":selected").val() == "other") {
		$("#otherInput").show("slide",{direction:"up"},100);
	} else {
		$("#otherInput").hide("slide",{direction:"up"},100);		
	}
});
$(document).ready(function() {
	$.get('/teaminfo',{ type: "team" })
	.done(function(data){
		$.each(data, function(i, team) {
			$('#teamSelect').append("<option value='"
				+team.handle
				+"'>"
				+team.name
				+"</option>");
		});
		$('#teamSelect').append("<option value='other'>Other...</option>");
	})
	.fail(function(err) {
		$('#teamSelect').append("<option value='other'>Other...</option>");
		alert(err.responseText);
	});
});