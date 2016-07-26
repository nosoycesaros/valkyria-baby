var child_process = require('child_process');
var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=44c0f7a7-730e-42a7-86ec-3117dbc6dd72&subscription-key=1dec9c9576ea46aabdc0ed2e2613aa96&q=';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', dialog);

// Add intent handlers
dialog.matches('createProject', [
    function (session, args, next) {
        // Resolve entities passed from LUIS.
        var title = builder.EntityRecognizer.findEntity(args.entities, 'projectName');

        //Define an array of ask for name
        var askForName = [
          "What would you like to call your project?",
          "Does your project has a name? provide it",
          "Please i need a name for that"
        ];

        // Prompt for alarm name
        if (!title) {
            var askForNameNumer =  Math.floor(Math.random() * askForName.length);
            builder.Prompts.text(session, askForName[askForNameNumer]);
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            title = results.response;
        }

        if (title) {

          session.send('Creating %s...', title);

          child_process.exec('sh ./creation.sh ' + title, function(error, stdout, stderr){
            session.send('Your project %s, is ready in http://valkyria.be/projects/%l', title, title);
          });
        } else {
          session.send('I am learning right now, and can not help you');
        }
    }
  ]
);

dialog.onDefault([
  function(session, args, next){
    //Define an array for i dont understand
    var answer = [
      "I´m a little girl, ask for project creation only",
      "Valkyria only helps with development projects",
      "Thats like 'da da da' for me",
      "Sorry, my developers only put project creation tasks in me"
    ];
    var answerNumer =  Math.floor(Math.random() * answer.length);

    session.send(answer[answerNumer])
  }
]);
