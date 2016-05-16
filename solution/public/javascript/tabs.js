/*
 * @author Paul MacDonald
 */

$(document).on("click", ".menuBtn, #menuBtn", function () {
    window.location.hash = this.id.substring(0,this.id.length-3);
});

$(document).ready(function() {
	$('#results').hide();
	if(window.location.hash == "#twitter" || window.location.hash == "#report") {
		$(window.location.hash).show();
		$('#menu').hide();
	}
})

$(window).on("hashchange", function() {
	if(window.location.hash == "#twitter" || window.location.hash == "#report") {
		$(window.location.hash).delay(150).fadeIn(150);
		$('#menu').fadeOut(150);
	} else {
		$('#twitter, #report').fadeOut(150);
		$('#menu').delay(150).fadeIn(150);
	}
});