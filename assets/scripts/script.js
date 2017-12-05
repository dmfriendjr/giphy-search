class GiphySearch {
	constructor() {
		this.apiKey = '2nT5ws7Ip0CIL05uELndCzdjrVZy9nuH';
		this.startingTermList =  ['dogs','cats','wolves','elephants','mice','rhinos','hippos','ants', 'german shepherd'];
		this.searchTermList = [];
		this.currentSearchTerm = "";
		this.resultsPerPage = 10;
		this.displayRatings = true;
		this.autoplayGifs = false;
		this.initialized = false;
		this.searchOffset = 0;
		this.resultCount;
		this.numberOfPages;
		this.currentPageNumber = 0;
		this.populateButtons();	

		$('#number-results').change((event) => {
			this.resultsPerPage = parseInt($(event.target).val());
			if (this.currentSearchTerm.length !== 0) {
				this.retrieveGifs(this.currentSearchTerm);
			}
		});

		$('#next-page-button').on('click', (event) => {
			this.goToPage(this.currentPageNumber + 1);
		});

		$('#previous-page-button').on('click', (event) => {
			this.goToPage(this.currentPageNumber - 1);	
		});
		
		//Add event listener for add term button click/submit
		$('#add-term-button').on('click', (event) => {
			//Prevent submit button from refreshing page
			event.preventDefault();
			
			//Get display and search term formatted correctly for each purpose
			let displayTerm = $('#term-input-field').val();
			let searchTerm = displayTerm.replace(' ', '+');
			//Clear input field
			$('#term-input-field').val('');
			//Add new button
			this.addNewButton(displayTerm);
		});

		$('#display-ratings').change((event) => {
			this.displayRatings = $(event.target).prop('checked');
			//Toggle ratings display show/hide based on checkbox value
			$('.gif-rating').each( (index,rating) => {
				this.displayRatings? $(rating).show() : $(rating).hide();	
			});

		});

		$('#autoplay-gifs').change((event) => {
			this.autoplayGifs = $(event.target).prop('checked');
			$('.displayed-gif').each( (index, gif) => {
				this.toggleGifAnimation(gif, this.autoplayGifs, !this.autoplayGifs);	
			});
		});
	}

	//Creates search buttons from premade list of terms
	populateButtons() {
		//Retrieve term list
		let termList; 
		if (localStorage.getItem('searchTerms') === null) {
			termList = this.startingTermList;
		} else {
			termList = localStorage.getItem('searchTerms').split(',');
		}

		$('#button-container').empty();
			termList.forEach((term) => {
			this.addNewButton(term);
		});

		//Starting term list no longer needed
		this.startingTermList = [];
		this.initialized = true;
		//Hide next/previous page buttons until search has been done
		$('#next-page-button').hide();
		$('#previous-page-button').hide();
	}

	//Remove problematic characters
	processString(string) {
		string = string.replace(/&/g, '+');
		return string.replace(/,/g, ' ');
	}


	//Adds a new button to the button list if it doesn't already exist, and searches the term
	addNewButton(term) {	
		let searchTerm = this.processString(term);

		if (this.searchTermList.indexOf(term) !== -1) {
			//Already exists in list, just do a search
			this.retrieveGifs(searchTerm);
			return;
		}
		
		this.searchTermList.push(searchTerm);
		
		let newButton = $(`
			<div class='button-wrapper' data-term='${searchTerm}'>
				<p class='button-label'>${term}</p>
				<i class="fa fa-times-circle close-button" aria-hidden="true"></i>		
			</div>`);
		
		//Add event listener for click on close button to remove element from list
		newButton.children('.close-button').on('click', (event) => {
				this.searchTermList.splice(this.searchTermList.indexOf($(event.target.parentElement).attr('data-term')),1);
				this.saveStartingButtons();
				$(event.target.parentElement).remove();
			});

		//Add event listener for entire button to retrieve gifs for the button click
		newButton.on('click', (event) => {
				//Ensure page number and offset are reset
				this.currentPageNumber = 0;
				this.searchOffset = 0;
				this.retrieveGifs($(event.target).attr('data-term'));	
			});

		$('#button-container').append(newButton);	
	
		//Only retrieve gifs after initial buttons added
		if (this.initialized) {
			this.retrieveGifs(searchTerm);
			this.saveStartingButtons();
		}
	}

	saveStartingButtons() {
		localStorage.clear();
		if (this.searchTermList.length > 0) {
			localStorage.setItem('searchTerms',this.searchTermList.toString());
		}
	}

	retrieveGifs(term) {
		this.currentSearchTerm = term;

		let queryString = `https://api.giphy.com/v1/gifs/search?&q=${term}&limit=${this.resultsPerPage}&offset=${this.searchOffset}&api_key=${this.apiKey}`

		$.ajax({
			url: queryString,
			method: 'GET'
		}).done((response)=>{
			this.displayGifs(response);
		});
	}

	displayGifs(responseList) {
		$('#gif-container').empty();
		if (responseList.data.length === 0) {
			//No results were found
			$('#gif-container').text('Sorry, no results found!');
		}

		//Get screen viewport width
		let width = $(window).width();



		responseList.data.forEach((gif) => {
			let sourceUrlStill;
			let sourceUrlAnimate;
			if (width < 1200) {
				sourceUrlStill = gif.images.fixed_width_still.url;
				sourceUrlAnimate = gif.images.fixed_width.url;
			} else {
				sourceUrlStill = gif.images.fixed_height_still.url;
				sourceUrlAnimate = gif.images.fixed_height.url;
			}

			let newGifWrapper = $('<div>', {
				'class': 'gif-wrapper'
			});


			let newGif = $('<img>', {
				src: this.autoplayGifs ? sourceUrlAnimate : sourceUrlStill,
				'data-animated': this.autoplayGifs,
				'data-url-still': sourceUrlStill,
				'data-url-animate': sourceUrlAnimate,
				'class': 'displayed-gif',
				'alt': gif.title,
				click: (event) => {
					this.toggleGifAnimation(event.target, false, false);
				}
			});

			newGifWrapper.append(newGif);

			if (this.displayRatings) {
				let newGifRating = $('<span>', {
				'class': 'gif-rating',
				text: `Rating: ${gif.rating.toUpperCase()}`
				});

				newGifWrapper.append(newGifRating);
			}

			$('#gif-container').append(newGifWrapper);	
		});

		this.resultCount = responseList.pagination.total_count;

		//Giphy API limits offset to 5000, so max offset request can be 4999-resultsToDisplay		
		//Round down number of pages since our pages start at 0, not 1
		let maxOffset = Math.min(this.resultCount,(4999-this.resultsPerPage));
		this.numberOfPages = Math.floor(maxOffset/this.resultsPerPage);
		this.updatePageControls();
	}

	toggleGifAnimation(element, forcePlay, forcePause) {
		let gifIsAnimated = $(element).attr('data-animated');
	
		//Do nothing if gif already meets force mode requirements
		if ( (gifIsAnimated === 'true' && forcePlay) ||(gifIsAnimated === 'false' && forcePause )) {
			return;
		} else {
			//Toggle animation
			if (gifIsAnimated === 'true') {
				$(element).attr('src', $(element).attr('data-url-still'));
				$(element).attr('data-animated', false);
			} else {
				$(element).attr('src', $(element).attr('data-url-animate'));
				$(element).attr('data-animated', true);
			}
		}
	}	
	
	goToPage(targetPage) {
		this.currentPageNumber = targetPage;
		this.searchOffset = targetPage * this.resultsPerPage;
		this.retrieveGifs(this.currentSearchTerm);
	}
	
	updatePageControls() {	
		if (this.searchOffset === 0) {
			$('#previous-page-button').hide();
		} else {
			$('#previous-page-button').show();
		}

		if (this.currentPageNumber >= this.numberOfPages) {
			//At the end of the results, no next page
			$('#next-page-button').hide();
		} else {
			$('#next-page-button').show();
		}

		$('#goto-page-controls-wrapper').empty();

		//Only display page number buttons if there are results
		if (this.resultCount > 0)
		{
			//Start buttons at 0, or current page-3
			let pageOptionStart = Math.max(0,this.currentPageNumber-3);
			//End buttons at page+4, or 8 if page is 0, and limit to number of pages
			let pageOptionEnd = Math.min(Math.max(7,this.currentPageNumber+3),this.numberOfPages);

			if (pageOptionStart > 1) { 
				//Display shortcut button to first page
				let newPageButton = $('<input>', {
					'type': 'button',
					'class': 'goto-page-button',
					'data-page': 0,
					'value': 1		
				});


				let shortcutIndication = $('<span>', {
					text: '...'
				});

				$('#goto-page-controls-wrapper').append(newPageButton);
				$('#goto-page-controls-wrapper').append(shortcutIndication);	
			}

			for(let i = pageOptionStart; i <= pageOptionEnd; i++) {
				let newPageButton = $('<input>', {
					'type': 'button',
					'class': i === this.currentPageNumber ? 'goto-page-button active-page' : 'goto-page-button',
					'data-page': i,
					'value': i+1
								
				});
				
				$('#goto-page-controls-wrapper').append(newPageButton);
			}

			//Create shortcut button to last page
			if(pageOptionEnd < this.numberOfPages) {
				let newPageButton = $('<input>', {
					'type': 'button',
					'class': 'goto-page-button',
					'data-page': this.numberOfPages,
					'value': this.numberOfPages+1		
				});


				let shortcutIndication = $('<span>', {
					text: '...'
				});

				$('#goto-page-controls-wrapper').append(shortcutIndication);
				$('#goto-page-controls-wrapper').append(newPageButton);
			}

			//Listen for click on each page button
			$('.goto-page-button').on('click', (event) => {
				let targetPage = $(event.target).attr('data-page');
				this.goToPage(parseInt(targetPage));
			});

			//Set active page button class
			$('.goto-page-button').find(`[data-page='${this.currentPageNumber}']`).addClass('active-page');
		}

		$('.results-count-display').text(`${this.resultCount} Results`);
	}
}

let searchApp = new GiphySearch();


