'use strict'
$(function(){

	// DEBUG UI
	var gameHeader = 'background: #000; color: #D4D4D4',
		gameText = 'background: #73FFFA',
		successText = 'background: #BBFFB9; color: #494949',
		errorText = 'background: #FF8682; color: #494949',
		consoleText = 'color: #D4D4D4';

	// START GAME
	// -------------------------------
	console.log( '%cThe game is starting...', consoleText );

	// SESSION VARIABLES
	var playerId = 'sean6bucks@gmail.com',
		sessionId;

	startGame();

	function startGame(){	
		// SEND INITIAL AJAX REQUEST
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				playerId: playerId,
				action: 'startGame' 
			}),
			// ON SUCCESS HANDLE RESPONSE
			success: function( response ){
				// DEBUG
				console.log( '%cAJAX Successful: ', successText, response );
				// SAVE SESSION ID
				sessionId = response.sessionId;
				console.log( sessionId)
				// DISPLAY GAME USER PROMPTS
				console.log( '%c'+response.message, gameHeader );
				console.log( '%cYou need to guess ' + response.data.numberOfWordsToGuess + ' words to finish, You will only have ' + response.data.numberOfGuessAllowedForEachWord + ' incorrect guesses per word.', gameText );
				console.log( '%cGOOD LUCK!', 'background: #73FFFA' );

				// RUN GIVE ME A WORD AJAX CALL
				giveMeAWord();

			},
			error: function( response ){
				console.log( '%cAJAX Error: ', response.message);
				//TODO: Handle errors
			}
		});
	};
	// GIVE ME A WORD
	// -------------------------------
	// WORD & GUESS VARIABLES
	var word,
		letterToGuess,
		possibleWords,
		// ALPHABET ARRANGED IN ORDER OF MOST COMMONLY USED
		letters = [ 'E', 'S', 'I', 'A', 'R', 'N', 'T', 'O', 'L', 'C', 'D', 'U', 'P', 'M', 'Y', 'V', 'G', 'B', 'F', 'H', 'K', 'W', 'Z', 'X', 'Q', 'J' ];
		
	function giveMeAWord(){
		letterToGuess = 0;
		possibleWords = [],
		console.log( '%cFetching word...', consoleText );
		// SEND AJAX REQUEST FOR WORD
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'nextWord' 
			}),
			// HANDLE WORD RESPONSE
			success: function( response ){
				console.log( '%cAJAX Successful: ', successText, response );
				word = response.data.word;
				
				var wordlength = ( word.match(/\*/gi ) || [] ).length;
				
				// BUILD POSSIBLE WORDS BASED ON LENGTH
				$.map( allWords, function( val, index ){
					if ( val.length === wordlength ){
						possibleWords.push( val );
					}
				});

				console.log( possibleWords );

				// DISPLAY GAME PROMPTS
				console.log( '%cWORD #' + response.data.totalWordCount, gameHeader );
				console.log( '%cThe word is ' + word , gameText );

				// START GUESSING THE WORD
				if ( response.data.totalWordCount === 80 ) {
					makeAGuess( true );
				} else {
					makeAGuess();
				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', response.message);
				//TODO: Handle errors
			}
		});
	};

	// MAKE A GUESS
	// -------------------------------
	function makeAGuess( last ){
		
		console.log( '%cSending guess...', consoleText );
		
		// SEND REQUEST WITH GUESS DATA
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'guessWord',
				guess: letters[letterToGuess]
			}),
			success: function( response ){

				console.log( '%cAJAX Successful: ', successText, response );

				var prevLetters = ( word.match(/\*/gi) || [] ).length,
					lettersLeft = ( (response.data.word).match(/\*/gi) || [] ).length;

				console.log( '%cYou guessed "'+letters[letterToGuess]+'"', gameText);

				console.log( '%c' + response.data.word, gameText);

				if ( lettersLeft === 0 ) {
					console.log( '%cYOU GOT IT!', successText);
					if ( last === true ) { getYourResults(); }
					else { giveMeAWord(); }
				} else if ( response.data.wrongGuessCountOfCurrentWord === 10 ){
					console.log( '%cSORRY! Out of turns.', errorText);
					if ( last === true ) { getYourResults(); }
					else { giveMeAWord(); }
				}
				else {

					word = response.data.word;

					findPossibleWords( prevLetters, lettersLeft, word );

					letterToGuess++;
					makeAGuess();
				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', response.message);
				//TODO: Handle errors
			}
		});
	};

	// GET YOUR RESULTS
	// -------------------------------

	function getYourResults(){
	// SEND REQUEST FOR RESULTS
		console.log( '%cSending guess...', consoleText );
		// SEND REQUEST WITH GUESS DATA
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'getResult',
			}),
			success: function( response ){
				console.log( '%cYour Current Score: ' + response.data.score, gameHeader);
				if ( response.data.score > 800 ) {
					submitResult();
				} else {
					startGame();
				}
			}
		});
	};

	function submitYourRequest(){
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'submitResult',
			}),
			success: function( response ){
				console( '%cFINAL SCORE: ' + response.data.score, gameHeader );
			},
		});
	};

	function findPossibleWords( prevLetters, lettersLeft, word){

		var arr = [];
		var reg = new RegExp( letters[letterToGuess].toLowerCase() );

		if ( lettersLeft !== prevLetters ) {

			$.map( possibleWords, function( val, index ){
				if ( ( val.match(reg) || [] ).length > 0 ) {
					arr.push( val );
				}
			});

			possibleWords = arr;

			console.log( possibleWords );

		} else {

			$.map( possibleWords, function( val, index ){
				if ( ( val.match(reg) || [] ).length === 0 ) {
					arr.push( val );
				}
			});

			possibleWords = arr;

		}

	};
});