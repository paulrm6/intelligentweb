/*
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module Tabs
 */
/**
 * If a menu button is cicked
 */
$(document)
	.on("click", ".menuBtn, #menuBtn", function() {
		//Change the hash to the id without Btn on the end
		window.location.hash = this.id.substring(0, this.id.length - 3);
	});
/**
 * When the document is loaded
 */
$(document)
	.ready(function() {
		//Hide the results section
		$('#results')
			.hide();
		//If the current hash is either twitter or report
		if (window.location.hash == "#twitter" || window.location.hash == "#report") {
			//Show the correct tab
			$(window.location.hash)
				.show();
			//Hide the menu
			$('#menu')
				.hide();
		}
	});
/**
 * When the hash is changed
 */
$(window)
	.on("hashchange", function() {
		//If the hash is either tiwtter or the report
		if (window.location.hash == "#twitter" || window.location.hash == "#report") {
			//Show the correct tab
			$(window.location.hash)
				.delay(150)
				.fadeIn(150);
			//Hide the menu
			$('#menu')
				.fadeOut(150);
		} else {
			//Hide twitter and report
			$('#twitter, #report')
				.fadeOut(150);
			//Show the menu
			$('#menu')
				.delay(150)
				.fadeIn(150);
		}
	});