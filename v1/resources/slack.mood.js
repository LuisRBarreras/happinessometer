'use strict';

var base = require('../lib/base'),
    config = require('../../config/config'),
    validate = require('validate.js'),
    moodsEnum = require('../../app/models/mood_enum'),
    moodService = require('../../app/services/mood.service')(),
    querystring = require("querystring");


module.exports = base.Resource.extend({
    needsToken: [],

    post: function() {
        var self = this;

        console.log('Request: ', self.request.body);

        var errors = validate(self.request.body, { 
            token: {
                presence: true
            },
            user_name: {
                presence: true
            },
            command: {
                presence: true
            },
            text: {
                presence: true
            }
        });

        if (errors) {
            return self.dispatchValidationErrors("There are errors", errors);
        }

        if (self.request.body.token !== config.token) {
            return self.dispatchValidationErrors("Invalid slack token");
        }

        // Parse command to execute
        var text = self.request.body.text,
            parts = text.split(' '),
            moodCommand = parts[0];

        // TODO if user is present, validate the existence of that user within the company

	if (moodCommand === 'set') {
            var moodText = parts[1];

            if (moodsEnum.indexOf(moodText) < 0) {
            	return self.response.send("Sorry, I don't know that feeling");
            }


            moodService.setMood({
                user: self.request.body.user_name,
                mood: moodText,
                comment: "I'm feeling " + moodText
            }, function(err, newMood) {
                var responseText;
    
                if (err) {
                    return self.handleError(err);
                }
    
                switch(newMood.mood) {
                    case 'love':
                        responseText = "Glad you feel " + newMood.mood + " I'd like to feel that way too! :heart_eyes:";
                        break;
                    case 'joy':
                        responseText = ":rabbit: Glad you feel " + newMood.mood;
                        break;
                    case 'normal':
                        responseText = "Normal, that's boring. You need some fun things in your life. What about this :dancer:";
                        break;
                    case 'surprise':
                        responseText = "So someone surpised you like this :scream:, or like this :astonished:"
                        break;
                    case 'sadness':
                    case 'fear':
                    case 'disgust':
                        responseText = "I now know you feel " + newMood.mood + ". Do you need to talk with someone? I could hear you!"
                        break;
                    case 'anger':
                        responseText = "Oh... If you feel " + newMood.mood + " I know someone that knowns someone.., just in case :smiling_imp:" 
                        break;
                }

                return self.response.send(responseText);
            });
        } else if (moodCommand === "get") {

            moodService.quantityReport(function(error, aggregation) {

                var url = "https://chart.googleapis.com/chart?cht=p3&chs=700x300",
                    chlValues, chdValues, extraParams, result;
			
                if (error) return self.dispatchError(error);

		chlValues = aggregation.map(function(item) { return item.mood + " (" + item.quantity + ")"});
		chdValues = aggregation.map(function(item) { return item.quantity });
		extraParams = querystring.stringify({
			chd: "t:" + chdValues.join(','),
			chl: chlValues.join('|')
                });

	        result = "<" + url + "&" + extraParams + "| Current Mood Graph> :bar_chart:";

            	return self.response.send(result);
            });
        }
    }
});
