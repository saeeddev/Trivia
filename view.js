/***********************************************************************************************************************
*   Listen for the document to load and initialize the game
 */
$(document).ready(initializeGame);

/***********************************************************************************************************************
 *   Global variables defined here.
 */

var view = new Game();
var controller = new Controller();
var model = new Model();

/***********************************************************************************************************************
*   initializeGame - Initializes the game by calling on the setupGame function in the view object
 *   @params: {undefined} none
 *   @returns: {undefined} none
 */

function initializeGame() {
    
    view.setupGame();
}

function Game(){
    var self = this;

    /*******************************************************************************************************************
     *   setupGame - Initializes the game by setting up basic view information and starting the player name entry modal.
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: setupNextQuestion, setupClickHandlers, setupTooltips, setupModalChain
     */
    this.setupGame = function(){
        self.setDBToken();
        self.setupNextQuestion();
        $('.playerOneStatusBox').addClass('activePlayer');
        $('.btn').css({'outline': 'none'});

        $('#start').modal('toggle');

        $('.mainHintContent').toggle('hidden');

        self.setupClickHandlers();
        self.setupTooltips();
        self.setupModalChain();
    };

    /**********************************************************************************
     *  setDBToken - Initiates request token for trivia database
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */

    this.setDBToken = function(){
        controller.setDBToken();
    };

    this.handleQuestionNotFound = function(data){

        this.resetDOMState();
        let error = new $('<div>').text(`No more ${data.difficulty} difficulty ${data.category} questions available, please select a different combination.`).css({'text-align': 'center', 'color': 'red' }).attr('id', 'error');

        $('#nextQuestionBody > .container > .row').prepend(error);
        $('article').toggle('hidden');
    };

    this.resetDOMState = function(){
        $('#questionCategory').text('Category');
        $('#question').text('Question');
        $('#answer1Text').text('Answer');
        $('#answer2Text').text('Answer');
        $('#answer3Text').text('Answer');
        $('#answer4Text').text('Answer');
    };

    /*******************************************************************************************************************
     *   setupClickHandlers - Attaches click handlers to all buttons in document window
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.setupClickHandlers = function(){
        $('#answer1').click(self.pressAnswerButton);
        $('#answer2').click(self.pressAnswerButton);
        $('#answer3').click(self.pressAnswerButton);
        $('#answer4').click(self.pressAnswerButton);

        $('#setPlayerInfo').click(self.handleCustomGame);

        $('.reset').click(this.reset);
        
        $(document).on('change', '#sound-toggle', null, this.handleSound);
        $(document).on('change', '#sound-toggle-min', null, this.handleSound);

        $(document).on('click', '#info', null, this.triggerInstructions);
        $(document).on('click', '#info-min', null, this.triggerInstructions);

        $(document).on('click', '#quick', null, this.handleQuick);
        $(document).on('click', '#custom', null, function(){
            $('#start').modal('toggle');
            $('#setPlayers').modal('toggle');
        });

        $(document).on('click', '#newGame', null, ()=>{
            $('#winner').modal('toggle');
        });

        $(document).on('click', '#randomQuestion', null, self.handleRandomQuestion);

        $(document).on('click', '#wiki', {type:'wiki'}, self.hintToggle);
        $(document).on('click', '#youtube', {type:'youtube'}, self.hintToggle);
        $(document).on('click', '#twitter', {type:'twitter'}, self.hintToggle);
        $(document).on('click', '#nextQuestionSubmit', null, self.getNextQuestion);
    };

    this.getStart = function(){
        $('#start').modal('toggle');
    };

    this.handleQuick = function(){
        $('#start').modal('toggle');
        self.setPlayerInfo(true);
        self.getNextQuestion();
    };

    this.handleSound = function(){
        console.log('sound switch triggered');

        if(this.id === 'sound-toggle'){
            $('#sound-toggle-min')[0].checked = !$('#sound-toggle-min')[0].checked;
        }
        else{
            $('#sound-toggle')[0].checked = !$('#sound-toggle')[0].checked;
        }
        controller.soundToggle();
    };

    /*******************************************************************************************************************
     *   setupTooltips - Attaches tooltups to hings
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.setupTooltips = function(){
        $("#wiki").tooltip({title:'Search Wikipedia for help', placement: 'bottom'});
        $("#youtube").tooltip({title:'Ask Youtube for help', placement: 'bottom'});
        $("#twitter").tooltip({title:'Ask Twitter for help', placement: 'bottom'});
        $('[data-toggle="tooltip"]').tooltip();
    };

    /*******************************************************************************************************************
     *   setupModalChain - Connects functions to modal close/hidden events
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.setupModalChain = function(){
        $('#hint').on('hidden.bs.modal', self.clearModal);
        $('#setPlayers').on('hidden.bs.modal', self.nextQuestion);
        $('#nextQuestion').on('hidden.bs.modal', self.removeAnswerResult);
        $('#winner').on('hidden.bs.modal', self.reset);
    };

    /*******************************************************************************************************************
     *   triggerInstructions - Switch instruction modal on/off
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.triggerInstructions = function(){
        $('#instructions').modal('toggle');
    };

    /*******************************************************************************************************************
     *   timeRunOutTrigger - Function callback for optional timers
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: controller.answerButtonPressed
     */
    this.timeRunOutTrigger = function(){
        console.log('Timeout has been triggered!');
        controller.answerButtonPressed('Time has run out!');
    };

    /*******************************************************************************************************************
     *   setActivePlayerStatus - Changes the status box by adding or removing the class activePlayer
     *   @params: {int} playerTurn - The current turn
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.setActivePlayerStatus = function(playerTurn){

        if(playerTurn === 0){
            $('.playerOneStatusBox').addClass('activePlayer');
            $('.playerTwoStatusBox').removeClass('activePlayer');
        }
        else {
            $('.playerOneStatusBox').removeClass('activePlayer');
            $('.playerTwoStatusBox').addClass('activePlayer');
        }
    };

    /*******************************************************************************************************************
     *   setAnswerResult - Sets the answer results in the #nextQuestion modal
     *   @params: {string} result - String indicating either correct or incorrect
     *   @params: {string} correctAnswer - A string that is the correct answer
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.setAnswerResult = function(result, correctAnswer){
        var resultIconElement = new $('<span>');
        var answerElement = new $('<span>').text(correctAnswer).css({
            'background-color': result === 'correct' ? 'white' : 'none',
            'text-shadow': result === 'correct' ? 'none' : '0 0 30px #000',
            'color': result === 'correct' ? 'black' : 'transparent'

        }).addClass(result === 'correct' ? '' : 'highlightText');
        var answerElementHolder = new $('<div>').text('The correct answer was: ').append(answerElement).addClass('answerIcon answerText col-md-12');

        if(result === 'correct'){
            resultIconElement.addClass('answerIcon col-md-1 col-md-offset-5 col-xs-12 glyphicon glyphicon-ok').css({
                'font-size':'70px',
                'color': 'green'
            });
        }
        else{
            resultIconElement.addClass('answerIcon col-md-1 col-md-offset-5 col-xs-12 glyphicon glyphicon-remove').css({
                'font-size':'70px',
                'color': 'red'
            });
        }

        $('#nextQuestionBody > .container > .row').prepend(resultIconElement).prepend(answerElementHolder);
        $('.hintButton').removeClass('disabled');
    };

    /*******************************************************************************************************************
     *   removeAnswerResult - Removes the answer results after the #nextQuestion modal is closed
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: none
     */
    this.removeAnswerResult = function(){
        $('.answerIcon').remove();
    };

    this.setGameLength = function(){
        controller.setGameLength( parseInt($("input[name=length]:checked").val()) );
    };

    this.handleCustomGame = function(){
        self.setGameLength();

        self.setPlayerInfo();
    };

    /*******************************************************************************************************************
     *   setPlayerInfo - Sets the usernames based on the #setPlayers modal input, defaults to Player 1 & if
     *   input is empty
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: controller.setPlayerInfo
     */
    this.setPlayerInfo = function(quick){

        let playerObject = [{
            name: 'P1'
        },{
            name: 'P2'
        }];

        if(quick !== undefined && quick.type !== 'click'){
            controller.setPlayerInfo(playerObject);
            return;
        }

        let name1 = $('#username1').val().slice(0,10);
        let name2 = $('#username2').val().slice(0,10);
        if(name1 === ""){
            name1 = 'P1'
        }

        if(name2 === ""){
            name2 = 'P2'
        }

        playerObject = [{
            name: name1
        },{
            name: name2
        }];

        controller.setPlayerInfo(playerObject);
    };

    /*******************************************************************************************************************
     *   getNextQuestion - Grabs the input from the #nextQuestion modal and converts it to usable data to be passed to
     *   the controller. Defaults to medium difficulty and General Knowledge category.
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: clearQuestionDiffPanel, controller.setCurrentQuestionInModel
     */
    this.getNextQuestion = function(){

        $('#error').remove();

        if($('#mainScreen').css('display') === 'none'){
            $('#mainScreen').toggle('hidden');
        }
        if($('.currentTurn').css('display') === 'none'){
            $('.currentTurn').toggle('hidden');
        }
        if($('.playerOneStatusBox, .playerTwoStatusBox').css('display') === 'none'){
            $('.playerOneStatusBox, .playerTwoStatusBox').toggle('hidden');
        }

        var raw = $('.categoryOptionList').val();
        var number = model.categories.indexOf(raw);

        var catNum = model.categoryNum[number];

        var diff = $("input[name=difficultyLevel]:checked").val();

        if(number === -1){
            catNum = 9;
        }

        if(diff === undefined){
            diff = 'medium';
        }
        var questionObject = {category:catNum, difficulty: diff};

        console.log("raw value: "+raw);
        console.log("index value: "+number);
        console.log("category number: "+catNum);
        console.log("difficulty: "+diff);

        self.clearQuestionDiffPanel();

        controller.setCurrentQuestionInModel(questionObject);

        // Uncomment next line if a time limit for guessing questions is needed
        // self.timerCountdown();
    };

    this.handleRandomQuestion = function(){

        $('#error').remove();

        if($('#mainScreen').css('display') === 'none'){
            $('#mainScreen').toggle('hidden');
        }
        if($('.currentTurn').css('display') === 'none'){
            $('.currentTurn').toggle('hidden');
        }
        if($('.playerOneStatusBox, .playerTwoStatusBox').css('display') === 'none'){
            $('.playerOneStatusBox, .playerTwoStatusBox').toggle('hidden');
        }

        self.clearQuestionDiffPanel();
        controller.setRandomQuestion();
    };

    /*******************************************************************************************************************
     *   clearQuestionDiffPanel - Clears the panel difficulty indicator
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.clearQuestionDiffPanel = function(){
        $('#questionBody').removeClass('panel-info panel-warning panel-danger panel-success');
    };

    /*******************************************************************************************************************
     *   updateQuestionDiffPanel - Updates the question panel with a bootstrap class based on the current difficulty
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.updateQuestionDiffPanel = function(diff){
        switch(diff){
            case 'easy':
                $('#questionBody').addClass('panel-success');
                break;
            case 'medium':
                $('#questionBody').addClass('panel-warning');
                break;
            case 'hard':
                $('#questionBody').addClass('panel-danger');
                break;
        }
    };

    /*******************************************************************************************************************
     *   displayPlayerNameAndAvatars - Refreshes player info
     *
     *   @params: {string} player1Name - The first player's username
     *   @params: {string} player2Name - The second player's username
     *   @returns: {undefined} none
     */
    this.displayPlayerNameAndAvatars = function(player1Name, player2Name){
        $('#playerOneName,#playerOneName-mobile').text(player1Name);
        $('#playerTwoName,#playerTwoName-mobile').text(player2Name);
        if($('#setPlayers').hasClass('in')){
            $('#setPlayers').modal('toggle');
        };

    };

    /*******************************************************************************************************************
     *   updateStatus - Refreshes player status info
     *
     *   @params: {int} turn - The current turn
     *   @params: {string} player1Points - The first player's points
     *   @params: {string} player2Points - The second player's points
     *   @returns: {undefined} none
     */
    this.updateStatus = function(turn, player1Points, player2Points){
        $('#turn,#turn-mobile').text('Player '+turn);
        $('#playerOnePoints,#playerOnePoints-mobile').text(player1Points);
        $('#playerTwoPoints,#playerTwoPoints-mobile').text(player2Points);
    };

    /*******************************************************************************************************************
     *   updateQuestion - Refreshes the current question
     *
     *   @params: {string} category - The current category
     *   @params: {string} question - The current question
     *   @returns: {undefined} none
     */
    this.updateQuestion = function(category, question){
        $('#questionCategory').text(category);
        $('#question').text(question);
    };

    /*******************************************************************************************************************
     *   updateAnswers - Inserts questions into the answer buttons
     *
     *   @params: {array} answerArray - Array containing 4 questions
     *   @returns: {undefined} none
     *   @calls: toggleMainQuizSection
     */
    this.updateAnswers = function(answerArray){
        for(var i = 0; i < 4 ; i++){
            $('#answer'+(i+1)+'Text').text(answerArray[i]);
        }

        self.toggleMainQuizSection();
    };

    /*******************************************************************************************************************
     *   toggleMainQuizSection - Toggles the main quiz section in-between question rounds
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.toggleMainQuizSection = function(){
        $('article').toggle('hidden');
    };

    /*******************************************************************************************************************
     *   pressAnswerButton - Called when an answer button has been pressed and sends the result to the controller
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: controller.answerButtonPressed
     */
    this.pressAnswerButton = function(){
        let answerNum = $(this).attr('data-value');

        controller.answerButtonPressed(answerNum);
    };

    /*******************************************************************************************************************
     *   clearModal - Clears out the hint modal information
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     *   @calls: removeLoadingIcon
     */
    this.clearModal = function(){

        $('.hint-content').css('height', 'auto');
        $('#hintBody iframe').remove();
        $('.wikiContainer').remove();
        $('.tempTwitter').remove();
        self.removeLoadingIcon();
    };

    /*******************************************************************************************************************
     *   setupNextQuestion - Dynamically creates the categories for the select input in the #selectQuestion modal
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.setupNextQuestion = function(){
        for(var i = 0; i < model.categories.length; i++){
            var newOptionElement = new $('<option>').attr('data-category', model.categoryNum[i]).text(model.categories[i]);
            $('.categoryOptionList').append(newOptionElement);
        }
    };

    /*******************************************************************************************************************
     *   nextQuestion - Triggers the #nextQuestion modal
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.nextQuestion = function(){

        $('#nextQuestion').modal('toggle');
    };

    /*******************************************************************************************************************
     *   hintToggle - Called when player clicks on a hint and triggers the appropriate controller functions in addition
     *   to revealing the hint modal. Hint buttons are deactivated until the next question round
     *
     *   @params: {string} hint - A string indicating the hint clicked
     *   @returns: {undefined} none
     *   @calls: controller.constructWikiHint, controller.constructYoutubeHint, controller.constructTwitterHint, controller.getHelpType
     */
    this.hintToggle = function(hint){
        switch(hint.data.type){
            case 'wiki':
                controller.constructWikiHint();
                controller.getHelpType("wiki");
                break;
            case 'youtube':
                controller.constructYoutubeHint();
                controller.getHelpType("youtube");
                break;
            case 'twitter':
                controller.constructTwitterHint();
                controller.getHelpType("twitter");
        }

        $('.hintButton').addClass('disabled');

        $('#hint').modal('toggle');
    };

    /*******************************************************************************************************************
     *   displayWikiHint - Displays the constructed Wikipedia hint on the hint modal
     *
     *   @params: {object} wikiElementContainer - An element containing the Wikipedia hint
     *   @returns: {undefined} none
     */
    this.displayWikiHint = function(data){
        let wikiElementContainer = data.element;

        $('#hintBody').find('.row').append(wikiElementContainer);

        let linkArray = wikiElementContainer.find('a');
        let citeTest = RegExp('#cite_note*');
        let coordTest = RegExp('tools.wmflabs.org*');
        let uploadTest = RegExp('upload.wikimedia.org*');

        for(let i = 0; i < linkArray.length; i++){

            if( citeTest.test($(wikiElementContainer.find('a')[i]).attr('href')) ){
                $(wikiElementContainer.find('a')[i]).attr(
                    'href', 'https://en.wikipedia.org/wiki/'+data.name+$(wikiElementContainer.find('a')[i]).attr('href')).attr('target', '_blank');
            }
            else if( coordTest.test($(wikiElementContainer.find('a')[i]).attr('href')) || uploadTest.test($(wikiElementContainer.find('a')[i]).attr('href')) ){
                $(wikiElementContainer.find('a')[i]).attr(
                    'href', 'https:'+$(wikiElementContainer.find('a')[i]).attr('href')).attr('target', '_blank');
            }
            else{
                $(wikiElementContainer.find('a')[i]).attr(
                    'href', 'https://en.wikipedia.org'+$(wikiElementContainer.find('a')[i]).attr('href')).attr('target', '_blank');
            }
        }

        $('p').has('.mw-ext-cite-error').remove();
    };

    /*******************************************************************************************************************
     *   displayYoutubeHint - Displays the constructed Youtube hint on the hint modal
     *
     *   @params: {object} newIFrame - An element containing the Youtube hint
     *   @returns: {undefined} none
     */
    this.displayYoutubeHint = function(newIFrame){

        $('.hint-content').css('height', '90vh');
        $('#hintBody').css('height', '80%').append(newIFrame);
    };

    /*******************************************************************************************************************
     *   displayTwitterHint - Displays the constructed Twitter hint on the hint modal
     *
     *   @params: {string} result - A html string containing the Twitter hint embed code
     *   @returns: {undefined} none
     */
    this.displayTwitterHint = function(result){
        $('.tempTwitter').html(result);
    };

    /*******************************************************************************************************************
     *   prepareLoadingIcon - Adds an animated loading icon to the hint modal while the hint is being generated
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.prepareLoadingIcon = function(){
        var bootstrapElementHolder = $('<div>').addClass('spinHolder col-xs-1 col-xs-offset-3 col-md-1 col-md-offset-5');
        var loadingIcon = $('<i>').addClass("fa fa-spinner fa-spin").css('font-size', '150px');

        bootstrapElementHolder.append(loadingIcon);

        $('#hintBody .container .row').append(bootstrapElementHolder);
    };

    /*******************************************************************************************************************
     *   removeLoadingIcon - Removes the animated loading icon
     *
     *   @params: {undefined} none
     *   @returns: {undefined} none
     */
    this.removeLoadingIcon = function(){
        $('.spinHolder').remove();
    };

    /*******************************************************************************************************************
     *   triggerWinner - Triggers the win modal
     *
     *   @params: {string} winnerName - Inserts the name into the win text if not undefined
     *   @returns: {undefined} none
     */
    this.triggerWinner = function(winnerName, points){

        if(winnerName !== undefined){
            $('#winnerText').text(winnerName);
            $('#winnerPoints').text(points);
        }
        else{
            $('#winMessage').text('Tie game!');
        }
        $('#winner').modal('toggle');
    };
    /*******************************************************************************************************************
     *   resetGame - Clears current points and restarts game
     *
     *   @params: none
     *   @returns: {undefined} none
     */
    this.reset = function(){
        controller.reset();
        model.reset();

        $('#error').remove();

        self.resetDOMState();

        $('.answerIcon').remove();

        $('#mainScreen').toggle('hidden');
        self.getStart();
        $('#playerOnePoints,#playerOnePoints-mobile').text(0);
        $('#playerTwoPoints,#playerTwoPoints-mobile').text(0);
        self.setActivePlayerStatus(0);
        $('#turn,#turn-mobile').text('Player 1');
        $('.hintButton').removeClass('disabled');
    };

}

