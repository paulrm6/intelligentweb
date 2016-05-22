/**
 * @author Paul MacDonald <prmacdonald1@sheffield.ac.uk>
 * @module Images
 */
/**
 * Add a listener to the thumbnail images
 */
$(document)
	.on('click', '#flickr img', function() {
		//Hide the inner gallery so you can't see the picture loading
		$('#innerGallery')
			.empty()
			.hide();
		//Fade in the gallery
		$('#gallery')
			.fadeIn(200);
		//Get the link
		var link = $(this)
			.attr("largesrc");
		//Create the html code
		var img = "<img src='" + link + "'/>";
			//Add the html code to the innerGallery
		$('#innerGallery')
			.append(img);
		//When the image is loaded
		$('#innerGallery img')
			.on('load', function() {
				//Fade in the inner gallery
				$('#innerGallery')
					.fadeIn(100);
			});
	});
/**
 * On click of the hide gallery button
 */
$(document)
	.on('click', '#hideGallery', function() {
		//Hide the gallery
		$('#gallery')
			.fadeOut(200);
	});
/**
 * On click of the gallery window
 */
$(document)
	.on('click', '#gallery', function(e) {
		//Check if the click was on the picture
		if (e.target === this) {
			//Hide the gallery
			$('#gallery')
				.fadeOut(200);
		}
	});
/**
 * On click of the inner gallery window
 */
$(document)
	.on('click', '#innerGallery', function(e) {
		//Check if the click was on the picture
		if (e.target === this) {
			//Hide the gallery
			$('#gallery')
				.fadeOut(200);
		}
	});