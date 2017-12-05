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
			this.getNextPage();
		});

		$('#previous-page-button').on('click', (event) => {
			this.getPreviousPage();
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
		$('#button-container').empty();
			this.startingTermList.forEach((term) => {
			this.addNewButton(term);
		});

		//Starting term list no longer needed
		this.startingTermList = [];
		this.initialized = true;
		//Hide next/previous page buttons until search has been done
		$('#next-page-button').hide();
		$('#previous-page-button').hide();
	}

	//Removes any special characters etc. in string provided
	processString(string) {
		//Remove ampersands and replace with concatenation so it doesnt break query string
		return string.replace('&', '+');
	}

	//Adds a new button to the button list if it doesn't already exist, and searches the term
	addNewButton(term) {
		if (this.searchTermList.indexOf(term) !== -1) {
			//Already exists in list, just do a search
			this.retrieveGifs(this.processString(term));
			return;
		}
		
		let searchTerm = this.processString(term);
		this.searchTermList.push(searchTerm);
		
		let newButton = $(`
			<div class='button-wrapper' data-term='${searchTerm}'>
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
				//Ensure page number and offset are reset
				this.currentPageNumber = 0;
				this.searchOffset = 0;
				this.retrieveGifs($(event.target).attr('data-term'));	
			});

		$('#button-container').append(newButton);	
	
		//Only retrieve gifs after initial buttons added
		if (this.initialized) {
			this.retrieveGifs(searchTerm);
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

	
		responseList.data.forEach((gif) => {
			let newGifWrapper = $('<div>', {
				'class': 'gif-wrapper'
			});

			let newGif = $('<img>', {
				src: this.autoplayGifs ? gif.images.fixed_height.url : gif.images.fixed_height_still.url,
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

		//Round down number of pages since our pages start at 0, not 1
		this.numberOfPages = Math.floor(this.resultCount/this.resultsPerPage);
		
		this.updatePageControls();
	}

	goToPage(targetPage) {
		this.currentPageNumber = targetPage;
		this.searchOffset = targetPage * this.resultsPerPage;
		this.retrieveGifs(this.currentSearchTerm);
	}
	
	getPreviousPage() {
		this.currentPageNumber--;
		this.goToPage(this.currentPageNumber);
	}

	getNextPage() {
		this.currentPageNumber++;
		this.goToPage(this.currentPageNumber);
	}

	updatePageControls() {	
		//Handle next/previous page buttons
		if (this.searchOffset === 0) {
			$('#previous-page-button').hide();
		} else {
			$('#previous-page-button').show();
		}

		if (this.searchOffset + this.resultsPerPage > this.resultCount) {
			//At the end of the results, no next page
			$('#next-page-button').hide();
		} else {
			$('#next-page-button').show();
		}

		$('#goto-page-controls-wrapper').empty();

		//Only display page number buttons if there are results
		if (this.resultCount > 0)
		{
			//Create up to 10 buttons for pages
			//Start buttons at 0, or current page-4
			let pageOptionStart = Math.max(0,this.currentPageNumber-4);
			//End buttons at page+5, or 9 if page is 0, and limit to number of pages
			let pageOptionEnd = Math.min(Math.max(9,this.currentPageNumber+5),this.numberOfPages);

			for(let i = pageOptionStart; i <= pageOptionEnd; i++) {
				let newPageButton = $('<input>', {
					'type': 'button',
					'class': i === this.currentPageNumber ? 'goto-page-button active-page' : 'goto-page-button',
					'data-page': i,
					'value': i+1
								
				});
				
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

	toggleGifAnimation(element, forcePlay, forcePause) {
		let src = $(element).attr('src');

		let rawSrc = src.slice(0,src.indexOf('.gif'));

		if (rawSrc.indexOf('_s') === -1) {
			//This was animated
			if (forcePlay) {
				//Force play, so dont add _s
				rawSrc += '.gif';
			} else {
				rawSrc += '_s.gif';
			}
		} else {
			//This was not animated
			if (forcePause) {
				//Force pause, so don't strip _s
				rawSrc += '.gif';
			} else {
				rawSrc = rawSrc.slice(0,rawSrc.indexOf('_s'));
				rawSrc += '.gif';
			}
		}

		$(element).attr('src',rawSrc);
	}
}

let searchApp = new GiphySearch();


