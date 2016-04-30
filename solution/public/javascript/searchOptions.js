/*
 * @author Paul MacDonald
 */

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
/**
 * Adds a listener for a click to everything with id dltBtn
 */
$(document).on("click", "#dltBtn", function () {
	//Checks to see if the search section is currently enabled
	if($(this).closest(".searchSection").find(".enabler").is(':checked')) {
		//Removes the parent element
		$(this).parent().remove();
	}
});
/**
 * Adds a listener for a click to everything with class enabler
 */
$(document).on("change", ".enabler", function() {
	//Gets the id of the section by removing "Search" from its own id
	var parent = this.id.replace("Search","");
	//If it's now checked
	if ($(this).is(':checked')) {
		//Set disabled to false on all inputs and selects
		$(this).parents('.searchSection').find('input,select').prop('disabled',false);
		//Change the colour of text back to normal
		$("#"+parent).css("color","inherit")
	} else { //If it's not checked
		//Disable all inputs and selects
		$(this).parents('.searchSection').find('input,select').prop('disabled','disabled');
		//Remove the disabled attribute on this button
		$(this).removeAttr("disabled");
		//Set the colour of text to grey
		$("#"+parent).css("color","#939393")
	}
})
/**
 * Adds a listener for a change to everything with class andor
 */
$(document).on("change", ".andor", function() {
	//Updated the andors in this section
	updateAndOr(this);
});
/**
 * Updates andors in the section given by the object to the object current value
 * @param object the object that has been changed
 */
function updateAndOr(object) {
	//Gets the value of the object
	var option = $(object).find(":selected").val();
	//Finds the search container and finds all selects with name and or inside of it, for each
	$(object).closest(".searchContainer").find("select[name=andor]").each(function() {
		//It changes the value to the new option
		$(this).val(option);
	});
}
/**
 * Adds a listener for a change to everything with id teamSelect so as to check if other is selected
 */
$(document).on("change", "#teamSelect", function() {
	$('#playerSelect').find('.variable').remove();
	//If the selected value is othedr
	if($(this).find(":selected").val() == "other") {
		//Show the other input box
		$("#otherInput").show("slide",{direction:"up"},100);
		$("#playerSelect").hide();
	} else {
		//Get the team name
		var slug = $(this).find(":selected").attr('id');
		//Hide the other input box
		$("#otherInput").hide("slide",{direction:"up"},100);
		$.get('http://www.airstadium.com/api/v1/athletes?has_profile=true&team_id='+slug)
			.done(function(data) {
				var sorted = data.athletes.sort(sortName);
				$.each(sorted, function(i, player) {
					//Add an option of that team before the other option
					$('#playerSelect').append("<option class='variable' value='"
						+player.twitter_username
						+"'>"
						+player.name
						+"</option>");
				});
				$("#playerSelect").show();
			})
			.fail(function(err) {
				//do nothing
			});		
	}
});
/**
 * Adds a listener for a change to everything with id playerSelect so as to check if other is selected
 */
$(document).on("change", "#playerSelect", function() {
	var selection = $(this).find(":selected");
	$(this).find("#initial").prop('selected', true);
	var container = $(this).closest(".searchSection").find(".searchContainer");
	//Checks to see if the search section is currently enabled
	if($(this).closest(".searchSection").find(".searchInput").first().find("input").val().trim().length == 0) {
		$(this).closest(".searchSection").find(".searchInput").first().find("input").val(selection.val())	
	} else {
		//If it is then it copies the search box to the bottom of the search container
		$(this).closest(".searchSection").find('.searchInput').first().clone().appendTo(container);
		//It replaces the button on the new search box to a delete, rather than an add
		$(this).closest(".searchSection").find(".searchContainer").find(".searchInput:last").find("i").replaceWith("<i class='fa fa-minus fa-lg' id='dltBtn'></i>");
		//It adds an indicator to wether the search is and/or
		$(this).closest(".searchSection").find(".searchContainer").find(".searchInput:last").prepend("<select name='andor' class='andor'><option value='AND'>AND</option><option value='OR'>OR</option></select><br/>");
		//It clears any values already in the new search box
		$(this).closest(".searchSection").find(".searchContainer").find(".searchInput:last").find("input").val(selection.val());
		//It then calls updateAndOr
		updateAndOr($(this).closest(".searchSection").find(".searchContainer").find("select:first"));
	}
	//selection.remove();
});
/**
 * A function to retrieve team names from the database on page load
 */
$(document).ready(function() {
	$.get('http://www.airstadium.com/api/v1/teams?competition_id=premier-league&has_profile=true')
		.done(function(data) {
			var sorted = data.teams.sort(sortName);
			$.each(sorted, function(i, team) {
				//Add an option of that team before the other option
				$('#teamSelect').find('option[name=other]').before("<option value='"
					+team.twitter_username
					+"' id='"
					+team.slug
					+"'>"
					+team.name
					+"</option>");
			});
		})
		.fail(function(err) {
			$('#teamSelect').hide();
			$("#otherInput").show();
		});
});

function sortName(a,b) {
	return b.name < a.name ?  1 
	 : b.name > a.name ? -1
	 : 0; 
}


$(document).on("click", "#hideshow", hideSearch);

function hideSearch() {
	if($('#search').is(":visible")) {
		$('#hideshow').html("<i class='fa fa-plus fa-lg'></i> show the search bar");
		$('#hideshow, #menuBtn').css("color","black")
		$('#search').toggle(300);
	} else {
		$('#hideshow').html("<i class='fa fa-minus fa-lg'></i> hide the search bar");
		$('#hideshow, #menuBtn').css("color","white")
		$('#search').toggle(300);
	}
}