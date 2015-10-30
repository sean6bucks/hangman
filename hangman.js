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
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
				//TODO: Handle errors
			}
		});
	};
	// GIVE ME A WORD
	// -------------------------------
	// WORD & GUESS VARIABLES
	var currentWord,
		possibleAnswers,
		lastWord,
		// ALPHABET ARRANGED IN ORDER OF MOST COMMONLY USED
		letters = [];
		
	function giveMeAWord(){
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

				// SET FIRST GUESS TO 'A' IF UNDER 5, 'E' IF OVER
				letters = ( wordLength < 6 ) ? ['A'] : ['E'] ;

				console.log( possibleAnswers );

				// DISPLAY GAME PROMPTS
				console.log( '%cWORD #' + response.data.totalWordCount, gameHeader );
				console.log( '%cThe word is ' + currentWord , gameText );

				// START GUESSING THE WORD > IF LAST WORD SET LAST
				if ( response.data.totalWordCount === 80 ) {
					lastWord = true;
				} 

				makeAGuess();
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
				//TODO: Handle errors
			}
		});
	};

	// MAKE A GUESS
	// -------------------------------
	function makeAGuess(){
		
		console.log( '%cSending guess...', consoleText );
		
		// SEND REQUEST WITH GUESS DATA
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'guessWord',
				guess: letters[letters.length - 1]
			}),
			success: function( response ){

				console.log( '%cAJAX Successful: ', successText, response );

				var prevLetters = ( currentWord.match(/\*/gi) || [] ).length,
					lettersLeft = ( (response.data.word).match(/\*/gi) || [] ).length;

				console.log( '%cYou guessed "'+letters[letters.length - 1]+'"', gameText);

				console.log( '%c' + response.data.word, gameText);

				if ( lettersLeft === 0 ) {
					console.log( '%cYOU GOT IT!', successText);
					if ( lastWord ) { 
						getYourResults(); 
					}
					else { 
						giveMeAWord(); 
					}
				} else if ( response.data.wrongGuessCountOfCurrentWord === 10 ){
					console.log( '%cSORRY! Out of turns.', errorText);
					if ( lastWord ) { 
						getYourResults(); 
					}
					else { 
						giveMeAWord(); 
					}
				}
				else {

					currentWord = response.data.word;

					findPossibleAnswers( prevLetters, lettersLeft, currentWord, letters[letters.length - 1] );

				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
				//TODO: Handle errors
			}
		});
	};

	// GET YOUR RESULTS
	// -------------------------------

	function getYourResults(){
	// SEND REQUEST FOR RESULTS
		console.log( '%cGetting Results...', consoleText );
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
				console.log( '%cYour Final Score: ' + response.data.score, gameHeader);
				if ( response.data.score > 1200 ) {
					// submitYourResult();
					return;
				} else {
					// startGame();
					return;
				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
			}
		});
	};

	function submitYourResult(){
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'submitResult',
			}),
			success: function( response ){
				console( '%cYour Score has Been Submitted!' + response.data, gameHeader );
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
			}
		});
	};

	function findPossibleAnswers( prevLetters, lettersLeft, word, letterGuessed){

		var arr = [],
			letterReg = new RegExp( letterGuessed.toLowerCase() ),
			wordReg = word.replace( /\*/gi, "[a-z]"),
			wordReg = new RegExp( wordReg.toLowerCase() );

		if ( lettersLeft !== prevLetters ) {
			$.map( possibleAnswers, function( answer, index ){
				if ( wordReg.test( answer ) ) {
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

		findNextLetter( possibleAnswers );
	};

	function findNextLetter( possibleAnswers ) {
		var allLetters = possibleAnswers.join(''),
			letterCount = {},
			mostFreq = '';

		for( var i = 0; i < allLetters.length; i++ ) {
			
			var letter = allLetters[i];
			if( !letterCount[letter] ){
		    	letterCount[letter] = 0;
			}

			letterCount[letter]++;
			// IF LETTER HAS BEEN GUESSED, VALUE ZERO
			if( letters.indexOf( letter.toUpperCase() ) > -1 ) {
				letterCount[letter] = 0;
			};
			if( mostFreq === '' || letterCount[letter] > letterCount[mostFreq] ){
		        mostFreq = letter;
			}
		}

		letters.push( mostFreq.toUpperCase() );

		makeAGuess();
	}
});