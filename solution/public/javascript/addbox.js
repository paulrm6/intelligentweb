$(document).on("click", "#addBtn", function () {
	$("#searchContainer").append(
		"<div><label name='andor'></label><br /><label class='beforeInput'>#</label><input type='text' class='label hashtag' name='hashtagBox' id='search_terms' placeholder='ManUtdVArsenal' required/><i class='fa fa-minus fa-lg' id='dltBtn'></i></div>");
	updateAndOr();
	lockInput();
});
$(document).on("click", "#dltBtn", function () {
	$(this).parent().remove();
});
$(document).on("change", "#hashtagandor", function() {
	updateAndOr();
});
function updateAndOr() {
	$("label[name=andor]").each(function() {
		$(this).text($("#hashtagandor").find(":selected").text());
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
$(document).on("change", "#hashtagSearch", function() {
	lockInput();
});

function lockInput() {
	if ($('#hashtagSearch').is(':checked')) {
		$("#hashtagandor").removeAttr("disabled"); 
		$("#addBtn").removeAttr("disabled");  
		$("input[name=dltBtn]").each(function() {
			$(this).removeAttr("disabled");  
		});
		$("input[name=hashtagBox]").each(function() {
			$(this).removeAttr("disabled"); 
		});
		$("#keywords").css("color","inherit");
	} else {
		$("#hashtagandor").attr("disabled", "disabled"); 
		$("#addBtn").attr("disabled", "disabled"); 
		$("input[name=dltBtn]").each(function() {
			$(this).attr("disabled", "disabled");
		});
		$("input[name=hashtagBox]").each(function() {
			$(this).attr("disabled", "disabled");
		});
		$("#keywords").css("color","#939393");
	}

}