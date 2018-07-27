function Controller()
{
    this.playerOnePoint = 0;
    this.playerTwoPoint = 0;
    this.difficultyLevel = null;
    this.help = null;

    this.reset = function(){
        this.playerOnePoint = 0;
        this.playerTwoPoint = 0;
        this.difficultyLevel = null;
        this.help = null;
        this.playerTurn = null;
        
    };

    this.setGameLength = function(length){
        model.setMaxQuestionCount(length);
    };

    this.soundToggle = function(){
        model.setSoundOnOff();
    };

    this.setDBToken = function(){
        model.getDBToken(function(token){
            console.log(`request result: ${token}`);

            if(token !== 'error'){
                model.setDBToken(token);
            }
        });
    };

    /***************************************************************************************************
     * method name: setPlayerInfo
     * functionality: get players name from playersInfo in model object and call displayPlayerNameAndAvatars method of model object
     * @params {array(playerInfoArray)}
     * @returns: nothing
     */

    this.setPlayerInfo = function(playerInfoArray){
        model.playersInfo[0].name = playerInfoArray[0].name;
        model.playersInfo[1].name = playerInfoArray[1].name;

        view.displayPlayerNameAndAvatars(model.playersInfo[0].name, model.playersInfo[1].name);
    };

    /***************************************************************************************************
     * method name: getHelpType
     * functionality: get hint which is clicked by player from view as parameter and transfer it to a number by switch statement for future calculations
     * @params {string(helpName)}
     * @returns: nothing
     */

    this.getHelpType = function(helpName)
    {
        model.setHintType(helpName);
    };

    /***************************************************************************************************
     * method name: answerButtonPressed
     * functionality: check the received address from view is correct or not + update points + changing turn by calling
      setActivePlayerStatus of view object + call updateStatus and nextQuestion methods from view object
     * @params {string(chosenAnswerText)}
     * @returns: nothing
     */

    this.answerButtonPressed = function(number){

        let chosenAnswerText = model.currentAnswerSet[number];

        var currentTurn = model.playersInfo[2];
        var winnerName = null;

        if(chosenAnswerText === model.currentAnswer){
            this.pointing(currentTurn, this.difficultyLevel, model.getHintType());
            model.resetHintType();
            model.playSoundCorrect();
            view.setAnswerResult('correct', model.currentAnswer);
            console.log('Player '+ (currentTurn+1) + ' got the question correct! Toggling next question modal!');

            if(model.questionCount === model.getMaxQuestionCount() ){
                console.log('Game has reached max questions!');
                let pointScore = null;

                if(model.playersInfo[0].points > model.playersInfo[1].points){
                    winnerName = model.playersInfo[0].name;
                    pointScore = model.playersInfo[0].points;
                }
                else if(model.playersInfo[0].points < model.playersInfo[1].points){
                    winnerName = model.playersInfo[1].name;
                    pointScore = model.playersInfo[1].points;
                }
                else{
                    winnerName = undefined;
                }

                model.gameAudioObject.pause();
                view.triggerWinner(winnerName, pointScore);
                return;
            }

            this.changeCurrentTurn();
            view.setActivePlayerStatus(model.playersInfo[2]);
            view.updateStatus(model.playersInfo[2] + 1, model.playersInfo[0].points, model.playersInfo[1].points);
            view.nextQuestion();
        }
        else{
            model.resetHintType();
            model.playSoundWrong();
            view.setAnswerResult('wrong', model.currentAnswer);
            console.log('Player '+ (currentTurn+1) + ' got the question wrong! Toggling next question modal!');

            if(model.questionCount ===  model.getMaxQuestionCount() ){
                console.log('Game has reached max questions!');
                let pointScore = null;

                if(model.playersInfo[0].points > model.playersInfo[1].points){
                    winnerName = model.playersInfo[0].name;
                    pointScore = model.playersInfo[0].points;
                }
                else if(model.playersInfo[0].points < model.playersInfo[1].points){
                    winnerName = model.playersInfo[1].name;
                    pointScore = model.playersInfo[1].points;
                }
                else{
                    winnerName = undefined;
                }

                model.gameAudioObject.pause();
                view.triggerWinner(winnerName, pointScore);
                return;
            }

            this.changeCurrentTurn();
            view.setActivePlayerStatus(model.playersInfo[2]);
            view.updateStatus(model.playersInfo[2] + 1, model.playersInfo[0].points, model.playersInfo[1].points);
            view.nextQuestion();
        }
    };

    this.setRandomQuestion = function(){
        let randomCategory = model.categoryNum[Math.floor(Math.random()*model.categoryNum.length)];
        let diffOptions = ['easy', 'medium', 'hard'];
        let randomDifficulty = diffOptions[Math.floor(Math.random()*diffOptions.length)];

        this.setCurrentQuestionInModel({category: randomCategory, difficulty: randomDifficulty});
    };

    /***************************************************************************************************
     * method name: setCurrentQuestionInModel
     * functionality: getting question objects from view as parameter which is including category and difficulty level
      and transfer it to model object by calling getTriviaQuestion and asking model to send back the generated question
     by calling back function which is placed in parameters of getTriviaQuestion method
     * @params {object(questionObject)}
     * @returns: nothing
     */
    this.setCurrentQuestionInModel = function(questionObject){

        model.updatePlayersStats(questionObject);
        this.difficultyLevel = questionObject.difficulty;

        if(questionObject === undefined){

            return false;
        }
        else{
            view.toggleMainQuizSection();

            let requestStatus = false;

            model.getTriviaQuestion(questionObject.category, questionObject.difficulty, function(dataBank){

                if(dataBank === '404'){
                    console.log('No more unique questions in current question category');
                    view.removeAnswerResult();

                    let category = model.categories[model.categoryNum.indexOf(questionObject.category)];

                    view.handleQuestionNotFound({category: category, difficulty: questionObject.difficulty});
                    return requestStatus;
                }

                model.questionCount++;
                console.log('Current question count is: '+model.questionCount);

                var fixedIncorrectAnswers = [];

                for(var i = 0; i < dataBank.incorrect_answers.length; i++){
                    fixedIncorrectAnswers.push(he.decode(dataBank.incorrect_answers[i]));
                }

                model.setCurrentQuestion(he.decode(dataBank.question));
                model.setCurrentAnswer(he.decode(dataBank.correct_answer));
                model.setCurrentWrongAnswers(fixedIncorrectAnswers);
                model.setCurrentCategory(dataBank.category);
                model.setCurrentDifficulty(dataBank.difficulty);

                view.updateQuestion(model.currentCategory, model.currentQuestion);

                var temp = model.currentWrongAnswers.slice();
                temp.push(model.currentAnswer);

                for(var i = 0; i < temp.length; i++){
                    var randomPosition = Math.floor(Math.random()*(temp.length-1));
                    var hold = temp[i];
                    temp[i] = temp[randomPosition];
                    temp[randomPosition] = hold;
                }

                model.currentAnswerSet = temp;

                view.updateQuestionDiffPanel(model.currentDifficulty);
                view.updateAnswers(temp);

                if( $('#nextQuestion').css('display') === 'block' ){
                    view.nextQuestion();
                }

                requestStatus = true;

                return requestStatus;
            });
        }
    };

    this.getPlayerName = function(avatarAddress)
    {
        model.getPlayerName(avatarAddress);
        this.changeCurrentTurn();

    };

    this.changeCurrentTurn = function()
    {
        model.playersInfo[2] = 1-model.playersInfo[2];
    };

    /***************************************************************************************************
     * method name: pointing
     * calculating the point of answer based on the difficulty level, hint for each player based on their turns and update scores
      by calling method updatePlayerInfo from model object
     * @params : (number[0 or 1](turn),string[easy,difficult, medium],number[1,2,3](help))
     * @returns: nothing
     */

    this.pointing = function(turn, difficultylevel, help)
    {
        let  basePoints = null;
        switch (difficultylevel)
        {
            case ("easy") :
                basePoints = 20;
                break;
            case ("medium") :
                basePoints = 40;
                break;
            case ("hard") :
                basePoints = 80;
                break;
        }

        if(help !== null){
            switch(help){
                case 'wiki':
                    basePoints *= 0.5;
                    break;
                case 'youtube':
                    basePoints *= 0.75;
                    break;
                case 'twitter':
                    basePoints *= 1;
                    break;
            }
        }

        if(turn === 0){
            this.playerOnePoint += basePoints;
        }
        else{
            this.playerTwoPoint += basePoints;
        }

        model.updatePlayerInfo(this.playerOnePoint,this.playerTwoPoint);

    };

    /***************************************************************************************************
     * method name: constructWikiHint
     * getting the wikipedia search result from model object by calling searchWikipedia method of model and recieve the
      result by call back function and then pass it to view by calling displayWikiHint method of modal
     * @params : empty
     * @returns: nothing
     */



    this.constructWikiHint = function(){

        this.help = 1;

        $('#hintTitle').text('Wikipedia');

        view.prepareLoadingIcon();

        var questionText = $('#question').text();

        model.searchWikipedia(questionText, model.getWikipediaText, function(result){

            var convertedHTML = new $('<div>').html(result.text);

            var wikiElementContainer = $('<div>').addClass('wikiContainer col-md-12');

            view.removeLoadingIcon();
            wikiElementContainer.html( $(convertedHTML).find('p') );

            view.displayWikiHint({element: wikiElementContainer, name: result.name});

        });
    };

    /***************************************************************************************************
     * method name: constructYoutubeHint
     * getting the youtube search result from model object by calling searchYoutube method of model and recieve the
     result by call back function and then pass it to view by calling displayYouTubeHint method of modal
     * @params : empty
     * @returns: nothing
     */

    this.constructYoutubeHint = function(){
        this.help = 2;
        $('#hintTitle').text('Youtube');

        var questionText = $('#question').text();

        view.prepareLoadingIcon();

        console.log("Question was: "+questionText);

        model.searchYoutube(questionText, function(result){
            console.log('Searched youtube!');
            // $('#hintBody').append(result);

            var newIFrame = $('<iframe>').attr({
                'src':result+'?autoplay=1',
                'height': '110%',
                'width': '100%'
            });

            view.removeLoadingIcon();
            view.displayYoutubeHint(newIFrame);

        });
    };

    this.randomThree = function(string){
        var newStringArray = [];
        var wordCount = 0;
        var newString = '';
        newStringArray = string.split(' ');
        console.log(newStringArray);

        for(var i = 0; i < 3; i++){
            newString += newStringArray[Math.floor(Math.random()*(newStringArray.length-1) )];

            if(i !== 2){
                newString+='+';
            }
        }

        return newString;
    };

    /***************************************************************************************************
     * method name: constructTwitterHint
     * getting the Twitter search result from model object by calling searchTwitter method of model and recieve the
     result by call back function and then pass it to view by calling displayWikiHint method of modal
     * @params : empty
     * @returns: nothing
     */

    this.constructTwitterHint = function() {

        this.help =3;

        $('#hintTitle').text('Twitter');

        view.prepareLoadingIcon();

        var questionText = $('#question').text();

        var answerString = "";

        for (var i = 0; i < model.currentWrongAnswers.length; i++) {
            answerString += model.currentWrongAnswers[i] + " ";
        }

        answerString += model.currentAnswer;

        console.log('answer string is: ' + answerString);

        var tempTwitterElement = new $('<div>').addClass('tempTwitter col-md-6 col-md-offset-4');

        $('.outerHintContent').append(tempTwitterElement);

        questionText = this.randomThree(questionText);


        model.searchTwitter(questionText, model.getTwitterEmbed, function (result) {
            console.log('raw embed data: ' + result);

            view.removeLoadingIcon();
            view.displayTwitterHint(result);

        });
    }


}

