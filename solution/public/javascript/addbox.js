$(document).on("click", "#addBtn", function () {
	$("#searchContainer").append(
		"<div><label name='andor'></label><br /><input type='text', name='search_terms' id='search_terms'"
		+" placeholder='i.e. #paul or hello' required/><input type='button'"
		+", value='Delete', name='dltBtn', id='dltBtn'></div>");
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
$(document).on("change", "#userSearch", function() {
	if ($('#userSearch').is(':checked')) {
		$("#username").removeAttr("disabled"); 
		$("#replies").removeAttr("disabled");  
		$("#mentions").removeAttr("disabled");  
		$("#retweets").removeAttr("disabled"); 
		$("#user").css("color","inherit")
	} else {
		$("#username").attr("disabled", "disabled"); 
		$("#replies").attr("disabled", "disabled");
		$("#mentions").attr("disabled", "disabled");
		$("#retweets").attr("disabled", "disabled");
		$("#user").css("color","#939393")
	}
})
$(document).on("change", "#keywordSearch", function() {
	if ($('#keywordSearch').is(':checked')) {
		$("#searchtermsandor").removeAttr("disabled"); 
		$("#addBtn").removeAttr("disabled");  
		$("input[name=dltBtn]").each(function() {
			$(this).removeAttr("disabled");  
		});
		$("input[name=search_terms]").each(function() {
			$(this).removeAttr("disabled"); 
		});
		$("#keywords").css("color","inherit");
	} else {
		$("#searchtermsandor").attr("disabled", "disabled"); 
		$("#addBtn").attr("disabled", "disabled"); 
		$("input[name=dltBtn]").each(function() {
			$(this).attr("disabled", "disabled");
		});
		$("input[name=search_terms]").each(function() {
			$(this).attr("disabled", "disabled");
		});
		$("#keywords").css("color","#939393");
	}
})