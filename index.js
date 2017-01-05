var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
//var WIT_TOKEN = '4UWV4QHZ2KWYUMUYO7VRPUVLFIA5YB7M';
//const {Wit, log} = require('node-wit');

var accessToken = '4UWV4QHZ2KWYUMUYO7VRPUVLFIA5YB7M';
var Wit = require('node-wit').Wit;
var interactive = require('node-wit').interactive;
/*try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}*/

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            if (!kittenMessage(event.sender.id, event.message.text)) {
				sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
			}
        }else if (event.postback) {
			console.log("Postback received: " + JSON.stringify(event.postback));
		}
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: 'EAAKSZAdNMP5UBAMj5STZBDZBNvWHPFBu9ZBVHb3OTQR7zD2etPlVWsZBpTRIEj7viMUPYjDZCe4ZBnxN5s9eW7jZCa35ic2ZAL1WfYfIHeJRQ6lDtvNddvqvC9CZBRd1ZBYNJUmR4UFqNvlg9PxIF3HAzhgCDVDXrTQDTZCMrxNqgQ2k9AZDZD'},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// send rich message with kitten
function kittenMessage(recipientId, text) {
    
    text = text || "";
    var values = text.split(' ');
    
    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            
            var imageUrl = "http://placekitten.com/g/" + Number(values[1]) + "/" + Number(values[2]);
            
            var message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Kitten",
                            "subtitle": "Cute kitten picture",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show kitten"
                                }, {
                                "type": "postback",
                                "title": "I like this",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
    
            sendMessage(recipientId, message);
            
            return true;
        }
    }
    
    return false;
    
};

//WIT.AI
const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    console.log('sending...', JSON.stringify(response));
  },
  getForecast({context, entities}) {
    var location = firstEntityValue(entities, 'location');
    if (location) {
      context.forecast = 'sunny in ' + location; // we should call a weather API here
      delete context.missingLocation;
    } else {
      context.missingLocation = true;
      delete context.forecast;
    }
    return context;
  },
};

//if (require.main === module) {
  //console.log("Bot testing mode.");
  const client = new Wit({accessToken, actions});
  interactive(client);
//}else {
   // console.log('required as a module');
//}
