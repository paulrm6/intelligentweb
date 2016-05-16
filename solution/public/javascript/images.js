$(document).on('click','#flickr img',function() {
	$('#innerGallery').empty().hide();
	$('#gallery').fadeIn(200);
	var link = $(this).attr("largesrc");
	var img = "<img src='"+link+"'/>"
	$('#innerGallery').append(img);
	$('#innerGallery img').on('load', function() {
		$('#innerGallery').fadeIn(100);
	})
})

$(document).on('click','#hideGallery',function() {
	$('#gallery').fadeOut(200);
})
$(document).on('click','#gallery',function(e) {
	if(e.target === this) {
		$('#gallery').fadeOut(200);
	}
})
$(document).on('click','#innerGallery',function(e) {
	if(e.target === this) {
		$('#gallery').fadeOut(200);
	}
})