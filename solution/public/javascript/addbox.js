/*$("#addBtn").click(function() {
	alert("test");
	$("#searchContainer").append("<input type='text', name='search_terms' id='search_terms' placeholder='i.e. #paul,hello'/>");
});*/

    $(document).on("click", "#addBtn", function () {
		$("#searchContainer").append(
			"<input type='text', name='search_terms' id='search_terms'"
			+" placeholder='i.e. #paul,hello'/><input type='button'"
			+", value='Delete', id='dltBtn'><br />");
	});
    $(document).on("click", "#dltBtn", function () {
		$(this).prev().remove();
		$(this).next().remove();
    	$(this).remove();
	});