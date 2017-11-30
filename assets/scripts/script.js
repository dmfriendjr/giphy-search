class GiphySearch {
	constructor() {
		this.apiKey = '2nT5ws7Ip0CIL05uELndCzdjrVZy9nuH';
		this.startingTermList =  ['dogs','cats','wolves','elephants','mice','rhinos','hippos','ants', 'german shepherd'];
		this.searchTermList = [];
		this.currentSearchTerm;
		this.searchOffset = 0;
		this.populateButtons();	
	}

	populateButtons() {
		$('#button-container').empty();
			this.startingTermList.forEach((term) => {
			this.addNewButton(term);
		});

		//Starting term list no longer needed
		this.startingTermList = [];
	}

	addNewButton(term) {
		//Check if term exists
		if (this.searchTermList.indexOf(term) !== -1) {
			//Already exists in list
			return;
		}
		
		//Add term to list after formatting
		let searchTerm = term.replace(' ', '+');
		this.searchTermList.push(searchTerm);
		
		//Create button for element and insert term and data-term 
		let newButton = $(`
			<div class='button-wrapper' data-term=${searchTerm}>
				<i class="fa fa-times-circle close-button" aria-hidden="true"></i>		
				<p class='button-label'>${term}</p>
			</div>`);
		
		//Add event listener for click on close button to remove element from list
		newButton.children('.close-button').on('click', (event) => {
				this.searchTermList.splice(this.searchTermList.indexOf($(event.target.parentElement).attr('data-term')),1);
				$(event.target.parentElement).remove();
			});

		//Add event listener for entire button to retrieve gifs for the button click
		newButton.on('click', (event) => {
				this.retrieveGifs($(event.target).attr('data-term'));	
			});

		//Append button to HTML
		$('#button-container').append(newButton);	
	}

	retrieveGifs(term) {
		//Store current search term
		this.currentSearchTerm = term;

		//Construct query string using term and API key
		let queryString = `https://api.giphy.com/v1/gifs/search?&q=${term}&limit=10&offset=${this.searchOffset}&api_key=${this.apiKey}`

		//Do request and display results after response is recieved
		$.ajax({
			url: queryString,
			method: 'GET'
		}).done((response)=>{
			this.displayGifs(response);
		});
	}

	getPreviousPage() {
		this.searchOffset -= 10;
		this.retrieveGifs(this.currentSearchTerm);
	}

	getNextPage() {
		this.searchOffset += 10;
		this.retrieveGifs(this.currentSearchTerm);
	}

	displayGifs(responseList) {
		$('#gif-container').empty();
		if (responseList.data.length === 0) {
			//No results were found
			$('#gif-container').text('Sorry, no results found!');
		}

		responseList.data.forEach((gif) => {
			let newGifWrapper = $('<div>', {
				'class': 'gif-wrapper'
			});

			let newGif = $('<img>', {
				src: gif.images.fixed_height_still.url,
				'class': 'displayed-gif',
				click: (event) => {
					this.toggleGifAnimation(event.target);
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

	toggleGifAnimation(element) {
		let src = $(element).attr('src');

		if (src.indexOf('_s.gif') === -1) {
			//This gif is animated, so stop animated
			src = src.split('.gif');
			src[0] += '_s.gif';
		} else {
			//This gif is not animted, animate it
			src = src.split('_s.gif');
			src[0] += '.gif';
		}

		$(element).attr('src',src[0]);
	}
}

let searchApp = new GiphySearch();

$('#add-term-button').on('click', (event) => {
	//Prevent submit button from refreshing page
	event.preventDefault();
	
	//Get display and search term formatted correctly for each purpose
	let displayTerm = $('#term-input-field').val();
	let searchTerm = displayTerm.replace(' ', '+');
	//Clear input field
	$('#term-input-field').val('');

	searchApp.addNewButton(displayTerm);
	searchApp.retrieveGifs(searchTerm);
});

$('#next-page-button').on('click', (event) => {
	searchApp.getNextPage();
});

$('#previous-page-button').on('click', (event) => {
	searchApp.getPreviousPage();
});
