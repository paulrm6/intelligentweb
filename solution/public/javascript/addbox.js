$(document).on("click", "#addBtn", function () {
	if($(this).closest(".searchSection").find(".enabler").is(':checked')) {
		$(this).closest('.searchInput').clone().appendTo(this.closest(".searchContainer"));
		$(this).closest(".searchContainer").find(".searchInput:last").find("i").remove();
		$(this).closest(".searchContainer").find(".searchInput:last").prepend("<label name='andor'></label><br />");
		$("<i class='fa fa-minus fa-lg' id='dltBtn'></i>").insertAfter($(this).closest(".searchContainer").find(".searchInput:last").find("input:first"));
		$(this).closest(".searchContainer").find(".searchInput:last").find("input").val("");
		//$(this).closest("#searchContainer").append(
		//	"<div><label name='andor'></label><br /><label class='beforeInput'>#</label><input type='text' class='label hashtag' name='hashtagBox' id='search_terms' placeholder='ManUtdVArsenal' required/><i class='fa fa-minus fa-lg' id='dltBtn'></i></div>");
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