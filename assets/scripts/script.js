class GiphySearch {
	constructor() {
		this.apiKey = '2nT5ws7Ip0CIL05uELndCzdjrVZy9nuH';
		this.startingTermList =  ['dogs','cats','wolves','elephants','mice','rhinos','hippos','ants', 'german shepherd'];
		this.searchTermList = [];
		this.currentSearchTerm = "";
		this.resultsPerPage = 10;
		this.displayRatings = true;
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

		//Add event listener for next/previous page buttons
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
			if (!this.displayRatings) {
				//Remove all current ratings displayed
				$('.gif-rating').each( (index,rating) => {
					rating.remove();	
				});
			} else {
				//Not storing ratings anywhere, have to re-request the gifs
				this.retrieveGifs(this.currentSearchTerm);
			}
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
		//Check if term exists
		if (this.searchTermList.indexOf(term) !== -1) {
			//Already exists in list
			return;
		}
		
		//Add term to list after formatting
		let searchTerm = this.processString(term);
		this.searchTermList.push(searchTerm);
		
		//Create button for element and insert term display label and data-term 
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

		//Append button to HTML
		$('#button-container').append(newButton);	
		
		//Check if initialization of starting buttons have been added
		//doing a query for every button added to prevent making a ton of requests
		//the user won't see
		if (this.initialized) {
			this.retrieveGifs(searchTerm);
		}
	}

	//Does ajax request to giphy api for the given term
	retrieveGifs(term) {
		//Store current search term
		this.currentSearchTerm = term;

		//Construct query string using term and API key
		let queryString = `https://api.giphy.com/v1/gifs/search?&q=${term}&limit=${this.resultsPerPage}&offset=${this.searchOffset}&api_key=${this.apiKey}`

		//Do request and display results after response is recieved
		$.ajax({
			url: queryString,
			method: 'GET'
		}).done((response)=>{
			this.displayGifs(response);
		});
	}


	//Takes giphy api data response and appends each gif to the html, or displays no results found if there were no results
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
				'alt': gif.title,
				click: (event) => {
					this.toggleGifAnimation(event.target);
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

		//Store search result count
		this.resultCount = responseList.pagination.total_count;

		//Round down number of pages so it is an integer
		this.numberOfPages = Math.floor(this.resultCount/this.resultsPerPage);
		
		//Update page number navigation controls
		this.updatePageControls();
	}

	//Changes currentPageNumber and searchOffset then retrieves gifs for current search term
	goToPage(targetPage) {
		this.currentPageNumber = targetPage;
		this.searchOffset = targetPage * this.resultsPerPage;
		this.retrieveGifs(this.currentSearchTerm);
	}
	
	//Decrements page number by one and goes to that page
	getPreviousPage() {
		this.currentPageNumber--;
		this.goToPage(this.currentPageNumber);
	}

	//Increments page number by one and goes to that page
	getNextPage() {
		this.currentPageNumber++;
		this.goToPage(this.currentPageNumber);
	}

	//Handles enabling/disabling next previous page button and displaying goto page number buttons based on number of results
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

		//Empty current goto buttons
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
				//Get page data
				let targetPage = $(event.target).attr('data-page');
				//Pass page as int to goToPage
				this.goToPage(parseInt(targetPage));
			});

			//Set active page button class
			$('.goto-page-button').find(`[data-page='${this.currentPageNumber}']`).addClass('active-page');
		}
		//Display number of results
		$('.results-count-display').text(`${this.resultCount} Results`);
	}

	//Toggles the gif animation of given element to the opposite state, animate -> still || still -> animate
	toggleGifAnimation(element) {
		let src = $(element).attr('src');

		if (src.indexOf('_s.gif') === -1) {
			//This gif is animated, so stop animation
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


