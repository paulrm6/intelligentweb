/*$("#addBtn").click(function() {
	alert("test");
	$("#searchContainer").append("<input type='text', name='search_terms' id='search_terms' placeholder='i.e. #paul,hello'/>");
});*/

    $(document).on("click", "#addBtn", function () {
    	if($("#search_terms").length == 0) {
			$("#searchContainer").append(
				"<div><input type='text', name='search_terms' id='search_terms'"
				+" placeholder='i.e. #paul or hello'/><input type='button'"
				+", value='Delete', id='dltBtn'></div>");
    	} else {
			$("#searchContainer").append(
				"<div><label name='andor'></label><br /><input type='text', name='search_terms' id='search_terms'"
				+" placeholder='i.e. #paul or hello'/><input type='button'"
				+", value='Delete', id='dltBtn'></div>");
    	}
    	updateAndOr();
	});
    $(document).on("click", "#dltBtn", function () {
		$(this).parent().remove();
		$(this).prev().remove();
		$(this).next().remove();
    	$(this).remove();
	});
	$(document).on("change", "#searchtermsandor", function() {
		updateAndOr();
	});
	function updateAndOr() {
		$("label[name=andor]").each(function() {
			$(this).text($("#searchtermsandor").find(":selected").text());
		});
	}