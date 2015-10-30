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
		sessionId,
		lastWord;

	startGame();

	function startGame(){
		//SET LASTWORD TO FALSE AS FALLBACK FOR MULTIPLE GAMES
		lastWord = false;	
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

				// DISPLAY GAME USER PROMPTS
				console.log( '%c'+response.message, gameHeader );
				console.log( '%cYou need to guess ' + response.data.numberOfWordsToGuess + ' words to finish, You will only have ' + response.data.numberOfGuessAllowedForEachWord + ' incorrect guesses per word.', gameText );
				console.log( '%cGOOD LUCK!', 'background: #73FFFA' );

				// RUN GIVE ME A WORD AJAX CALL
				giveMeAWord();

			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
			}
		});
	};
	// GIVE ME A WORD
	// -------------------------------
	// WORD & GUESS VARIABLES
	var currentWord,
		possibleAnswers,
		// ARRAY TO KEEP LETTERS GUESSED
		letters = [];
		
	function giveMeAWord(){
		// RESET POSSIBLE ANSWERS WITH EACH NEW WORD
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
				// FIND LENGTH BY *'S
				var wordLength = ( currentWord.match(/\*/gi ) || [] ).length;
				
				// BUILD POSSIBLE WORDS BASED ON LENGTH
				$.map( allWords, function( word, index ){
					if ( word.length === wordLength ){
						possibleAnswers.push( word );
					}
				});

				// SET FIRST GUESS TO 'A' IF UNDER 5, 'E' IF OVER
				letters = ( wordLength < 6 ) ? ['A'] : ['E'] ;

				// LOG POSSIBLE ANSWERS AT START OF WORD
				console.log( possibleAnswers );

				// DISPLAY GAME PROMPTS
				console.log( '%cWORD #' + response.data.totalWordCount, gameHeader );
				console.log( '%cThe word is ' + currentWord , gameText );

				// IF LAST WORD SET LAST TRUE
				if ( response.data.totalWordCount === 80 ) {
					lastWord = true;
				} 

				makeAGuess();
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
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

				// FIND LETTERS LEFT TO DETERMINE IF GUESS WAS CORRECT OR NOT
				var prevLetters = ( currentWord.match(/\*/gi) || [] ).length,
					lettersLeft = ( (response.data.word).match(/\*/gi) || [] ).length;

				console.log( '%cYou guessed "'+letters[letters.length - 1]+'"', gameText);

				console.log( '%c' + response.data.word, gameText);

				// HANDLING WIN / LOSE ON A WORD 

				// IF LETTERS LEFT IS NONE > YOU SOLVED THE WORD
				if ( lettersLeft === 0 ) {
					console.log( '%cYOU GOT IT!', successText);
					// IF LAST WORD GET RESULTS
					if ( lastWord ) { 
						getYourResults(); 
					}
					// OTHERWISE GET NEW WORD
					else { 
						giveMeAWord(); 
					}
				// LETTERS LEFT AND 10 WRONG GUESSES > OUT OF TURNS	
				} else if ( response.data.wrongGuessCountOfCurrentWord === 10 ){
					console.log( '%cSORRY! Out of turns.', errorText);
					// IF LAST WORD GET RESULTS
					if ( lastWord ) { 
						getYourResults(); 
					}
					// OTHERWISE GET ANOTHER WORD
					else { 
						giveMeAWord(); 
					}
				}

				// IF NOT THE END OF THE WORD > FIND NEXT LETTER TO GUESS
				else {

					currentWord = response.data.word;

					findPossibleAnswers( prevLetters, lettersLeft, currentWord, letters[letters.length - 1] );

				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
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
				console.log( '%cYour Final Score: ' + response.data.score + '!', gameHeader);

				// IF SCORE IS HIGHER THAN 1250 SUBMIT RESULTS
				if ( response.data.score > 1330 ) {
					submitYourResult();
				// OTHERWISE RUN GAME AGAIN ( I REALLY WANTED THE HIGH SCORE! )
				} else {
					startGame();
				}
			},
			error: function( response ){
				console.log( '%cAJAX Error: ', errorText, response.responseJSON.message );
			}
		});
	};

	// SUBMIT YOUR RESULTS
	// -------------------------------

	function submitYourResult(){
		// SEND REQUEST FOR SUBMIT
		$.ajax({
			url: 'https://strikingly-hangman.herokuapp.com/game/on',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sessionId: sessionId,
				action: 'submitResult',
			}),
			success: function( response ){
				console.log( '%cYour Score has Been Submitted!' + response.data, gameHeader );
				return;
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

		// IF GUESS SUCCESSFUL > COLLECT NEW SET OF POSSIBLE ANSWERS
		if ( lettersLeft !== prevLetters ) {
			$.map( possibleAnswers, function( answer, index ){
				if ( wordReg.test( answer ) ) {
					arr.push( answer );
				}
			});

		// IF GUESS WAS NOT IN WORD > REMOVE ANSWERS THAT HAVE THAT LETTER
		} else {
			$.map( possibleAnswers, function( answer, index ){
				if ( ( answer.match( letterReg ) || [] ).length === 0 ) {
					arr.push( answer );
				}
			});
		}

		// SET NEW ARRAY OF POSSIBLE ANSWERS
		possibleAnswers = arr;
		console.log( possibleAnswers );

		findNextLetter( possibleAnswers );
	};

	function findNextLetter( possibleAnswers ) {
		var allLetters = possibleAnswers.join(''),
			letterCount = {},
			mostFreq = '';

		// LOOP ALL ANSWERS LEFT FOR THE MOST FREQUENT LETTER
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

		// ADD NEXT GUESS TO THE LETTERS ARRAY TO BE GUESSED
		letters.push( mostFreq.toUpperCase() );

		makeAGuess();
	}
});