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
	var currentWord,
		letterToGuess,
		possibleAnswers,
		// ALPHABET ARRANGED IN ORDER OF MOST COMMONLY USED
		letters = [ 'E', 'S', 'I', 'A', 'R', 'N', 'T', 'O', 'L', 'C', 'D', 'U', 'P', 'M', 'Y', 'V', 'G', 'B', 'F', 'H', 'K', 'W', 'Z', 'X', 'Q', 'J' ];
		
	function giveMeAWord(){
		letterToGuess = 0;
		possibleAnswers = [],
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
				currentWord = response.data.word;
				
				var wordLength = ( currentWord.match(/\*/gi ) || [] ).length;
				
				// BUILD POSSIBLE WORDS BASED ON LENGTH
				$.map( allWords, function( word, index ){
					if ( word.length === wordLength ){
						possibleAnswers.push( word );
					}
				});

				console.log( possibleAnswers );

				// DISPLAY GAME PROMPTS
				console.log( '%cWORD #' + response.data.totalWordCount, gameHeader );
				console.log( '%cThe word is ' + currentWord , gameText );

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

				var prevLetters = ( currentWord.match(/\*/gi) || [] ).length,
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

					currentWord = response.data.word;

					findPossibleAnswers( prevLetters, lettersLeft, currentWord );

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

	function findPossibleAnswers( prevLetters, lettersLeft, word){

		var arr = [],
			letterReg = new RegExp( letters[letterToGuess].toLowerCase() ),
			wordReg = word.replace( /\*/gi, "[a-z]"),
			wordReg = new RegExp( wordReg );

		if ( lettersLeft !== prevLetters ) {
			console.log( typeof wordReg );
			$.map( possibleAnswers, function( answer, index ){
				if ( answer.search( wordReg ) >= 0 ) {
					arr.push( answer );
				}
			});

		} else {

			$.map( possibleAnswers, function( answer, index ){
				if ( ( answer.match( letterReg ) || [] ).length === 0 ) {
					arr.push( answer );
				}
			});

		}

		possibleAnswers = arr;
		console.log( possibleAnswers );

		letterToGuess++;
		makeAGuess();

	};
});