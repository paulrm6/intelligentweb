$(document)
	.on("click", "#report .button", function() {
		//When a button on the form is clicked to submit, check the validity of the form
		var valid = $('#reportForm')[0].checkValidity();
		if (valid) {
			//If it's valid, fade in the loading cover
			$('#reportCover').fadeIn(500);
			$('#football').hide(0);
			$('#report #results #teamA').hide(0).removeClass('flyInLeft');
			$('#report #results #teamB').hide(0).removeClass('flyInRight');
			callSearchReport();
		} else {
			//Imitate a submit click on the form so the HTML5 valid checker with give errors to the user
			$('<input type="submit">')
				.hide()
				.appendTo($('#reportForm'))
				.click()
				.remove();
		}
	});


function callSearchReport() {
		var data = {
			teamA: $('#reportForm #teamA').val(),
			teamB: $('#reportForm #teamB').val()
		};
		//Create an ajax http request
		$.ajax({
			type: "POST", //Set type to post
			url: '/report', //Set url depending on search type
			//The datatype and content type should be json
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(data), //Add the data, in a string format
			success: function(data) { //on success (200)
				//Initiate data population
				console.log(data);
				$('#reportCover').delay(830).fadeOut(0);
				$('#football').delay(830).fadeIn(0);
				$('#report #results #teamA').show(0).addClass('flyInLeft');
				$('#report #results #teamB').show(0).addClass('flyInRight');
			},
			error: function(data) { //on error
				//Initiate error population
				console.log(data);
				$('#cover').fadeOut(500);
			}
		});
	}