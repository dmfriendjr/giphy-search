let apiKey = '2nT5ws7Ip0CIL05uELndCzdjrVZy9nuH';
let searchTermList = ['dogs','cats','wolves','elephants','mice','rhinos','hippos','ants', 'german shepherd'];

populateButtons();

function populateButtons() {
	$('#button-container').empty();
	searchTermList.forEach((term) => {
		addNewButton(term, term.replace(' ', '+'));
	});
}

function addNewButton(displayTerm, searchTerm) {
	let newButton = $(`
		<div class='button-wrapper' data-term=${searchTerm}>
			<i class="fa fa-times-circle close-button" aria-hidden="true"></i>		
			<p class='button-label'>${displayTerm}</p>
		</div>`);
		
		newButton.on('click', (event) => {
			retrieveGifs($(event.target).attr('data-term'));	
		});
		$('#button-container').append(newButton);	
}

function spacesToAmpersands(targetString) {
	return targetString.replace(' ', '&');
}

function retrieveGifs(term) {
	let queryString = `https://api.giphy.com/v1/gifs/search?&q=${term}&api_key=${apiKey}`
	$.ajax({
		url: queryString,
		method: 'GET'
	}).done((response)=>
		{
			displayGifs(response);
			console.log(response);
		});
}

function displayGifs(responseList) {
	$('#gif-container').empty();
	responseList.data.forEach((gif) => {
		let newGifWrapper = $('<div>', {
			'class': 'gif-wrapper'
		});

		let newGif = $('<img>', {
			src: gif.images.fixed_height_still.url,
			'class': 'displayed-gif',
			click: (event) => {
				toggleGifAnimation(event.target);
			}
		});

		let newGifRating = $('<span>', {
			'class': 'gif-rating',
			text: `Rating: ${gif.rating.toUpperCase()}`
		});
		newGifWrapper.append(newGif);
		newGifWrapper.append(newGifRating);

		$('#gif-container').append(newGifWrapper);	
	});
}

function toggleGifAnimation(element) {
	let src = $(element).attr('src');

	if (src.indexOf('_s.gif') === -1) {
		//This gif is animated, so stop animated
		console.log('Animated, stopping animation');
		src = src.split('.gif');
		src[0] += '_s.gif';
	} else {
		//This gif is not animted, animate it
		src = src.split('_s.gif');
		src[0] += '.gif';
	}

	$(element).attr('src',src[0]);
}


$('#add-term-button').on('click', () => {
	let displayTerm = $('#term-input-field').val();
	let searchTerm = displayTerm.replace(' ', '+');

	searchTermList.push(searchTerm);
	addNewButton(displayTerm, searchTerm);
});

$('.close-button').on('click', (event) => {
	searchTermList.splice(searchTermList.indexOf($(event.target.parentElement).attr('data-term')),1);
	$(event.target.parentElement).remove();
});
